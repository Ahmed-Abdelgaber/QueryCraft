package detector

// Internal analysis types used during detection

// LineAnalysis contains analysis results for a single line
type LineAnalysis struct {
	FieldCount    int
	Invalid       bool
	QuoteAffected bool
}

// DelimiterAnalysis contains analysis results for a delimiter candidate
type DelimiterAnalysis struct {
	NumberOfLines      int
	ValidCount         int
	InvalidCount       int
	FieldCounts        []int
	QuoteAffectedCount int
}

// DelimStatus contains statistical analysis of delimiter performance
type DelimStatus struct {
	ModeColumns       int
	ModeCoverage      float64
	FieldCountStdDev  float64
	InvalidRate       float64
	QuoteAffectedRate float64
	TotalLines        int
	ValidCount        int
}

// ScoreWeights contains weights for delimiter scoring
type ScoreWeights struct {
	CoverageWeight float64
	SpreadWeight   float64
	InvalidWeight  float64
	QuoteWeight    float64
}

// DefaultScoreWeights returns default scoring weights
func DefaultScoreWeights() ScoreWeights {
	return ScoreWeights{
		CoverageWeight: 0.65,
		SpreadWeight:   0.20,
		InvalidWeight:  0.15,
		QuoteWeight:    0.10,
	}
}

// CandidateResult contains delimiter candidate analysis results
type CandidateResult struct {
	Delimiter rune
	Status    DelimStatus
	Score     float64
	Pass      bool
}

// Decision contains the result of delimiter selection
type Decision struct {
	Winner           CandidateResult
	RunnerUp         CandidateResult
	IsAmbiguous      bool
	AmbiguityEpsilon float64
	EligibleCount    int
	CandidateCount   int
}
