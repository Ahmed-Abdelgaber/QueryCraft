package util

import (
	"strings"
	"unicode/utf8"
)

// IsUTF8 checks if all lines are valid UTF-8
func IsUTF8(lines []string) bool {
	for _, l := range lines {
		if !utf8.ValidString(l) {
			return false
		}
	}
	return true
}

// TrimBOM removes UTF-8 BOM from the first line if present
func TrimBOM(lines []string) {
	if len(lines) == 0 {
		return
	}
	if after, ok := strings.CutPrefix(lines[0], "\uFEFF"); ok {
		lines[0] = after
	}
}
