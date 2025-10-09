package qcparser

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
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
	case "json":
	case "jsonl":
		return DetectResponse{
			Format:     format,
			Encoding:   "utf-8",
			DurationMs: DurationMs(start),
		}, nil
	case "csv":
		delimiter := detectCSVDelimiters(lines, p.opt.Delimiters, p.opt.MaxPreviewRows)
		return DetectResponse{
			Format:     format,
			Encoding:   "utf-8",
			Delimiter:  delimiter,
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
		if maxBytes > 0 && total >= maxBytes || maxLine > 0 && len(lines) > maxLine {
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

	return string(buff), int64(len(line)), nil
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

func detectCSVDelimiters(lines []string, delimiters []string, maxCheckNumber int) []string {
	scannedLines := 0
	stopAfter := maxCheckNumber
	delimiter := make(map[string]int)
	newDelimitersThisLine := false
	maxLines := len(lines)
	foundDelimiters := make([]string, 0, len(delimiters))
	for _, l := range lines {
		if isComment(l) {
			continue
		}
		scannedLines++
		if scannedLines > stopAfter || scannedLines > maxLines {
			break
		}
		for _, d := range delimiters {
			count := strings.Count(l, d)
			if count > 0 && delimiter[d] == 0 {
				newDelimitersThisLine = true
			}
			delimiter[d] += count
		}
		if newDelimitersThisLine {
			stopAfter += maxCheckNumber
		}
		newDelimitersThisLine = false
	}

	for _, k := range delimiters {
		fmt.Println(k, delimiter[k])

		if delimiter[k] > 0 {
			foundDelimiters = append(foundDelimiters, k)
		}
	}

	fmt.Println("Delimiter counts:", foundDelimiters)

	return foundDelimiters
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

func getCSVDelimiter(lines []string, delimiters []rune) {
	candidates := make([]CandidateResult, 0, len(delimiters))
	for _, d := range delimiters {
		analysis := analyzeDelimiter(lines, d)
		status := getDelimiterStatus(analysis)
		candidates = append(candidates, CandidateResult{
			Delimiter: d,
			Stats:     status,
			Score:     computeScore(status, DefaultScoreWeights()),
			Pass:      meetsConstraints(status),
		})

	}
}
