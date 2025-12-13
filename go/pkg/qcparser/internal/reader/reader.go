package reader

import "querycraft/pkg/qcparser/types"

func Read(filepath string, config *types.DetectResponse) (<-chan map[string]string, <-chan error) {
	switch config.Format {
	case "json":
		return readJSON(filepath, config)
	case "csv":
		return readCSV(filepath, config)
	case "jsonl":
		return readJSONL(filepath, config)
	default:
		return nil, nil
	}
}
