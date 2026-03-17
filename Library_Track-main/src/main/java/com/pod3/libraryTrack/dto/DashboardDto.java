package com.pod3.libraryTrack.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class DashboardDto {
	private long totalBooks;
	private long totalCategories;
	private long totalReservations;
	
	private long totalLoans;
	
	private Map<String, Long> booksPerCategory;
	private Map<String, Long> booksByAvailability;
	public long getTotalBooks() {
		return totalBooks;
	}
	public void setTotalBooks(long totalBooks) {
		this.totalBooks = totalBooks;
	}
	public long getTotalCategories() {
		return totalCategories;
	}
	public void setTotalCategories(long totalCategories) {
		this.totalCategories = totalCategories;
	}
	public long getTotalReservations() {
		return totalReservations;
	}
	public void setTotalReservations(long totalReservations) {
		this.totalReservations = totalReservations;
	}
	public long getTotalLoans() {
		return totalLoans;
	}
	public void setTotalLoans(long totalLoans) {
		this.totalLoans = totalLoans;
	}
	public Map<String, Long> getBooksPerCategory() {
		return booksPerCategory;
	}
	public void setBooksPerCategory(Map<String, Long> booksPerCategory) {
		this.booksPerCategory = booksPerCategory;
	}
	public Map<String, Long> getBooksByAvailability() {
		return booksByAvailability;
	}
	public void setBooksByAvailability(Map<String, Long> booksByAvailability) {
		this.booksByAvailability = booksByAvailability;
	}
	
	
	
}
