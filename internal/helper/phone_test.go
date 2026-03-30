package helper

import (
	"testing"
)

func TestExtractPhoneFromJID(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"905551234567@s.whatsapp.net", "905551234567"},
		{"628123456789@s.whatsapp.net", "628123456789"},
		{"905551234567", "905551234567"},
		{"", ""},
	}

	for _, tt := range tests {
		result := ExtractPhoneFromJID(tt.input)
		if result != tt.expected {
			t.Errorf("ExtractPhoneFromJID(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}
