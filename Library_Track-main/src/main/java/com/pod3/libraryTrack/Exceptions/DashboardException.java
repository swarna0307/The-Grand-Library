package com.pod3.libraryTrack.Exceptions;
 
public class DashboardException extends RuntimeException{
	public DashboardException(String message) {
		super(message);
	}
	public DashboardException(String message, Throwable cause) {
		super(message, cause);
	}
}
