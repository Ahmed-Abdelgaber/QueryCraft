package main

import (
	"fmt"
	"log"
	"querycraft/pkg/qcparser"
	"querycraft/pkg/qcparser/types"
)

func main() {
	// Test Convert - full pipeline
	opts := types.DefaultOptions()

	fmt.Println("Converting space_missions.log to DJSON...")
	result, err := qcparser.Convert(
		"../../data/space_missions.log",
		"../../data/space_missions.djson",
		&opts,
	)
	if err != nil {
		log.Fatalf("Conversion failed: %v", err)
	}

	fmt.Printf("\n✅ Successfully created DJSON file: %s\n", result.DJSONPath)
	fmt.Printf("📊 Rows written: %d\n", result.RowsWritten)
	fmt.Printf("💾 Bytes written: %d\n", result.BytesWritten)
	fmt.Printf("⏱️  Duration: %dms\n", result.DurationMs)
}
