package com.pod3.libraryTrack.model;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import org.hibernate.annotations.UpdateTimestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class ReadingProgress {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long progressId;

	@ManyToOne
	@JoinColumn(name = "bookId")
	private Book book;

	@ManyToOne
	@JoinColumn(name = "userId")
	private User user;

	private Integer pagesRead;
	private Integer totalPages;
	private Double percentageComplete;

	@UpdateTimestamp
	private Date lastUpdated;
}
