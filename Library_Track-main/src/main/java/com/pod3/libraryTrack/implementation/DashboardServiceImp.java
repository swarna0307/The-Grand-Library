package com.pod3.libraryTrack.implementation;
 
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.pod3.libraryTrack.Exceptions.AccessDeniedException;
import com.pod3.libraryTrack.Exceptions.DashboardException;
import com.pod3.libraryTrack.Exceptions.DetailsNotFoundException;
import com.pod3.libraryTrack.dto.DashboardDto;
import com.pod3.libraryTrack.model.Book;
import com.pod3.libraryTrack.model.Loan;
import com.pod3.libraryTrack.model.ReadingProgress;
import com.pod3.libraryTrack.model.Reservation;
import com.pod3.libraryTrack.model.User;
import com.pod3.libraryTrack.repository.BookRepository;
import com.pod3.libraryTrack.repository.CategoryRepository;
import com.pod3.libraryTrack.repository.LoanRepository;
import com.pod3.libraryTrack.repository.ReadingProgressRepository;
import com.pod3.libraryTrack.repository.ReservationRepository;
import com.pod3.libraryTrack.repository.UserRepository;
import com.pod3.libraryTrack.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
 
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImp implements DashboardService {
    private final UserRepository userRepo;
    private final BookRepository bookRepo;
    private final CategoryRepository categoryRepo;
    private final ReservationRepository reservationRepo;
    private final LoanRepository loanRepo;
    private final ReadingProgressRepository readingProgressRepo;


    @Override
    public DashboardDto getDashboardReport() {
        log.info("Generating dashboard report");

        if (bookRepo == null || categoryRepo == null || reservationRepo == null || loanRepo == null) {
            log.error("Repositories are not initialized properly");
            throw new DashboardException("Repositories are not initialized properly");
        }

        List<Reservation> reservations = reservationRepo.findAll();
        if (reservations == null) {
            log.error("Failed to retrieve reservations");
            throw new DashboardException("Failed to retrieve reservations");
        }

        List<Loan> loans = loanRepo.findAll();
        if (loans == null) {
            log.error("Failed to retrieve loans");
            throw new DashboardException("Failed to retrieve loans");
        }

        Map<String, Long> booksPerCategory = new HashMap<>();
        for (Book book : bookRepo.findAll()) {
            if (book == null) {
                log.error("Encountered null book record");
                throw new DashboardException("Encountered null book record");
            }
            String categoryName = (book.getCategory() != null) ? book.getCategory().getName() : "Uncategorized";
            booksPerCategory.put(categoryName, booksPerCategory.getOrDefault(categoryName, 0L) + 1);
        }

        Map<String, Long> booksByAvailability = new HashMap<>();
        for (Book book : bookRepo.findAll()) {
            if (book.getAvailabilityStatus() == null) {
                log.error("Book availability status is missing for book {}", book.getBookId());
                throw new DashboardException("Book availability status is missing");
            }
            String status = book.getAvailabilityStatus().name();
            booksByAvailability.put(status, booksByAvailability.getOrDefault(status, 0L) + 1);
        }

        long activeReservations = reservations.stream()
                .filter(r -> r.getStatus() == com.pod3.libraryTrack.constants.ReservationStatus.Active)
                .count();
        long activeLoans = loans.stream()
                .filter(l -> l.getStatus() == com.pod3.libraryTrack.constants.LoanStatus.Active || l.getStatus() == com.pod3.libraryTrack.constants.LoanStatus.Overdue)
                .count();

        long totalInProgressCount = readingProgressRepo.findAll().stream()
                .filter(p -> p.getPercentageComplete() != null && p.getPercentageComplete() < 100)
                .count();

        DashboardDto dto = DashboardDto.builder()
                .totalBooks(bookRepo.count())
                .totalCategories(categoryRepo.count())
                .totalReservations(activeReservations)
                .totalLoans(activeLoans)
                .totalInProgress(totalInProgressCount)
                .booksPerCategory(booksPerCategory)
                .booksByAvailability(booksByAvailability)
                .build();

        log.info("Dashboard report generated successfully");
        return dto;
    }

    @Override
    public DashboardDto getReaderDashboardById(Long readerId) {
        log.info("Generating reader dashboard for user ID {}", readerId);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User currentUser = userRepo.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("Current user not found: {}", username);
                    return new DetailsNotFoundException("Current user not found");
                });

        if (!currentUser.getUserId().equals(readerId)) {
            log.error("Access denied: user {} tried to access dashboard of user {}", username, readerId);
            throw new AccessDeniedException("Readers can only see their own dashboard");
        }

        List<Reservation> reservations = reservationRepo.findByUserUsername(username);
        List<Loan> loans = loanRepo.findByUserUsername(username);

        Map<String, Long> booksPerCategory = new HashMap<>();
        for (Book book : bookRepo.findAll()) {
            String categoryName = (book.getCategory() != null) ? book.getCategory().getName() : "Uncategorized";
            booksPerCategory.put(categoryName, booksPerCategory.getOrDefault(categoryName, 0L) + 1);
        }

        Map<String, Long> booksByAvailability = new HashMap<>();
        for (Book book : bookRepo.findAll()) {
            if (book.getAvailabilityStatus() == null) {
                log.error("Book availability status is missing for book {}", book.getBookId());
                throw new DashboardException("Book availability status is missing");
            }
            String status = book.getAvailabilityStatus().name();
            booksByAvailability.put(status, booksByAvailability.getOrDefault(status, 0L) + 1);
        }

        long activeReservations = reservations.stream()
                .filter(r -> r.getStatus() == com.pod3.libraryTrack.constants.ReservationStatus.Active)
                .count();
        long activeLoans = loans.stream()
                .filter(l -> l.getStatus() == com.pod3.libraryTrack.constants.LoanStatus.Active || l.getStatus() == com.pod3.libraryTrack.constants.LoanStatus.Overdue)
                .count();

        long totalInProgressCount = readingProgressRepo.findByUserUserId(readerId).stream()
                .filter(p -> p.getPercentageComplete() != null && p.getPercentageComplete() < 100 && !isHistory(p))
                .count();

        DashboardDto dto = DashboardDto.builder()
                .totalBooks(bookRepo.count())
                .totalCategories(categoryRepo.count())
                .totalReservations(activeReservations)
                .totalLoans(activeLoans)
                .totalInProgress(totalInProgressCount)
                .booksPerCategory(booksPerCategory)
                .booksByAvailability(booksByAvailability)
                .build();

        log.info("Reader dashboard generated successfully for user {}", username);
        return dto;
    }

    private boolean isHistory(ReadingProgress progress) {
        boolean hasActiveLoan = loanRepo.existsByUserUsernameAndBookBookIdAndStatusIn(
                progress.getUser().getUsername(), progress.getBook().getBookId(), 
                List.of(com.pod3.libraryTrack.constants.LoanStatus.Active, com.pod3.libraryTrack.constants.LoanStatus.Overdue));
        boolean hasActiveReservation = reservationRepo.existsByUserUsernameAndBookBookIdAndStatus(
                progress.getUser().getUsername(), progress.getBook().getBookId(), 
                com.pod3.libraryTrack.constants.ReservationStatus.Active);
        return !hasActiveLoan && !hasActiveReservation;
    }
}