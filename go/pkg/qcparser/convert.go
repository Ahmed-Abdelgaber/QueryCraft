package qcparser

import (
	"fmt"
	"querycraft/pkg/qcparser/detector"
	"querycraft/pkg/qcparser/internal/reader"
	"querycraft/pkg/qcparser/internal/writer"
	"querycraft/pkg/qcparser/types"
	"sync"
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

	// Collect errors silently using WaitGroup
	errors := make([]string, 0)
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		for readerErr := range errChan {
			errors = append(errors, readerErr.Error())
		}
	}()

	// Step 3: Write DJSON file (consumes row channel)
	result, err := writer.Write(rowChan, detected, outputPath)
	if err != nil {
		return nil, fmt.Errorf("write failed: %w", err)
	}

	// Wait for error collection to complete
	wg.Wait()

	// Add collected errors to result
	result.Errors = errors

	return result, nil
}
