package util

import "time"

// Number is a generic constraint for numeric types
type Number interface {
	~int | ~int32 | ~int64 | ~float32 | ~float64
}

// DurationMs returns milliseconds since t0
func DurationMs(t0 time.Time) int64 {
	return time.Since(t0).Milliseconds()
}

// Min returns the minimum of given integers
func Min(args ...int) int {
	if len(args) == 0 {
		return 0
	}
	m := args[0]
	for _, v := range args[1:] {
		if v < m {
			m = v
		}
	}
	return m
}

// Sum returns the sum of a numeric slice
func Sum[T Number](xs []T) T {
	var s T
	for _, v := range xs {
		s += v
	}
	return s
}
