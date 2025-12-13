package writer

import (
	"strconv"

	"github.com/araddon/dateparse"
)

func convertToDate(value string) string {
	parsedTime, err := dateparse.ParseAny(value)
	if err != nil {
		return ""
	}

	return parsedTime.Format("2006-01-02")
}

func convertToInt(value string) int {
	intVal, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}
	return intVal
}

func convertToDouble(value string) float64 {
	floatVal, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0.0
	}
	return floatVal
}

func convertToBool(value string) bool {
	boolVal, err := strconv.ParseBool(value)
	if err != nil {
		return false
	}
	return boolVal
}
