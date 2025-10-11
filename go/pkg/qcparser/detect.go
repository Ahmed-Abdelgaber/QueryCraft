package qcparser

import (
	"bufio"
	"encoding/json"
	"errors"
	"io"
	"math"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

func (p *Parser) Detect() (DetectResponse, error) {
	start := time.Now()
	file, err := os.Open(p.file)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	lines, _, err := getLines(file, p.opt.SampleBytes, p.opt.MaxLineBytes)

	if err != nil {
		panic(err)
	}

	if !isUTF8(lines) {
		panic("Not UTF8")
	}

	trimBOM(lines)

	format, _ := dataFormat(lines, p.opt.MaxPreviewRows)
	switch format {
	case "json", "jsonl":
		return DetectResponse{
			Format:     format,
			Encoding:   "utf-8",
			DurationMs: DurationMs(start),
		}, nil
	case "csv":
		delimiters := getCSVDelimiter(lines, p.opt.Delimiters)
		return DetectResponse{
			Format:     format,
			Encoding:   "utf-8",
			Delimiter:  delimiters,
			DurationMs: DurationMs(start),
		}, nil
	}

	return DetectResponse{}, errors.New("unreachable")
}

func getLines(r io.Reader, maxBytes int64, maxLine int) ([]string, int64, error) {
	reader := bufio.NewReaderSize(r, 1<<20) // 1MB buffer
	var lines []string
	var total int64
	for {
		if (maxBytes > 0 && total >= maxBytes) || (maxLine > 0 && len(lines) >= maxLine) {
			break
		}
		line, size, err := readLine(reader)
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return lines, total, err
		}
		total += size
		lines = append(lines, line)
	}
	return lines, total, nil
}

func readLine(reader *bufio.Reader) (string, int64, error) {
	line, isPrefix, err := reader.ReadLine()
	if err != nil {
		return "", 0, err
	}

	if !isPrefix {
		return string(line), int64(len(line)), nil
	}

	buff := make([]byte, 0, len(line)*3)
	buff = append(buff, line...)

	for isPrefix {
		frag, cont, err := reader.ReadLine()
		if err != nil {
			return "", 0, err
		}
		isPrefix = cont
		buff = append(buff, frag...)
	}

	return string(buff), int64(len(buff)), nil
}

func isUTF8(lines []string) bool {
	for _, l := range lines {
		if !utf8.ValidString(l) {
			return false
		}
	}
	return true
}

func trimBOM(lines []string) {
	if len(lines) == 0 {
		return
	}
	if after, ok := strings.CutPrefix(lines[0], "\uFEFF"); ok {
		lines[0] = after
	}
}

func isComment(line string) bool {
	line = strings.TrimSpace(line)
	return line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "//") || strings.HasPrefix(line, "--") || strings.HasPrefix(line, "/*") || strings.HasSuffix(line, "*/") || strings.HasPrefix(line, "<!--") || strings.HasSuffix(line, "-->")
}

func dataFormat(lines []string, maxCheckNumber int) (string, int) {
	nonEmpty := 0
	jsonlCandidate := 0
	for _, l := range lines {
		t := strings.TrimSpace(l)
		if t == "" || t == "[]" {
			continue
		}
		if isComment(t) {
			continue
		}
		nonEmpty++
		if strings.HasPrefix(t, "{") {
			var js map[string]any
			if json.Unmarshal([]byte(t), &js) == nil {
				jsonlCandidate++
				if jsonlCandidate >= maxCheckNumber {
					return "jsonl", jsonlCandidate
				}
			}
		}
		if strings.HasPrefix(t, "[") {
			// likely JSON array
			return "json", 0
		}
		if nonEmpty >= maxCheckNumber {
			break
		}
	}
	return "csv", 0
}

func analyzeLine(line string, delimiter rune) LineAnalysis {
	q := '"'
	inQuote := false
	fieldCount := 1
	quoteAffected := false

	runes := []rune(line)

	for i := 0; i < len(runes); i++ {
		ch := runes[i]

		if ch == q {
			if inQuote && i+1 < len(runes) && runes[i+1] == q {
				i++
				continue
			}
			inQuote = !inQuote
			continue
		}

		if ch == delimiter {
			if inQuote {
				quoteAffected = true
			} else {
				fieldCount++
			}
			continue
		}

	}

	invalid := inQuote

	return LineAnalysis{
		FieldCount:    fieldCount,
		Invalid:       invalid,
		QuoteAffected: quoteAffected && !invalid,
	}
}

