package com.pod3.libraryTrack.Exceptions;

public class ReservationNotFoundException extends RuntimeException{
	public ReservationNotFoundException(String message) {
		super(message);
	}
}
