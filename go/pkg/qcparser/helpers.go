package qcparser

import (
	"sort"
	"time"
)

type Helpers struct{}

func NewHelpers() *Helpers {
	return &Helpers{}
}

func (h *Helpers) DurationMs(t0 time.Time) int64 { return time.Since(t0).Milliseconds() }

func (h *Helpers) Min(args ...int) int {
	if len(args) == 0 {
		return 0
	}
	sort.Ints(args)
	return args[0]
}
