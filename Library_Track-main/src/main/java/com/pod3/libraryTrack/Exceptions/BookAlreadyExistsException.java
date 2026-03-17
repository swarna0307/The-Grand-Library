package com.pod3.libraryTrack.Exceptions;

public class BookAlreadyExistsException extends RuntimeException{

	public BookAlreadyExistsException(String message) {
		super(message);
	}

}