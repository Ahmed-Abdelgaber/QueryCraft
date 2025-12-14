package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"querycraft/pkg/qcparser/detector"
	"querycraft/pkg/qcparser/types"
)

func runDetect(args []string) int {
	// Create flag set for detect command
	fs := flag.NewFlagSet("detect", flag.ExitOnError)

	// Define flags
	filePath := fs.String("file", "", "Path to file to detect (required)")
	sampleBytes := fs.Int64("sample-bytes", 1<<20, "Sample size in bytes (default: 1MB)")
	maxPreviewRows := fs.Int("max-preview-rows", 50, "Maximum preview rows (default: 50)")

	// Parse flags
	fs.Parse(args)

	// Validate required flags
	if *filePath == "" {
		printError("FILE_REQUIRED", "The --file flag is required", nil)
		fmt.Fprintln(os.Stderr, "\nUsage: qcparser detect --file=/path/to/file.csv")
		return ExitInvalidArgs
	}

	// Check file exists
	if _, err := os.Stat(*filePath); os.IsNotExist(err) {
		printError("FILE_NOT_FOUND", fmt.Sprintf("File not found: %s", *filePath), map[string]interface{}{
			"file": *filePath,
		})
		return ExitFileNotFound
	}

	// Create detection options
	opts := types.DefaultOptions()
	opts.SampleBytes = *sampleBytes
	opts.MaxPreviewRows = *maxPreviewRows

	// Run detection
	result, err := detector.Detect(*filePath, &opts)
	if err != nil {
		printError("DETECTION_FAILED", err.Error(), map[string]interface{}{
			"file": *filePath,
		})
		return ExitDetectionFailed
	}

	// Marshal result to JSON
	output, err := json.Marshal(result)
	if err != nil {
		printError("JSON_MARSHAL_ERROR", err.Error(), nil)
		return ExitGeneralError
	}

	// Print to stdout (Node.js will read this)
	fmt.Println(string(output))

	return ExitSuccess
}

// printError outputs a structured error to stderr
func printError(code string, message string, details map[string]interface{}) {
	errorResponse := map[string]interface{}{
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
			"details": details,
		},
	}

	errorJSON, _ := json.Marshal(errorResponse)
	fmt.Fprintln(os.Stderr, string(errorJSON))
}

// Exit codes
const (
	ExitSuccess          = 0
	ExitGeneralError     = 1
	ExitInvalidArgs      = 2
	ExitFileNotFound     = 3
	ExitDetectionFailed  = 4
	ExitConversionFailed = 5
)
