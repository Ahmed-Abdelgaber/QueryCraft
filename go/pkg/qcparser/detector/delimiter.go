package detector

import (
	"math"
	"querycraft/pkg/qcparser/internal/util"
	"sort"
	"strings"
)

// analyzeLine analyzes a single line for delimiter characteristics
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

// getMode returns the most frequently appearing value and its count
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

// analyzeDelimiter analyzes all lines for a specific delimiter
func analyzeDelimiter(lines []string, delimiter rune) DelimiterAnalysis {
	analysis := DelimiterAnalysis{
		NumberOfLines: len(lines),
		FieldCounts:   make([]int, 0, len(lines)),
	}

	for _, line := range lines {
		if util.IsComment(line) {
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

// getDelimiterStatus computes statistical metrics for delimiter analysis
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

	mean := float64(util.Sum(analysis.FieldCounts)) / float64(status.ValidCount)
	for _, count := range analysis.FieldCounts {
		diff := (float64(count) - mean)
		squaredDiff = append(squaredDiff, diff*diff)
	}
	status.FieldCountStdDev = math.Sqrt(util.Sum(squaredDiff) / float64(status.ValidCount))

	return status
}

// meetsConstraints checks if delimiter status meets minimum requirements
func meetsConstraints(s DelimStatus) bool {
	return s.ModeColumns >= 2 && s.ModeCoverage >= 0.80
}

// computeScore calculates weighted score for delimiter
func computeScore(s DelimStatus, w ScoreWeights) float64 {
	return w.CoverageWeight*s.ModeCoverage -
		w.SpreadWeight*s.FieldCountStdDev -
		w.InvalidWeight*s.InvalidRate +
		w.QuoteWeight*s.QuoteAffectedRate
}

// compare returns true if candidate a is better than b
func compare(a, b CandidateResult) bool {
	if a.Score != b.Score {
		return a.Score > b.Score
	}

	if a.Status.ModeColumns != b.Status.ModeColumns {
		return a.Status.ModeColumns > b.Status.ModeColumns
	}
	return a.Status.ModeCoverage > b.Status.ModeCoverage
}

// getWinners selects the best delimiter candidates
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

// getCSVDelimiter detects the best CSV delimiter from candidates
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

// splitLineFields parses a CSV line into fields
func SplitLineFields(line string, delim rune) (fields []string, invalid bool) {
	const dq = '"'
	inQuotes := false
	var current strings.Builder
	fields = make([]string, 0, 4)

	runes := []rune(line)

	for i := 0; i < len(runes); i++ {
		ch := runes[i]

		if ch == dq {
			if inQuotes && i+1 < len(runes) && runes[i+1] == dq {
				current.WriteRune(dq)
				i++
				continue
			}
			inQuotes = !inQuotes
			continue
		}

		if ch == delim && !inQuotes {
			fields = append(fields, current.String())
			current.Reset()
			continue
		}

		current.WriteRune(ch)
	}

	fields = append(fields, current.String())
	invalid = inQuotes

	return fields, invalid
}
