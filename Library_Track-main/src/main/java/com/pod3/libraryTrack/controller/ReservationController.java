package com.pod3.libraryTrack.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.pod3.libraryTrack.dto.ReservationDto;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.model.Reservation;
import com.pod3.libraryTrack.service.ReservationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Slf4j
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @PreAuthorize("hasRole('READER')")
    public ResponseEntity<ResponseStructure<ReservationDto>> createReservation(@RequestBody Reservation reservation) {
        log.info("Creating reservation");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseStructure.success("Reservation Created Successfully",
                        reservationService.createReservation(reservation)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN','READER')")
    public ResponseEntity<ResponseStructure<List<ReservationDto>>> getAllReservations() {
        log.info("Fetching all reservations");
        return ResponseEntity.ok(ResponseStructure.success("Reservations Retrieved Successfully",
                reservationService.getAllReservations()));
    }

    @GetMapping("/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN','READER')")
    public ResponseEntity<ResponseStructure<ReservationDto>> getReservationById(@PathVariable Long reservationId) {
        log.info("Fetching reservation with ID: {}", reservationId);
        return ResponseEntity.ok(ResponseStructure.success("Reservation fetched successfully",
                reservationService.getReservationById(reservationId)));
    }

    @PatchMapping("/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN','READER')")
    public ResponseEntity<ResponseStructure<ReservationDto>> updateReservation(
            @PathVariable Long reservationId, @RequestBody Reservation updatedReservation) {
        log.info("Updating reservation with ID: {}", reservationId);
        return ResponseEntity.ok(ResponseStructure.success("Updated reservation successfully",
                reservationService.updateReservation(reservationId, updatedReservation)));
    }

    @DeleteMapping("/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN','READER')")
    public ResponseEntity<ResponseStructure<String>> deleteReservationById(@PathVariable Long reservationId) {
        log.info("Deleting reservation with ID: {}", reservationId);
        return ResponseEntity.ok(ResponseStructure.success("Reservation Deleted Successfully.",
                reservationService.deleteReservationById(reservationId)));
    }
}
