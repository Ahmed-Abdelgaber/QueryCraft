package util

import (
	"bufio"
	"errors"
	"io"
)

// GetLines reads lines from a reader up to maxBytes or maxLine limit
func GetLines(r io.Reader, maxBytes int64, maxLine int) ([]string, int64, error) {
	reader := bufio.NewReaderSize(r, 1<<20) // 1MB buffer
	var lines []string
	var total int64
	for {
		if (maxBytes > 0 && total >= maxBytes) || (maxLine > 0 && len(lines) >= maxLine) {
			break
		}
		line, size, err := readLine(reader)
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return lines, total, err
		}
		total += size
		lines = append(lines, line)
	}
	return lines, total, nil
}

// readLine reads a single line from a buffered reader, handling continuation
func readLine(reader *bufio.Reader) (string, int64, error) {
	line, isPrefix, err := reader.ReadLine()
	if err != nil {
		return "", 0, err
	}

	if !isPrefix {
		return string(line), int64(len(line)), nil
	}

	buff := make([]byte, 0, len(line)*3)
	buff = append(buff, line...)

	for isPrefix {
		frag, cont, err := reader.ReadLine()
		if err != nil {
			return "", 0, err
		}
		isPrefix = cont
		buff = append(buff, frag...)
	}

	return string(buff), int64(len(buff)), nil
}
