package com.pod3.libraryTrack.dto;

import java.util.Date;
import com.pod3.libraryTrack.model.Book;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReadingProgressDto { 
	private Long progressId; 
	private Long userId; 
	private String username; 
	private Book book; 
	private Integer pagesRead; 
	private Integer totalPages;
	private Double percentageComplete; 
	private Date lastUpdated;
	private boolean isHistory;
	
}
