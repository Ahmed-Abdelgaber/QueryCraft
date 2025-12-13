package util

import (
	"encoding/json"
	"strings"
)

// IsComment checks if a line should be treated as a comment
func IsComment(line string) bool {
	line = strings.TrimSpace(line)
	return line == "" ||
		strings.HasPrefix(line, "#") ||
		strings.HasPrefix(line, "//") ||
		strings.HasPrefix(line, "--") ||
		strings.HasPrefix(line, "/*") ||
		strings.HasSuffix(line, "*/") ||
		strings.HasPrefix(line, "<!--") ||
		strings.HasSuffix(line, "-->")
}

// DataFormat detects the file format (csv, json, or jsonl)
func DataFormat(lines []string, maxCheckNumber int) (string, int) {
	nonEmpty := 0
	jsonlCandidate := 0
	for _, l := range lines {
		t := strings.TrimSpace(l)
		if t == "" || t == "[]" {
			continue
		}
		if IsComment(t) {
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
