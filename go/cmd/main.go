package main

import (
	"fmt"
	"os"
)

const version = "1.0.0"

func main() {
	// Require at least one argument (command)
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	// Get command from first argument
	command := os.Args[1]

	// Route to appropriate command handler
	switch command {
	case "detect":
		os.Exit(runDetect(os.Args[2:]))
	case "convert":
		os.Exit(runConvert(os.Args[2:]))
	case "version":
		fmt.Printf("qcparser v%s\n", version)
		os.Exit(0)
	case "help", "-h", "--help":
		printUsage()
		os.Exit(0)
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`qcparser - Query log file parser

Usage:
  qcparser <command> [options]

Commands:
  detect   Detect file format and structure
  convert  Convert file to DJSON format
  version  Show version information
  help     Show this help message

Examples:
  qcparser detect --file=/path/to/file.csv
  qcparser convert --input=file.csv --output=file.djson

Run 'qcparser <command> --help' for more information on a command.`)
}
