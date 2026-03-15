package com.pod3.libraryTrack.implementation;

import java.util.Date;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pod3.libraryTrack.Exceptions.AccessDeniedException;
import com.pod3.libraryTrack.Exceptions.DetailsNotFoundException;
import com.pod3.libraryTrack.Exceptions.ProgressNotFoundException;
import com.pod3.libraryTrack.dto.ReadingProgressDto;
import com.pod3.libraryTrack.model.Book;
import com.pod3.libraryTrack.model.ReadingProgress;
import com.pod3.libraryTrack.model.User;
import com.pod3.libraryTrack.repository.BookRepository;
import com.pod3.libraryTrack.repository.ReadingProgressRepository;
import com.pod3.libraryTrack.repository.UserRepository;
import com.pod3.libraryTrack.repository.LoanRepository;
import com.pod3.libraryTrack.repository.ReservationRepository;
import com.pod3.libraryTrack.constants.LoanStatus;
import com.pod3.libraryTrack.constants.ReservationStatus;

import com.pod3.libraryTrack.service.ReadingProgressService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReadingProgressServiceImp implements ReadingProgressService {

    private final ReadingProgressRepository readRepo;
    private final UserRepository userRepo;
    private final BookRepository bookRepo;
    private final LoanRepository loanRepo;
    private final ReservationRepository reservationRepo;

    @Override
    @Transactional
    public ReadingProgressDto createProgress(ReadingProgress readingProgress) {
        User currentUser = getCurrentUser();

        if (!readingProgress.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException("Readers can only create progress for themselves");
        }

        User userDetails = userRepo.findById(readingProgress.getUser().getUserId())
                .orElseThrow(() -> new DetailsNotFoundException("User Id not found"));

        Book book = bookRepo.findById(readingProgress.getBook().getBookId())
                .orElseThrow(() -> new DetailsNotFoundException("Book Id not found"));

        if (!"ROLE_READER".equals(userDetails.getRole().getName())) {
            throw new AccessDeniedException("Only Readers can create reading progress");
        }

        readingProgress.setUser(userDetails);
        readingProgress.setBook(book);

        return mapToDto(readRepo.save(readingProgress));
    }

    @Override
    public List<ReadingProgressDto> getAllProgresses() {
        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole().getName();

        List<ReadingProgress> progresses;
        if (isAdminOrLibrarian(roleName)) {
            progresses = readRepo.findAll();
        } else if ("ROLE_READER".equals(roleName)) {
            progresses = readRepo.findByUserUserId(currentUser.getUserId());
        } else {
            throw new AccessDeniedException("Unauthorized role");
        }

        return progresses.stream().map(this::mapToDto).toList();
    }

    @Override
    public ReadingProgressDto getProgressById(Long readingProgressId) {
        ReadingProgress progress = readRepo.findById(readingProgressId)
                .orElseThrow(() -> new ProgressNotFoundException("Invalid Progress Id"));

        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole().getName();

        if (isAdminOrLibrarian(roleName) || progress.getUser().getUserId().equals(currentUser.getUserId())) {
            return mapToDto(progress);
        }
        throw new AccessDeniedException("Access Denied");
    }

    @Override
    @Transactional
    public ReadingProgressDto updateProgress(Long readingProgressId, ReadingProgress readingProgress) {
        ReadingProgress progress = readRepo.findById(readingProgressId)
                .orElseThrow(() -> new ProgressNotFoundException("Invalid Progress Id"));

        User currentUser = getCurrentUser();
        if ("ROLE_READER".equals(currentUser.getRole().getName())) {
            if (!progress.getUser().getUserId().equals(currentUser.getUserId())) {
                throw new AccessDeniedException("Readers can only update their own progress");
            }
        } else {
            throw new AccessDeniedException("Only Readers can update");
        }

        boolean hasActiveLoan = loanRepo.existsByUserUsernameAndBookBookIdAndStatusIn(
                progress.getUser().getUsername(), progress.getBook().getBookId(), List.of(LoanStatus.Active, LoanStatus.Overdue));
        boolean hasActiveReservation = reservationRepo.existsByUserUsernameAndBookBookIdAndStatus(
                progress.getUser().getUsername(), progress.getBook().getBookId(), ReservationStatus.Active);

        if (!hasActiveLoan && !hasActiveReservation) {
            throw new AccessDeniedException("This reading progress is in history state and cannot be updated. Please loan or reserve the book again.");
        }

        if (readingProgress.getBook() != null)
            progress.setBook(readingProgress.getBook());
        if (readingProgress.getPercentageComplete() != null)
            progress.setPercentageComplete(readingProgress.getPercentageComplete());
        if (readingProgress.getPagesRead() != null)
            progress.setPagesRead(readingProgress.getPagesRead());
        if (readingProgress.getTotalPages() != null)
            progress.setTotalPages(readingProgress.getTotalPages());
        if (readingProgress.getUser() != null)
            progress.setUser(readingProgress.getUser());

        return mapToDto(readRepo.save(progress));
    }

    @Override
    @Transactional
    public void deleteProgress(Long readingProgressId) {
        ReadingProgress progress = readRepo.findById(readingProgressId)
                .orElseThrow(() -> new DetailsNotFoundException("Invalid Progress Id"));

        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole().getName();

        if (isAdminOrLibrarian(roleName) || progress.getUser().getUserId().equals(currentUser.getUserId())) {
            readRepo.delete(progress);
            return;
        }
        throw new AccessDeniedException("Access Denied");
    }

    private ReadingProgressDto mapToDto(ReadingProgress progress) {
        String rawUsername = progress.getUser().getUsername();
        String capitalizedUsername = rawUsername != null && !rawUsername.isEmpty() 
            ? rawUsername.substring(0, 1).toUpperCase() + rawUsername.substring(1) 
            : rawUsername;

        boolean hasActiveLoan = loanRepo.existsByUserUsernameAndBookBookIdAndStatusIn(
                progress.getUser().getUsername(), progress.getBook().getBookId(), List.of(LoanStatus.Active, LoanStatus.Overdue));
        boolean hasActiveReservation = reservationRepo.existsByUserUsernameAndBookBookIdAndStatus(
                progress.getUser().getUsername(), progress.getBook().getBookId(), ReservationStatus.Active);
        
        boolean isHistory = !hasActiveLoan && !hasActiveReservation;

        return ReadingProgressDto.builder()
                .progressId(progress.getProgressId())
                .userId(progress.getUser().getUserId())
                .username(capitalizedUsername)
                .book(progress.getBook())
                .pagesRead(progress.getPagesRead())
                .totalPages(progress.getTotalPages())
                .percentageComplete(progress.getPercentageComplete())
                .lastUpdated(progress.getLastUpdated())
                .isHistory(isHistory)
                .build();
    }

    private User getCurrentUser() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByUsername(currentUsername)
                .orElseThrow(() -> new DetailsNotFoundException("Current user not found"));
    }

    private boolean isAdminOrLibrarian(String roleName) {
        return "ROLE_ADMIN".equals(roleName) || "ROLE_LIBRARIAN".equals(roleName);
    }
}