package types

// DetectResponse is the result of file format detection
type DetectResponse struct {
	Format     string         `json:"format"` // csv | jsonl | json
	Encoding   string         `json:"encoding"`
	Delimiter  *DelimiterInfo `json:"delimiter,omitempty"`
	Comment    *string        `json:"comment,omitempty"`
	HasHeader  bool           `json:"has_header"`
	FieldCount int            `json:"field_count"`
	TrimFields bool           `json:"trim_fields"`
	Columns    []Column       `json:"columns"`
	Preview    Preview        `json:"preview"`
	Confidence float64        `json:"confidence"`
	Issues     []Issue        `json:"issues"`
	Sampled    SampledMeta    `json:"sampled"`
	DurationMs int64          `json:"duration_ms"`
}

// DelimiterInfo contains delimiter detection results
type DelimiterInfo struct {
	Delimiter     string  `json:"delimiter"`
	ConfidencePct float64 `json:"confidence_pct"`
}

// Column represents a detected column's name and type
type Column struct {
	Name string `json:"name"`
	Type string `json:"type"` // INT | DOUBLE | DATE | TIMESTAMP | BOOLEAN | TEXT
}

// Preview contains sample rows from the file
type Preview struct {
	Rows        int                 `json:"rows"`
	Data        []map[string]string `json:"data"`
	InvalidRows int                 `json:"invalid_rows"`
}

// Issue represents a detection warning or error
type Issue struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// SampledMeta contains information about the sampled data
type SampledMeta struct {
	Lines      int   `json:"lines"`
	Bytes      int64 `json:"bytes"`
	DurationMs int64 `json:"duration_ms"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error struct {
		Code    string      `json:"code"`
		Message string      `json:"message"`
		Details interface{} `json:"details,omitempty"`
	} `json:"error"`
}
