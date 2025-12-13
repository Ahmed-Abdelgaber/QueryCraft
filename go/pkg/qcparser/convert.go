package qcparser

import (
	"fmt"
	"querycraft/pkg/qcparser/detector"
	"querycraft/pkg/qcparser/internal/reader"
	"querycraft/pkg/qcparser/internal/writer"
	"querycraft/pkg/qcparser/types"
)

// Convert detects file format and converts it to DJSON for DuckDB
func Convert(filePath string, outputPath string, opts *types.Options) (*types.ConvertResult, error) {
	// Step 1: Detect file format and structure
	detected, err := detector.Detect(filePath, opts)
	if err != nil {
		return nil, fmt.Errorf("detection failed: %w", err)
	}

	// Step 2: Read file (returns channels for streaming)
	rowChan, errChan := reader.Read(filePath, detected)

	// Consume error channel concurrently to prevent deadlock
	go func() {
		for readerErr := range errChan {
			// For now, just log errors (could collect them in result)
			fmt.Printf("Reader warning: %v\n", readerErr)
		}
	}()

	// Step 3: Write DJSON file (consumes row channel)
	result, err := writer.Write(rowChan, detected, outputPath)
	if err != nil {
		return nil, fmt.Errorf("write failed: %w", err)
	}

	return result, nil
}
