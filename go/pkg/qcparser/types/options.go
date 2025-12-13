package types

// Options contains configuration for file detection
type Options struct {
	Format          string   `json:"force_format"`
	HasHeader       bool     `json:"has_header"`
	FieldCount      int      `json:"field_count"`
	SampleBytes     int64    `json:"sample_bytes"`
	MaxPreviewRows  int      `json:"max_preview_rows"`
	Delimiters      []rune   `json:"delimiters"`
	CommentPrefixes []string `json:"comment_prefixes"`
	AssumeUTF8      bool     `json:"assume_utf8"`
	MaxLineBytes    int      `json:"max_line_bytes"`
}

// DefaultOptions returns default detection options
func DefaultOptions() Options {
	return Options{
		HasHeader:       false,
		SampleBytes:     1 << 20, // 1MB
		MaxPreviewRows:  50,
		Delimiters:      []rune{',', '|', '\t', ';'},
		CommentPrefixes: []string{"#", "//", "--"},
		AssumeUTF8:      true,
		MaxLineBytes:    32 << 20, // 32MB guard
	}
}
