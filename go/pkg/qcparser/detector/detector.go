package detector

import (
	"errors"
	"os"
	"querycraft/pkg/qcparser/internal/util"
	"querycraft/pkg/qcparser/types"
	"time"
)

// Detect analyzes a file and returns format detection results
func Detect(filePath string, opts *types.Options) (*types.DetectResponse, error) {
	start := time.Now()

	// Open file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Read sample lines
	lines, bytesRead, err := util.GetLines(file, opts.SampleBytes, opts.MaxLineBytes)
	if err != nil {
		return nil, err
	}

	// Validate UTF-8
	if !util.IsUTF8(lines) {
		return nil, errors.New("file is not valid UTF-8")
	}

	// Trim BOM if present
	util.TrimBOM(lines)

	// Detect format (CSV, JSON, or JSONL)
	format, _ := util.DataFormat(lines, opts.MaxPreviewRows)

	switch format {
	case "json", "jsonl":
		return detectJSON(lines, bytesRead, format, opts, start)
	case "csv":
		return detectCSV(lines, bytesRead, opts, start)
	}

	return nil, errors.New("unknown format")
}
