package com.pod3.libraryTrack.dto;

import java.time.LocalDate;

import com.pod3.libraryTrack.constants.ReservationStatus;
import com.pod3.libraryTrack.model.Book;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReservationDto {
    private Long reservationId;
    private Book book;                  
    private LocalDate reservedDate;
    private ReservationStatus status;
    private Long userId;
    private String username;            

}

