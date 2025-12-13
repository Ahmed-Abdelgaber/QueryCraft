package main

import (
	"encoding/json"
	"fmt"
	"log"
	"querycraft/pkg/qcparser/detector"
	"querycraft/pkg/qcparser/types"
)

func main() {
	// Use new types package
	opts := types.DefaultOptions()

	// Call detector.Detect() directly
	res, err := detector.Detect("../../data/space_missions.log", &opts)
	if err != nil {
		log.Fatalf("Detection failed: %v", err)
	}

	// Pretty print the detection result as JSON
	resJSON, err := json.MarshalIndent(res, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal JSON: %v", err)
	}

	fmt.Println(string(resJSON))
}
