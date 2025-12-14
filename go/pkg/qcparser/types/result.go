package types

// ConvertResult is the result of file conversion to DJSON
type ConvertResult struct {
	DJSONPath    string   `json:"djson_path"`
	RowsWritten  int64    `json:"rows_written"`
	BytesWritten int64    `json:"bytes_written"`
	DurationMs   int64    `json:"duration_ms"`
	Errors       []string `json:"errors,omitempty"` // Collected error messages
}
