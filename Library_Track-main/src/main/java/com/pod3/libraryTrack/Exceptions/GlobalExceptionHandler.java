package com.pod3.libraryTrack.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.pod3.libraryTrack.constants.ErrorMessages;
import com.pod3.libraryTrack.dto.ResponseStructure;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(LoanNotFoundException.class)
	public ResponseEntity<ResponseStructure<String>> handleLoanNotFoundException(LoanNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ResponseStructure.error(ErrorMessages.LOAN_NOT_FOUND, ex.getMessage()));
	}

	@ExceptionHandler(ReservationNotFoundException.class)
	public ResponseEntity<ResponseStructure<String>> handleReservationNotFoundException(
			ReservationNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ResponseStructure.error(ErrorMessages.RESERVATION_NOT_FOUND, ex.getMessage()));
	}

	@ExceptionHandler(ProgressNotFoundException.class)
	public ResponseEntity<ResponseStructure<String>> handleProgressNotFoundException(ProgressNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ResponseStructure.error(ErrorMessages.PROGRESS_NOT_FOUND, ex.getMessage()));
	}

	@ExceptionHandler(DetailsAlreadyExistsException.class)
	public ResponseEntity<ResponseStructure<String>> handleDetailsExistsException(DetailsAlreadyExistsException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(ResponseStructure.error(ErrorMessages.DETAILS_EXISTS, ex.getMessage()));
	}

	@ExceptionHandler(DetailsNotFoundException.class)
	public ResponseEntity<ResponseStructure<String>> handleDetailsNotFoundException(DetailsNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ResponseStructure.error(ErrorMessages.DETAILS_NOT_FOUND, ex.getMessage()));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ResponseStructure<String>> handleAccessDeniedException(AccessDeniedException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(ResponseStructure.error(ErrorMessages.ACCESS_DENIED, ex.getMessage()));
	}

	@ExceptionHandler(CategoryNotFoundException.class)
	public ResponseEntity<ResponseStructure<String>> handleCategoryNotFoundException(CategoryNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ResponseStructure.error(ErrorMessages.CATEGORY_NOT_FOUND, ex.getMessage()));
	}

	@ExceptionHandler(BookAlreadyExistsException.class)
	public ResponseEntity<ResponseStructure<String>> handleBookExistsException(BookAlreadyExistsException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(ResponseStructure.error(ErrorMessages.BOOK_CREATION_FAILED, ex.getMessage()));
	}

	@ExceptionHandler(BookNotExistsException.class)
	public ResponseEntity<ResponseStructure<String>> handleBookNotExistsException(BookNotExistsException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ResponseStructure.error(ErrorMessages.BOOK_NOT_EXISTS, ex.getMessage()));
	}

	@ExceptionHandler(DashboardException.class)
	public ResponseEntity<ResponseStructure<String>> handleDashboardException(DashboardException ex) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ResponseStructure.error(ErrorMessages.DASHBOARD_ERROR, ex.getMessage()));
	}

	@ExceptionHandler(InvalidCredentialsException.class)
	public ResponseEntity<ResponseStructure<String>> handleInvalidCredentials(InvalidCredentialsException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(ResponseStructure.error(ErrorMessages.BAD_CREDENTIALS, ex.getMessage()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ResponseStructure<String>> handleGlobalException(Exception ex) {
		ex.printStackTrace(); // Log the stack trace for server-side debugging
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseStructure
				.error(ErrorMessages.UNEXPECTED_ERROR, ex.getClass().getSimpleName() + ": " + ex.getMessage()));
	}
}
