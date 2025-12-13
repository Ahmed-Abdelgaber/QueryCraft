package detector

import (
	"querycraft/pkg/qcparser/internal/util"
	"strconv"
	"strings"
	"time"
)

// InferredKind represents the inferred data type
type InferredKind int

const (
	KindEmpty InferredKind = iota
	KindBool
	KindInt
	KindFloat
	KindDate
	KindText
)

// CellInference contains the inferred type and confidence
type CellInference struct {
	Kind       InferredKind
	Confidence float64 // 0..1
}

// inferCellType infers the data type of a cell value
func inferCellType(s string) CellInference {
	t := strings.TrimSpace(s)
	if t == "" || isNullToken(t) {
		return CellInference{Kind: KindEmpty, Confidence: 1.0}
	}

	if isBoolToken(t) {
		if eqFold(t, "true") || eqFold(t, "false") {
			return CellInference{Kind: KindBool, Confidence: 0.95}
		}
		return CellInference{Kind: KindBool, Confidence: 0.90}
	}

	if ok := parseIntRelaxed(t); ok {
		return CellInference{Kind: KindInt, Confidence: 0.98}
	}

	if ok := parseFloatRelaxed(t); ok {
		return CellInference{Kind: KindFloat, Confidence: 0.93}
	}

	if ok := parseDateAny(t); ok {
		return CellInference{Kind: KindDate, Confidence: 0.92}
	}

	return CellInference{Kind: KindText, Confidence: 0.60}
}

// isNullToken checks if a string represents a null value
func isNullToken(t string) bool {
	switch strings.ToLower(t) {
	case "null", "nil", "na", "n/a", "none", "-":
		return true
	default:
		return false
	}
}

// isBoolToken checks if a string represents a boolean value
func isBoolToken(t string) bool {
	switch strings.ToLower(t) {
	case "true", "false", "yes", "no", "y", "n", "0", "1":
		return true
	default:
		return false
	}
}

// eqFold does case-insensitive string comparison
func eqFold(a, b string) bool {
	return strings.EqualFold(a, b)
}

// parseIntRelaxed tries to parse a string as an integer
func parseIntRelaxed(t string) bool {
	clean := removeThousands(t)

	if strings.ContainsAny(clean, ".eE") {
		return false
	}
	_, err := strconv.ParseInt(clean, 10, 64)
	return err == nil
}

// parseFloatRelaxed tries to parse a string as a float
func parseFloatRelaxed(t string) bool {
	clean := removeThousands(t)
	_, err := strconv.ParseFloat(clean, 64)
	return err == nil
}

// removeThousands removes common thousand separators
func removeThousands(s string) string {
	r := strings.NewReplacer(",", "", "_", "", " ", "")
	return r.Replace(s)
}

// parseDateAny tries to parse a string as a date using common formats
func parseDateAny(t string) bool {
	layouts := []string{
		time.RFC3339,
		"2006-01-02",
		"2006-01-02 15:04:05",
		"02/01/2006", "01/02/2006",
		"02-01-2006", "01-02-2006",
		"02 Jan 2006", "Jan 02, 2006",
		"2006/01/02", "2006.01.02",
	}
	for _, layout := range layouts {
		if _, err := time.Parse(layout, t); err == nil {
			return true
		}
	}
	return false
}

// getCellsTypes infers the data type for each column
func getCellsTypes(lines []string, delimiter CandidateResult) []CellInference {
	candidateCellTypes := make([]CellInference, delimiter.Status.ModeColumns)
	columns := make([][]string, delimiter.Status.ModeColumns)
	freq := make(map[InferredKind]int)
	max := 0

	for _, line := range lines {
		if util.IsComment(line) {
			continue
		}
		fields, invalid := SplitLineFields(line, delimiter.Delimiter)
		if invalid || len(fields) != delimiter.Status.ModeColumns {
			continue
		}
		for i, field := range fields {
			columns[i] = append(columns[i], field)
		}
	}

	for i, column := range columns {
		for _, cell := range column {
			cellType := inferCellType(cell)
			if cellType.Kind == KindEmpty {
				continue
			}
			freq[cellType.Kind]++
			if freq[cellType.Kind] > max {
				max = freq[cellType.Kind]
				candidateCellTypes[i] = cellType
			}
		}
		freq = map[InferredKind]int{}
		max = 0
	}

	return candidateCellTypes
}

// hasHeaders detects if the first row is a header row
func hasHeaders(lines []string, delimiter CandidateResult, cellTypes []CellInference) (bool, []string) {
	candidateHeader := make([]string, 0, delimiter.Status.ModeColumns)

	for _, line := range lines {
		if util.IsComment(line) {
			continue
		}
		fields, invalid := SplitLineFields(line, delimiter.Delimiter)
		if invalid || len(fields) != delimiter.Status.ModeColumns {
			continue
		}

		candidateHeader = fields
		break
	}

	for i, cell := range candidateHeader {
		cellType := inferCellType(cell)
		if cellType.Kind != cellTypes[i].Kind {
			return true, candidateHeader
		}
	}

	return false, nil
}
