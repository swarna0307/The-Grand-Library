package com.pod3.libraryTrack.dto;

import com.pod3.libraryTrack.constants.AvailabilityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class BookDto {
 
	private Long bookId;
    private String title;
    private String author;
    private String isbn;
    private AvailabilityStatus availabilityStatus;
    private CategoryDto category;
    private int copies;
    private int totalCopies;
    
}