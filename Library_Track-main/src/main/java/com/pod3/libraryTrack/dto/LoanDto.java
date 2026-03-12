package com.pod3.libraryTrack.dto;

import java.time.LocalDate;
import com.pod3.libraryTrack.constants.LoanStatus;
import com.pod3.libraryTrack.model.Book;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class LoanDto {
	
    private Long loanId;
    private Book book;
    private LocalDate loanDate;
    private LocalDate returnDate;
    private LocalDate dueDate;
    private LoanStatus status;
    private Long userId; 
    private String userName;
    
}