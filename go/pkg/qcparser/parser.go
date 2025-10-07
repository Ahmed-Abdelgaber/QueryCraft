package qcparser

type Parser struct {
	opt     DetectOptions
	file    string
	helpers Helpers
}

func New(f string, opt *DetectOptions) *Parser {
	defOpt := DefaultDetectOptions()
	if opt.SampleBytes > 0 {
		defOpt.SampleBytes = opt.SampleBytes
	}
	if opt.MaxPreviewRows > 0 {
		defOpt.MaxPreviewRows = opt.MaxPreviewRows
	}
	if len(opt.Delimiters) > 0 {
		defOpt.Delimiters = opt.Delimiters
	}
	if len(opt.CommentPrefixes) > 0 {
		defOpt.CommentPrefixes = opt.CommentPrefixes
	}
	if opt.MaxLineBytes > 0 {
		defOpt.MaxLineBytes = opt.MaxLineBytes
	}
	defOpt.AssumeUTF8 = opt.AssumeUTF8
	return &Parser{
		opt:     defOpt,
		file:    f,
		helpers: *NewHelpers(),
	}
}
