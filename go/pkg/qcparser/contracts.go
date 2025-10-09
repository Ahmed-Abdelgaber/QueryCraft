package qcparser

type DetectOptions struct {
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

func DefaultDetectOptions() DetectOptions {
	return DetectOptions{
		HasHeader:       false,
		SampleBytes:     1 << 20, // 1MB
		MaxPreviewRows:  50,
		Delimiters:      []rune{',', '|', '\t', ';'},
		CommentPrefixes: []string{"#", "//", "--"},
		AssumeUTF8:      true,
		MaxLineBytes:    32 << 20, // 32MB guard
	}
}

type ParseResult struct {
	// Files
	OutPath   string `json:"out_path"`   // normalized file you will pass to DuckDB
	OutFormat string `json:"out_format"` // "jsonl"
	BytesIn   int64  `json:"bytes_in"`
	BytesOut  int64  `json:"bytes_out"`

	// Input detection snapshot (so UI can show it / save to catalog)
	Format     string `json:"format"` // detected input format
	Delimiter  string `json:"delimiter,omitempty"`
	HasHeader  bool   `json:"has_header"`
	Comment    string `json:"comment,omitempty"`
	FieldCount int    `json:"field_count"`
	TrimFields bool   `json:"trim_fields"`
	Encoding   string `json:"encoding"` // "utf-8"

	// Schema + mapping
	Columns []Column `json:"columns"` // final column names/types
	// HeaderMapping []NameMap      `json:"header_mapping,omitempty"` // source→sanitized

	// Quality & stats (power instant filters and health badges)
	// RowsIn        int64    `json:"rows_in"`
	// RowsOut       int64    `json:"rows_out"`
	// MalformedRows int64    `json:"malformed_rows"`
	// NullCounts    []int64  `json:"null_counts"` // aligned with Columns
	// MinMax        []MinMax `json:"min_max"`     // per column if numeric/date
	// TopK          []TopK   `json:"topk"`        // per text column (small, e.g., k=10)

	// Convenience preview (for UI without immediate DuckDB call)
	Preview Preview `json:"preview"` // up to N rows (e.g., 50–200)

	// Diagnostics
	Issues     []Issue `json:"issues"`
	Confidence float64 `json:"confidence"`
	DurationMs int64   `json:"duration_ms"`
}

type Column struct {
	Name string `json:"name"`
	Type string `json:"type"` // INT | DOUBLE | DATE | TIMESTAMP | BOOLEAN | TEXT
}

type Preview struct {
	Rows        int        `json:"rows"`
	Data        [][]string `json:"data"`
	InvalidRows int        `json:"invalid_rows"`
}

type Issue struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type SampledMeta struct {
	Lines      int   `json:"lines"`
	Bytes      int64 `json:"bytes"`
	DurationMs int64 `json:"duration_ms"`
}

type DetectResponse struct {
	Format     string      `json:"format"` // csv | jsonl | json
	Encoding   string      `json:"encoding"`
	Delimiter  []string    `json:"delimiter,omitempty"`
	Comment    *string     `json:"comment,omitempty"`
	FieldCount int         `json:"field_count"`
	TrimFields bool        `json:"trim_fields"`
	Columns    []Column    `json:"columns"`
	Preview    Preview     `json:"preview"`
	Confidence float64     `json:"confidence"`
	Issues     []Issue     `json:"issues"`
	Sampled    SampledMeta `json:"sampled"`
	DurationMs int64       `json:"duration_ms"`
}

type ErrorResponse struct {
	Error struct {
		Code    string      `json:"code"`
		Message string      `json:"message"`
		Details interface{} `json:"details,omitempty"`
	} `json:"error"`
}

type LineAnalysis struct {
	FieldCount    int
	Invalid       bool
	QuoteAffected bool
}

type DelimiterAnalysis struct {
	NumberOfLines      int
	ValidCount         int
	InvalidCount       int
	FieldCounts        []int
	QuoteAffectedCount int
}

type DelimStatus struct {
	ModeColumns       int
	ModeCoverage      float64
	FieldCountStdDev  float64
	InvalidRate       float64
	QuoteAffectedRate float64

	TotalLines int
	ValidCount int
}

type ScoreWeights struct {
	CoverageWeight float64
	SpreadWeight   float64
	InvalidWeight  float64
	QuoteWeight    float64
}

func DefaultScoreWeights() ScoreWeights {
	return ScoreWeights{
		CoverageWeight: 0.65,
		SpreadWeight:   0.20,
		InvalidWeight:  0.15,
		QuoteWeight:    0.10,
	}
}

type CandidateResult struct {
	Delimiter rune
	Stats     DelimStatus
	Score     float64
	Pass      bool
}