func getMode(fieldsCount []int) (int, int) {
	freq := make(map[int]int)
	max := 0
	key := 0

	for _, v := range fieldsCount {
		freq[v] = freq[v] + 1
	}

	for k, v := range freq {
		if v > max {
			max = v
			key = k
		}
	}
	return key, max
}

func analyzeDelimiter(lines []string, delimiter rune) DelimiterAnalysis {
	analysis := DelimiterAnalysis{
		NumberOfLines: len(lines),
		FieldCounts:   make([]int, 0, len(lines)),
	}

	for _, line := range lines {
		if isComment(line) {
			continue
		}
		res := analyzeLine(line, delimiter)

		if res.Invalid {
			analysis.InvalidCount++
			continue
		}

		analysis.ValidCount++
		analysis.FieldCounts = append(analysis.FieldCounts, res.FieldCount)
		if res.QuoteAffected {
			analysis.QuoteAffectedCount++
		}
	}

	return analysis
}

func getDelimiterStatus(analysis DelimiterAnalysis) DelimStatus {
	squaredDiff := make([]float64, 0, len(analysis.FieldCounts))
	status := DelimStatus{
		InvalidRate:       float64(analysis.InvalidCount) / float64(analysis.NumberOfLines),
		QuoteAffectedRate: float64(analysis.QuoteAffectedCount) / float64(analysis.NumberOfLines),
		TotalLines:        analysis.NumberOfLines,
		ValidCount:        analysis.ValidCount,
	}

	if analysis.ValidCount == 0 {
		return status
	}

	maxFieldsNumber, maxFieldsNumberCount := getMode(analysis.FieldCounts)

	status.ModeColumns = maxFieldsNumber

	status.ModeCoverage = float64(maxFieldsNumberCount) / float64(status.ValidCount)

	mean := float64(Sum(analysis.FieldCounts)) / float64(status.ValidCount)
	for _, count := range analysis.FieldCounts {
		diff := (float64(count) - mean)
		squaredDiff = append(squaredDiff, diff*diff)
	}
	status.FieldCountStdDev = math.Sqrt(Sum(squaredDiff) / float64(status.ValidCount))

	return status
}

func meetsConstraints(s DelimStatus) bool {
	return s.ModeColumns >= 2 && s.ModeCoverage >= 0.80
}

func computeScore(s DelimStatus, w ScoreWeights) float64 {
	return w.CoverageWeight*s.ModeCoverage -
		w.SpreadWeight*s.FieldCountStdDev -
		w.InvalidWeight*s.InvalidRate +
		w.QuoteWeight*s.QuoteAffectedRate
}

func compare(a, b CandidateResult) bool {
	if a.Score != b.Score {
		return a.Score > b.Score
	}

	if a.Status.ModeColumns != b.Status.ModeColumns {
		return a.Status.ModeColumns > b.Status.ModeColumns
	}
	return a.Status.ModeCoverage > b.Status.ModeCoverage
}

func getWinners(candidates []CandidateResult) Decision {
	passed := make([]CandidateResult, 0, len(candidates))

	for _, c := range candidates {
		if c.Pass {
			passed = append(passed, c)
		}
	}

	decision := Decision{
		EligibleCount:  len(passed),
		CandidateCount: len(candidates),
	}

	if len(passed) >= 1 {
		sort.Slice(passed, func(i, j int) bool { return compare(passed[i], passed[j]) })
		decision.Winner = passed[0]
		if len(passed) >= 2 {
			decision.RunnerUp = passed[1]
			decision.AmbiguityEpsilon = math.Abs(decision.Winner.Score - decision.RunnerUp.Score)
			decision.IsAmbiguous = decision.AmbiguityEpsilon < 0.05
		}
		return decision
	}

	sort.Slice(candidates, func(i, j int) bool { return compare(candidates[i], candidates[j]) })
	decision.Winner = candidates[0]
	if len(candidates) >= 2 {
		decision.RunnerUp = candidates[1]
		decision.AmbiguityEpsilon = math.Abs(decision.Winner.Score - decision.RunnerUp.Score)
		decision.IsAmbiguous = true
	}
	return decision
}

