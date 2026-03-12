package com.pod3.libraryTrack.implementation;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pod3.libraryTrack.Exceptions.AccessDeniedException;
import com.pod3.libraryTrack.Exceptions.DetailsNotFoundException;
import com.pod3.libraryTrack.Exceptions.ReservationNotFoundException;
import com.pod3.libraryTrack.constants.AvailabilityStatus;
import com.pod3.libraryTrack.constants.ReservationStatus;
import com.pod3.libraryTrack.dto.ReservationDto;
import com.pod3.libraryTrack.model.Book;
import com.pod3.libraryTrack.model.Reservation;
import com.pod3.libraryTrack.model.User;
import com.pod3.libraryTrack.repository.BookRepository;
import com.pod3.libraryTrack.repository.ReservationRepository;
import com.pod3.libraryTrack.repository.UserRepository;
import com.pod3.libraryTrack.service.ReservationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReservationServiceImp implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @Override
    @Transactional
    public ReservationDto createReservation(Reservation reservation) {
        User currentUser = getCurrentUser();

        if (reservation.getUser() == null || reservation.getUser().getUserId() == null) {
            throw new AccessDeniedException("User information is missing in reservation request");
        }

        if (!reservation.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException("Readers can only create reservations for themselves");
        }

        if (reservation.getBook() == null || reservation.getBook().getBookId() == null) {
            throw new DetailsNotFoundException("Book ID is required for reservation");
        }

        Book book = bookRepository.findById(reservation.getBook().getBookId())
                .orElseThrow(() -> new DetailsNotFoundException("Book Id not found"));

        User userDetails = userRepository.findById(reservation.getUser().getUserId())
                .orElseThrow(() -> new DetailsNotFoundException("User Id not found"));

        if (!userDetails.getRole().getName().endsWith("READER")) {
            throw new AccessDeniedException("Only Readers can create reservations");
        }

        // Set initial status as Pending — book NOT reserved until admin approves
        reservation.setUser(userDetails);
        reservation.setBook(book);
        reservation.setStatus(ReservationStatus.Pending);
        // Do NOT change book availability yet — wait for approval

        log.info("Saving reservation for user {} and book {}", userDetails.getUsername(), book.getTitle());
        try {
            Reservation saved = reservationRepository.save(reservation);
            log.info("Reservation saved successfully with ID: {}", saved.getReservationId());
            return mapToDto(saved);
        } catch (Exception e) {
            log.error("Failed to save reservation: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public List<ReservationDto> getAllReservations() {
        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole().getName();

        List<Reservation> reservations;
        if (isAdminOrLibrarian(roleName)) {
            reservations = reservationRepository.findAll();
        } else if (roleName.endsWith("READER")) {
            reservations = reservationRepository.findByUserUserId(currentUser.getUserId());
        } else {
            throw new AccessDeniedException("Unauthorized role");
        }

        return reservations.stream().map(this::mapToDto).toList();
    }

    @Override
    public ReservationDto getReservationById(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation id not found"));

        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole().getName();

        if (isAdminOrLibrarian(roleName) || reservation.getUser().getUserId().equals(currentUser.getUserId())) {
            return mapToDto(reservation);
        }
        throw new AccessDeniedException("Access Denied");
    }

    @Override
    @Transactional
    public ReservationDto updateReservation(Long reservationId, Reservation updatedReservation) {
        Reservation existingReservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation id not found"));

        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole().getName();

        // Access Control
        boolean isOwner = existingReservation.getUser().getUserId().equals(currentUser.getUserId());
        if (!isAdminOrLibrarian(roleName) && !isOwner) {
            throw new AccessDeniedException("You do not have permission to update this reservation");
        }

        if (updatedReservation.getStatus() != null) {
            // Readers can only cancel their own reservations
            if (roleName.endsWith("READER")) {
                if (updatedReservation.getStatus() != ReservationStatus.Cancelled) {
                    throw new AccessDeniedException("Readers can only mark reservations as Cancelled");
                }
            }

            existingReservation.setStatus(updatedReservation.getStatus());
            // When admin approves → mark book as Reserved
            if (updatedReservation.getStatus() == ReservationStatus.Active) {
                Book book = existingReservation.getBook();
                if (book != null) {
                    book.setAvailabilityStatus(AvailabilityStatus.Reserved);
                    bookRepository.save(book);
                }
            }
            // When cancelled or fulfilled → free the book
            if (updatedReservation.getStatus() == ReservationStatus.Cancelled ||
                updatedReservation.getStatus() == ReservationStatus.Fulfilled) {
                Book book = existingReservation.getBook();
                if (book != null) {
                    book.setAvailabilityStatus(AvailabilityStatus.Available);
                    bookRepository.save(book);
                }
            }
        }
        if (updatedReservation.getBook() != null)
            existingReservation.setBook(updatedReservation.getBook());
        if (updatedReservation.getUser() != null)
            existingReservation.setUser(updatedReservation.getUser());

        return mapToDto(reservationRepository.save(existingReservation));
    }

    @Override
    @Transactional
    public String deleteReservationById(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found"));

        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole().getName();

        if (isAdminOrLibrarian(roleName) || (roleName.endsWith("READER") && reservation.getUser().getUserId().equals(currentUser.getUserId()))) {
            // Free the book when reservation is deleted (if it was active)
            Book book = reservation.getBook();
            if (book != null && book.getAvailabilityStatus() == AvailabilityStatus.Reserved) {
                book.setAvailabilityStatus(AvailabilityStatus.Available);
                bookRepository.save(book);
            }
            reservationRepository.delete(reservation);
            return "Reservation deletion completed";
        }
        throw new AccessDeniedException("You do not have permission to delete this reservation");
    }

    private ReservationDto mapToDto(Reservation reservation) {
        String rawUsername = reservation.getUser().getUsername();
        String capitalizedUsername = rawUsername != null && !rawUsername.isEmpty() 
            ? rawUsername.substring(0, 1).toUpperCase() + rawUsername.substring(1) 
            : rawUsername;

        return ReservationDto.builder()
                .reservationId(reservation.getReservationId())
                .userId(reservation.getUser().getUserId())
                .username(capitalizedUsername)
                .book(reservation.getBook())
                .reservedDate(reservation.getReservedDate())
                .status(reservation.getStatus())
                .build();
    }

    private User getCurrentUser() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new DetailsNotFoundException("Current user not found"));
    }

    private boolean isAdminOrLibrarian(String roleName) {
        return "ROLE_ADMIN".equals(roleName) || "ROLE_LIBRARIAN".equals(roleName);
    }
}
