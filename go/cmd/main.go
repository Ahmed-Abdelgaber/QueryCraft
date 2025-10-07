package main

import (
	"fmt"
	"querycraft/pkg/qcparser"
)

func main() {
	opt := qcparser.DefaultDetectOptions()
	parser := qcparser.New("../../data/space_missions.log", &opt)

	res, _ := parser.Detect()

	fmt.Println(res)
}