func getCSVDelimiter(lines []string, delimiters []rune) []CandidateResult {
	candidates := make([]CandidateResult, 0, len(delimiters))
	for _, d := range delimiters {
		analysis := analyzeDelimiter(lines, d)
		status := getDelimiterStatus(analysis)
		candidates = append(candidates, CandidateResult{
			Delimiter: d,
			Status:    status,
			Score:     computeScore(status, DefaultScoreWeights()),
			Pass:      meetsConstraints(status),
		})
	}

	winners := getWinners(candidates)

	return []CandidateResult{winners.Winner, winners.RunnerUp}
}

func splitLineFields(line string, delim rune) (fields []string, invalid bool) {
	const dq = '"'
	inQuotes := false
	var buf []rune

	runes := []rune(line)
	for i := 0; i < len(runes); i++ {
		ch := runes[i]

		if ch == '\r' {
			continue
		}

		if ch == dq {

			if inQuotes && i+1 < len(runes) && runes[i+1] == dq {
				buf = append(buf, dq)
				i++
			} else {
				inQuotes = !inQuotes
			}
			continue
		}

		if ch == delim {
			if inQuotes {

				buf = append(buf, ch)
			} else {

				fields = append(fields, string(buf))
				buf = buf[:0]
			}
			continue
		}

		buf = append(buf, ch)
	}

	fields = append(fields, string(buf))

	invalid = inQuotes
	return fields, invalid
}

type InferredKind int

const (
	KindEmpty InferredKind = iota
	KindBool
	KindInt
	KindFloat
	KindDate
	KindText
)

type CellInference struct {
	Kind       InferredKind
	Confidence float64 // 0..1
}

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

func isNullToken(t string) bool {
	switch strings.ToLower(t) {
	case "null", "nil", "na", "n/a", "none", "-":
		return true
	default:
		return false
	}
}

func isBoolToken(t string) bool {
	switch strings.ToLower(t) {
	case "true", "false", "yes", "no", "y", "n", "0", "1":
		return true
	default:
		return false
	}
}

func eqFold(a, b string) bool { return strings.EqualFold(a, b) }

func parseIntRelaxed(t string) bool {

	clean := removeThousands(t)

	if strings.ContainsAny(clean, ".eE") {
		return false
	}
	_, err := strconv.ParseInt(clean, 10, 64)
	return err == nil
}

func parseFloatRelaxed(t string) bool {
	clean := removeThousands(t)

	_, err := strconv.ParseFloat(clean, 64)
	return err == nil
}

func removeThousands(s string) string {

	r := strings.NewReplacer(",", "", "_", "", " ", "")
	return r.Replace(s)
}

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

func getCellsTypes(lines []string, delimiter CandidateResult) []CellInference {
	candidateCellTypes := make([]CellInference, delimiter.Status.ModeColumns)
	columns := make([][]string, delimiter.Status.ModeColumns)
	freq := make(map[InferredKind]int)
	max := 0
	for _, line := range lines {
		if isComment(line) {
			continue
		}
		fields, invalid := splitLineFields(line, delimiter.Delimiter)
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

func hasHeaders(lines []string, delimiter CandidateResult, cellTypes []CellInference) (bool, []string) {
	candidateHeader := make([]string, 0, delimiter.Status.ModeColumns)
	for _, line := range lines {
		if isComment(line) {
			continue
		}
		fields, invalid := splitLineFields(line, delimiter.Delimiter)
		if invalid || len(fields) != delimiter.Status.ModeColumns {
			continue
		}

		candidateHeader = fields
		break
	}

	for i, cell := range candidateHeader {
		cellType := inferCellType(cell)
		if cellType.Kind != cellTypes[i].Kind {
			return false, nil
		}
	}

	return true, candidateHeader
}
