package writer

import (
	"encoding/json"
	"fmt"
	"os"
	"querycraft/pkg/qcparser/types"
	"time"
)

func Write(rowChan <-chan map[string]string, config *types.DetectResponse, outPath string) (*types.ConvertResult, error) {
	start := time.Now()

	// Create or truncate the DJSON file
	file, err := os.OpenFile(outPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var rowsWritten int64
	encoder := json.NewEncoder(file)

	// Process ALL rows from channel
	for row := range rowChan {
		// Create converted row maintaining column order
		convertedRow := make(map[string]any)
		for _, col := range config.Columns {
			switch col.Type {
			case "TIMESTAMP":
				convertedRow[col.Name] = convertToDate(row[col.Name])
			case "INT":
				convertedRow[col.Name] = convertToInt(row[col.Name])
			case "DOUBLE":
				convertedRow[col.Name] = convertToDouble(row[col.Name])
			case "BOOLEAN":
				convertedRow[col.Name] = convertToBool(row[col.Name])
			default:
				convertedRow[col.Name] = row[col.Name]
			}
		}

		// Write as JSON line (encoder adds newline automatically)
		if err := encoder.Encode(convertedRow); err != nil {
			return nil, fmt.Errorf("error encoding row %d: %w", rowsWritten+1, err)
		}

		rowsWritten++
	}

	// Get file size
	fileInfo, err := file.Stat()
	if err != nil {
		return nil, err
	}

	return &types.ConvertResult{
		DJSONPath:    outPath,
		RowsWritten:  rowsWritten,
		BytesWritten: fileInfo.Size(),
		DurationMs:   time.Since(start).Milliseconds(),
	}, nil
}
