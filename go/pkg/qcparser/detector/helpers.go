package detector

import (
	"querycraft/pkg/qcparser/internal/util"
	"querycraft/pkg/qcparser/types"
	"strings"
)

// inferredKindToColumnType maps InferredKind to column type string
func inferredKindToColumnType(kind InferredKind) string {
	switch kind {
	case KindBool:
		return "BOOLEAN"
	case KindInt:
		return "INT"
	case KindFloat:
		return "DOUBLE"
	case KindDate:
		return "TIMESTAMP"
	case KindEmpty:
		return "TEXT"
	default:
		return "TEXT"
	}
}

// inferJSONType infers column type from JSON value
func inferJSONType(val interface{}) string {
	switch v := val.(type) {
	case bool:
		return "BOOLEAN"
	case float64:
		// JSON numbers are always float64
		if v == float64(int64(v)) {
			return "INT"
		}
		return "DOUBLE"
	case string:
		return "TEXT"
	case nil:
		return "TEXT"
	default:
		return "TEXT"
	}
}

// generatePreview creates preview data from CSV lines
func generatePreview(lines []string, delimiter CandidateResult, columns []types.Column, hasHeader bool, maxRows int) types.Preview {
	preview := types.Preview{
		Data: make([]map[string]string, 0, maxRows),
	}

	skippedHeader := false
	invalidCount := 0

	for _, line := range lines {
		if util.IsComment(line) {
			continue
		}

		fields, invalid := splitLineFields(line, delimiter.Delimiter)

		// Skip invalid rows or rows with wrong field count
		if invalid || len(fields) != delimiter.Status.ModeColumns {
			invalidCount++
			continue
		}

		// Skip header row if present (only after validation)
		if hasHeader && !skippedHeader {
			skippedHeader = true
			continue
		}

		if len(preview.Data) >= maxRows {
			break
		}

		// Build object with column names as keys
		row := make(map[string]string)
		for i, field := range fields {
			if i < len(columns) {
				row[columns[i].Name] = strings.TrimSpace(field)
			}
		}
		preview.Data = append(preview.Data, row)
	}

	preview.Rows = len(preview.Data)
	preview.InvalidRows = invalidCount

	return preview
}

// calculateConfidence computes overall detection confidence
func calculateConfidence(winner CandidateResult, decision Decision) float64 {
	baseConfidence := winner.Status.ModeCoverage

	// Reduce confidence if invalid rate is high
	if winner.Status.InvalidRate > 0.05 {
		baseConfidence *= (1.0 - winner.Status.InvalidRate)
	}

	// Reduce confidence if delimiter detection is ambiguous
	if decision.IsAmbiguous {
		baseConfidence *= 0.85
	}

	// Cap between 0 and 1
	if baseConfidence > 1.0 {
		baseConfidence = 1.0
	}
	if baseConfidence < 0.0 {
		baseConfidence = 0.0
	}

	return baseConfidence
}
