package qcparser

func (p *Parser) Read() {
	detected, err := p.Detect()
	if err != nil {
		panic(err)
	}

	switch detected.Format {
	case "csv":
		readCSV(detected)
	case "jsonl":
		readJSONL(detected)
	case "json":
		readJSON(detected)
	default:
		panic("unsupported format: " + detected.Format)
	}
}

func readCSV(config DetectResponse) {
	// TODO
}

func readJSONL(config DetectResponse) {
	// TODO
}

func readJSON(config DetectResponse) {
	// TODO
}
