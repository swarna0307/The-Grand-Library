package com.pod3.libraryTrack.service;

import java.util.List;

import com.pod3.libraryTrack.dto.ReservationDto;
import com.pod3.libraryTrack.model.Reservation;

public interface ReservationService {

    List<ReservationDto> getAllReservations();

    ReservationDto createReservation(Reservation reservation);

    ReservationDto getReservationById(Long reservationId);

    ReservationDto updateReservation(Long reservationId, Reservation updatedReservation);

    String deleteReservationById(Long reservationId);
}