package reader

import (
	"bufio"
	"fmt"
	"os"
	"querycraft/pkg/qcparser/detector"
	"querycraft/pkg/qcparser/types"
	"strings"
)

func readCSV(filepath string, config *types.DetectResponse) (<-chan map[string]string, <-chan error) {
	readedRows := make(chan map[string]string)
	errChan := make(chan error)

	go func() {
		defer close(readedRows)
		defer close(errChan)
		file, err := os.Open(filepath)

		if err != nil {
			errChan <- err
			return
		}

		defer file.Close()

		scanner := bufio.NewScanner(file)
		scanner.Buffer(make([]byte, 1024*1024), 10*1024*1024)
		rowID := 0
		delimiterRune := []rune(config.Delimiter.Delimiter)[0]
		skippedHeader := false

		for scanner.Scan() {
			rowID++
			line := scanner.Text()
			if config.Comment != nil && strings.HasPrefix(strings.TrimSpace(line), *config.Comment) {
				continue
			}
			fields, invalid := detector.SplitLineFields(line, delimiterRune)
			if invalid {
				errChan <- fmt.Errorf("invalid line %d: %s", rowID, line)
				continue
			}
			if len(fields) != len(config.Columns) {
				errChan <- fmt.Errorf("invalid line %d: expected %d fields, got %d",
					rowID, len(config.Columns), len(fields))
				continue
			}

			// Skip header row if present
			if config.HasHeader && !skippedHeader {
				skippedHeader = true
				continue
			}

			row := make(map[string]string)
			for i, field := range fields {
				if i < len(config.Columns) {
					row[config.Columns[i].Name] = strings.TrimSpace(field)
				}
			}
			readedRows <- row
		}

		if err := scanner.Err(); err != nil {
			errChan <- err
		}
	}()

	return readedRows, errChan
}
