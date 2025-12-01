package guesser

import "errors"

func Err(msg string) error {
	return errors.New(msg)
}
