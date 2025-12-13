package detector

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"querycraft/pkg/qcparser/internal/util"
	"querycraft/pkg/qcparser/types"
	"strconv"
	"strings"
	"time"
)

// detectCSV performs CSV format detection and analysis
func detectCSV(lines []string, bytesRead int64, opts *types.Options, start time.Time) (*types.DetectResponse, error) {
	var issues []types.Issue

	// Get delimiter candidates
	candidates := getCSVDelimiter(lines, opts.Delimiters)
	decision := getWinners(candidates)

	if len(candidates) == 0 {
		return nil, errors.New("no valid delimiter found")
	}

	winner := decision.Winner

	// Check for ambiguous delimiter detection
	if decision.IsAmbiguous {
		issues = append(issues, types.Issue{
			Code:    "AMBIGUOUS_DELIMITER",
			Message: "Multiple delimiters have similar scores, detection may be uncertain",
		})
	}

	// Flag high invalid rate
	if winner.Status.InvalidRate > 0.1 {
		issues = append(issues, types.Issue{
			Code:    "HIGH_INVALID_RATE",
			Message: "More than 10% of lines have invalid formatting",
		})
	}

	// Infer column types
	cellTypes := getCellsTypes(lines, winner)

	// Detect headers
	hasHeader, headerNames := hasHeaders(lines, winner, cellTypes)

	// Build columns
	columns := make([]types.Column, winner.Status.ModeColumns)
	for i := 0; i < winner.Status.ModeColumns; i++ {
		colName := ""
		if hasHeader && i < len(headerNames) {
			colName = strings.TrimSpace(headerNames[i])
			if colName == "" {
				colName = "col" + strconv.Itoa(i+1)
			}
		} else {
			colName = "col" + strconv.Itoa(i+1)
		}

		colType := "TEXT"
		if i < len(cellTypes) {
			colType = inferredKindToColumnType(cellTypes[i].Kind)
		}

		columns[i] = types.Column{
			Name: colName,
			Type: colType,
		}
	}

	// Generate preview
	preview := generatePreview(lines, winner, columns, hasHeader, opts.MaxPreviewRows)

	// Detect comment prefix
	var commentPrefix *string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		for _, prefix := range opts.CommentPrefixes {
			if strings.HasPrefix(trimmed, prefix) {
				commentPrefix = &prefix
				break
			}
		}
		if commentPrefix != nil {
			break
		}
	}

	// Calculate confidence
	confidence := calculateConfidence(winner, decision)
	confidence = math.Round(confidence*100) / 100 // Round to 2 decimals

	// Create simplified delimiter info for response
	// Convert coverage to percentage with 2 decimal places
	coveragePct := math.Round(winner.Status.ModeCoverage*100*100) / 100
	delimiterInfo := &types.DelimiterInfo{
		Delimiter:     string(winner.Delimiter),
		ConfidencePct: coveragePct,
	}

	return &types.DetectResponse{
		Format:     "csv",
		Encoding:   "utf-8",
		Delimiter:  delimiterInfo,
		Comment:    commentPrefix,
		HasHeader:  hasHeader,
		FieldCount: winner.Status.ModeColumns,
		TrimFields: true,
		Columns:    columns,
		Preview:    preview,
		Confidence: confidence,
		Issues:     issues,
		Sampled: types.SampledMeta{
			Lines:      len(lines),
			Bytes:      bytesRead,
			DurationMs: util.DurationMs(start),
		},
		DurationMs: util.DurationMs(start),
	}, nil
}

// detectJSON performs JSON/JSONL format detection and analysis
func detectJSON(lines []string, bytesRead int64, format string, opts *types.Options, start time.Time) (*types.DetectResponse, error) {
	var issues []types.Issue
	var columns []types.Column
	var preview types.Preview

	validLines := 0
	invalidLines := 0
	previewData := make([]map[string]string, 0, opts.MaxPreviewRows)
	schemaMap := make(map[string]string)
	columnOrder := make([]string, 0)

	// Parse JSON lines to infer schema
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || util.IsComment(trimmed) {
			continue
		}

		if format == "jsonl" && strings.HasPrefix(trimmed, "{") {
			var obj map[string]interface{}
			if err := json.Unmarshal([]byte(trimmed), &obj); err == nil {
				validLines++
				// Infer types from first valid object
				if len(schemaMap) == 0 {
					for key, val := range obj {
						schemaMap[key] = inferJSONType(val)
						columnOrder = append(columnOrder, key)
					}
				}
				// Add to preview
				if len(previewData) < opts.MaxPreviewRows {
					row := make(map[string]string)
					for key := range schemaMap {
						if val, ok := obj[key]; ok {
							row[key] = fmt.Sprint(val)
						} else {
							row[key] = ""
						}
					}
					previewData = append(previewData, row)
				}
			} else {
				invalidLines++
			}
		} else if format == "json" && strings.HasPrefix(trimmed, "[") {
			// Handle JSON array
			var arr []map[string]interface{}
			if err := json.Unmarshal([]byte(trimmed), &arr); err == nil {
				validLines = len(arr)
				if len(arr) > 0 {
					for key, val := range arr[0] {
						schemaMap[key] = inferJSONType(val)
						columnOrder = append(columnOrder, key)
					}
					// Generate preview from array
					maxRows := util.Min(len(arr), opts.MaxPreviewRows)
					for i := 0; i < maxRows; i++ {
						row := make(map[string]string)
						for key := range schemaMap {
							if val, ok := arr[i][key]; ok {
								row[key] = fmt.Sprint(val)
							} else {
								row[key] = ""
							}
						}
						previewData = append(previewData, row)
					}
				}
			}
			break
		}

		if i >= opts.MaxPreviewRows*2 {
			break
		}
	}

	// Build columns from schema
	for _, key := range columnOrder {
		columns = append(columns, types.Column{
			Name: key,
			Type: schemaMap[key],
		})
	}

	preview = types.Preview{
		Rows:        len(previewData),
		Data:        previewData,
		InvalidRows: invalidLines,
	}

	// Calculate confidence
	confidence := 0.9
	if validLines > 0 {
		confidence = float64(validLines) / float64(validLines+invalidLines)
	}
	confidence = math.Round(confidence*100) / 100 // Round to 2 decimals

	if invalidLines > 0 {
		issues = append(issues, types.Issue{
			Code:    "INVALID_JSON_LINES",
			Message: "Some lines could not be parsed as valid JSON",
		})
	}

	return &types.DetectResponse{
		Format:     format,
		Encoding:   "utf-8",
		Columns:    columns,
		Preview:    preview,
		Confidence: confidence,
		Issues:     issues,
		Sampled: types.SampledMeta{
			Lines:      len(lines),
			Bytes:      bytesRead,
			DurationMs: util.DurationMs(start),
		},
		DurationMs: util.DurationMs(start),
	}, nil
}
