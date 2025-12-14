package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"querycraft/pkg/qcparser"
	"querycraft/pkg/qcparser/types"
	"time"
)

func runConvert(args []string) int {
	// Create flag set for convert command
	fs := flag.NewFlagSet("convert", flag.ExitOnError)

	// Define flags
	inputPath := fs.String("input", "", "Input file path (required)")
	outputPath := fs.String("output", "", "Output DJSON file path (required)")

	// Parse flags
	fs.Parse(args)

	// Validate required flags
	if *inputPath == "" {
		printError("INPUT_REQUIRED", "The --input flag is required", nil)
		return ExitInvalidArgs
	}
	if *outputPath == "" {
		printError("OUTPUT_REQUIRED", "The --output flag is required", nil)
		return ExitInvalidArgs
	}

	// Check input file exists
	if _, err := os.Stat(*inputPath); os.IsNotExist(err) {
		printError("FILE_NOT_FOUND", fmt.Sprintf("Input file not found: %s", *inputPath), map[string]interface{}{
			"file": *inputPath,
		})
		return ExitFileNotFound
	}

	// Check output directory is writable
	outputDir := filepath.Dir(*outputPath)
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		printError("OUTPUT_DIR_NOT_FOUND", fmt.Sprintf("Output directory not found: %s", outputDir), nil)
		return ExitInvalidArgs
	}

	// Run conversion with progress tracking
	return runStreamingConvert(*inputPath, *outputPath)
}

// runStreamingConvert runs conversion and emits NDJSON progress events
func runStreamingConvert(inputPath, outputPath string) int {
	start := time.Now()

	// Emit started event
	emitEvent("started", map[string]interface{}{
		"input_path":  inputPath,
		"output_path": outputPath,
	})

	// Create options
	opts := types.DefaultOptions()

	// Run conversion (this internally does detect → read → write)
	// We'll get progress from the reader's error channel
	result, err := qcparser.Convert(inputPath, outputPath, &opts)
	if err != nil {
		printError("CONVERSION_FAILED", err.Error(), nil)
		return ExitConversionFailed
	}

	// Emit final result
	emitEvent("result", map[string]interface{}{
		"djson_path":    result.DJSONPath,
		"rows_written":  result.RowsWritten,
		"bytes_written": result.BytesWritten,
		"duration_ms":   time.Since(start).Milliseconds(),
		"errors":        result.Errors, // Include collected errors
	})

	return ExitSuccess
}

// emitEvent outputs an NDJSON event to stdout
func emitEvent(eventType string, data map[string]interface{}) {
	event := map[string]interface{}{
		"type": eventType,
	}

	// Merge data into event
	for k, v := range data {
		event[k] = v
	}

	eventJSON, _ := json.Marshal(event)
	fmt.Println(string(eventJSON))
}
