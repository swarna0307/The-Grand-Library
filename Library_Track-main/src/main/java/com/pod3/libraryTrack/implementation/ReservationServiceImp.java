package com.pod3.libraryTrack.implementation;

import java.time.LocalDate;
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

        // Always use the authenticated user — no need for client to send userId
        if (!currentUser.getRole().getName().endsWith("READER")) {
            throw new AccessDeniedException("Only Readers can create reservations");
        }

        if (reservation.getBook() == null || reservation.getBook().getBookId() == null) {
            throw new DetailsNotFoundException("Book ID is required for reservation");
        }

        Book book = bookRepository.findById(reservation.getBook().getBookId())
                .orElseThrow(() -> new DetailsNotFoundException("Book Id not found"));

        // Check if book has available copies
        if (book.getCopies() <= 0 || book.getAvailabilityStatus() == AvailabilityStatus.NotAvailable) {
            throw new AccessDeniedException("Book has no available copies and cannot be reserved");
        }

        // Check if book is already reserved or loaned (all copies checked out)
        if (book.getAvailabilityStatus() != AvailabilityStatus.Available) {
            throw new AccessDeniedException("Book is currently " + book.getAvailabilityStatus() + " and cannot be reserved");
        }

        // Set initial status as Active — book is reserved immediately
        reservation.setUser(currentUser);
        reservation.setBook(book);
        reservation.setStatus(ReservationStatus.Active);
        reservation.setExpiryDate(LocalDate.now().plusDays(7));
        
        // Update book availability to Reserved immediately (reservation doesn't decrement copies)
        log.info("Marking book {} (ID: {}) as Reserved", book.getTitle(), book.getBookId());
        book.setAvailabilityStatus(AvailabilityStatus.Reserved);
        bookRepository.save(book);

        log.info("Saving reservation for user {} and book {}", currentUser.getUsername(), book.getTitle());
        try {
            Reservation saved = reservationRepository.save(reservation);
            log.info("Reservation saved successfully with ID: {}", saved.getReservationId());
            return mapToDto(saved);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to save reservation entity. Reversing book status. Error: {}", e.getMessage());
            // Transactional rollback should handle this, but explicit log helps
            throw new RuntimeException("DB Error: " + e.getMessage(), e);
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

        checkAndUpdateExpiredReservations(reservations);

        return reservations.stream().map(this::mapToDto).toList();
    }

    @Override
    public ReservationDto getReservationById(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation id not found"));

        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole().getName();

        checkAndUpdateExpiredReservation(reservation);

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
            log.info("Updating Reservation ID: {} status from {} to {}", reservationId, existingReservation.getStatus(), updatedReservation.getStatus());
            
            // Readers can only cancel their own reservations
            if (roleName.endsWith("READER")) {
                if (updatedReservation.getStatus() != ReservationStatus.Cancelled) {
                    throw new AccessDeniedException("Readers can only mark reservations as Cancelled");
                }
            }

            existingReservation.setStatus(updatedReservation.getStatus());
            
            Book book = existingReservation.getBook();
            if (book != null) {
                // When active → mark book as Reserved
                if (updatedReservation.getStatus() == ReservationStatus.Active) {
                    log.info("Reservation Active. Marking book '{}' (ID: {}) as Reserved", book.getTitle(), book.getBookId());
                    book.setAvailabilityStatus(AvailabilityStatus.Reserved);
                    bookRepository.save(book);
                }
                // When cancelled or fulfilled → restore availability based on copy count
                else if (updatedReservation.getStatus() == ReservationStatus.Cancelled ||
                    updatedReservation.getStatus() == ReservationStatus.Fulfilled) {
                    log.info("Reservation {}. Restoring book '{}' (ID: {}) based on copy count ({})", 
                        updatedReservation.getStatus(), book.getTitle(), book.getBookId(), book.getCopies());
                    if (book.getCopies() > 0) {
                        book.setAvailabilityStatus(AvailabilityStatus.Available);
                    } else {
                        book.setAvailabilityStatus(AvailabilityStatus.NotAvailable);
                    }
                    bookRepository.save(book);
                }
            } else {
                log.warn("Reservation ID: {} has no associated book!", reservationId);
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
            if (book != null) {
                log.info("Deleting reservation ID: {}. Current book status: {}", reservationId, book.getAvailabilityStatus());
                if (book.getAvailabilityStatus() == AvailabilityStatus.Reserved) {
                    // Restore availability based on copy count
                    if (book.getCopies() > 0) {
                        book.setAvailabilityStatus(AvailabilityStatus.Available);
                    } else {
                        book.setAvailabilityStatus(AvailabilityStatus.NotAvailable);
                    }
                    bookRepository.save(book);
                    log.info("Restored book '{}' (ID: {}) to {} on reservation deletion", book.getTitle(), book.getBookId(), book.getAvailabilityStatus());
                }
            }
            reservationRepository.delete(reservation);
            log.info("Reservation ID: {} deleted successfully", reservationId);
            return "Reservation deletion completed";
        }
        throw new AccessDeniedException("You do not have permission to delete this reservation");
    }

    private void checkAndUpdateExpiredReservations(List<Reservation> reservations) {
        java.time.LocalDate today = java.time.LocalDate.now();
        boolean updated = false;
        for (Reservation res : reservations) {
            if (res.getStatus() == ReservationStatus.Active && res.getExpiryDate() != null && res.getExpiryDate().isBefore(today)) {
                res.setStatus(ReservationStatus.Cancelled);
                Book book = res.getBook();
                if (book != null && book.getAvailabilityStatus() == AvailabilityStatus.Reserved) {
                    book.setAvailabilityStatus(book.getCopies() > 0 ? AvailabilityStatus.Available : AvailabilityStatus.NotAvailable);
                    bookRepository.save(book);
                }
                updated = true;
                log.info("Dynamically marked Reservation ID: {} as Cancelled", res.getReservationId());
            }
        }
        if (updated) {
            reservationRepository.saveAll(reservations);
        }
    }

    private void checkAndUpdateExpiredReservation(Reservation res) {
        java.time.LocalDate today = java.time.LocalDate.now();
        if (res.getStatus() == ReservationStatus.Active && res.getExpiryDate() != null && res.getExpiryDate().isBefore(today)) {
            res.setStatus(ReservationStatus.Cancelled);
            Book book = res.getBook();
            if (book != null && book.getAvailabilityStatus() == AvailabilityStatus.Reserved) {
                book.setAvailabilityStatus(book.getCopies() > 0 ? AvailabilityStatus.Available : AvailabilityStatus.NotAvailable);
                bookRepository.save(book);
            }
            reservationRepository.save(res);
            log.info("Dynamically marked Reservation ID: {} as Cancelled", res.getReservationId());
        }
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
                .expiryDate(reservation.getExpiryDate())
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
