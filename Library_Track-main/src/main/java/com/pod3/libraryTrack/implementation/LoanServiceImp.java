package com.pod3.libraryTrack.implementation;

import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pod3.libraryTrack.Exceptions.AccessDeniedException;
import com.pod3.libraryTrack.Exceptions.BookNotExistsException;
import com.pod3.libraryTrack.Exceptions.DetailsNotFoundException;
import com.pod3.libraryTrack.Exceptions.LoanNotFoundException;
import com.pod3.libraryTrack.constants.AvailabilityStatus;
import com.pod3.libraryTrack.constants.LoanStatus;
import com.pod3.libraryTrack.dto.LoanDto;
import com.pod3.libraryTrack.model.Book;
import com.pod3.libraryTrack.model.Loan;
import com.pod3.libraryTrack.model.User;
import com.pod3.libraryTrack.repository.BookRepository;
import com.pod3.libraryTrack.repository.LoanRepository;
import com.pod3.libraryTrack.repository.UserRepository;
import com.pod3.libraryTrack.service.LoanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LoanServiceImp implements LoanService {

	private final LoanRepository loanRepo;
	private final UserRepository userRepository;
	private final BookRepository bookRepository;

	@Override
	@Transactional
	public LoanDto createLoan(Loan loan) {
		User user = userRepository.findById(loan.getUser().getUserId())
				.orElseThrow(() -> new DetailsNotFoundException("User Id not found"));

		Book book = bookRepository.findById(loan.getBook().getBookId())
				.orElseThrow(() -> new BookNotExistsException("Book Id not found"));

		if (!user.getRole().getName().endsWith("READER")) {
			throw new AccessDeniedException("Only Readers can be loaned books");
		}

		// Check that the book has available copies
		if (book.getCopies() <= 0 || book.getAvailabilityStatus() == AvailabilityStatus.NotAvailable) {
			throw new AccessDeniedException("Book has no available copies and cannot be loaned");
		}

		// Decrement copies
		int newCopies = book.getCopies() - 1;
		book.setCopies(newCopies);
		// If no copies remain, mark as Loaned (not available)
		if (newCopies == 0) {
			book.setAvailabilityStatus(AvailabilityStatus.Loaned);
		}
		// If copies still remain, book stays Available
		bookRepository.save(book);
		log.info("Loaned book '{}' (ID: {}). Copies remaining: {}", book.getTitle(), book.getBookId(), newCopies);

		loan.setUser(user);
		loan.setBook(book);
		if (loan.getStatus() == null) {
			loan.setStatus(LoanStatus.Active);
		}
		return mapToDto(loanRepo.save(loan));
	}

	@Override
	public List<LoanDto> getAllLoans() {
		User currentUser = getCurrentUser();
		String roleName = currentUser.getRole().getName();

		List<Loan> loans;
		if (isAdminOrLibrarian(roleName)) {
			loans = loanRepo.findAll();
		} else if (roleName.endsWith("READER")) {
			loans = loanRepo.findByUserUserId(currentUser.getUserId());
		} else {
			throw new AccessDeniedException("Unauthorized role");
		}
		
		checkAndUpdateOverdueLoans(loans);
		
		return loans.stream().map(this::mapToDto).toList();
	}

	@Override
	public LoanDto getLoanById(Long loanId) {
		Loan loan = loanRepo.findById(loanId).orElseThrow(() -> new LoanNotFoundException("Invalid Loan Id"));

		User currentUser = getCurrentUser();
		String roleName = currentUser.getRole().getName();

		checkAndUpdateOverdueLoan(loan);

		if (isAdminOrLibrarian(roleName) || loan.getUser().getUserId().equals(currentUser.getUserId())) {
			return mapToDto(loan);
		}
		throw new AccessDeniedException("Access Denied");
	}

	@Override
	@Transactional
	public LoanDto updateLoan(Long loanId, Loan loan) {
		Loan loanTemp = loanRepo.findById(loanId).orElseThrow(() -> new LoanNotFoundException("Invalid Loan Id"));

		if (loan.getBook() != null)
			loanTemp.setBook(loan.getBook());
		if (loan.getDueDate() != null) {
			loanTemp.setDueDate(loan.getDueDate());
			// If it was overdue but the new due date is >= today, auto-set to active
			java.time.LocalDate today = java.time.LocalDate.now();
			if (loanTemp.getStatus() == LoanStatus.Overdue && !loanTemp.getDueDate().isBefore(today)) {
				if (loan.getStatus() == LoanStatus.Overdue) {
					loan.setStatus(LoanStatus.Active); // override client's status if they sent overdue
				}
				loanTemp.setStatus(LoanStatus.Active);
				log.info("Due date extended. Auto-reverting status to Active for Loan ID: {}", loanId);
			}
		}
		if (loan.getLoanDate() != null)
			loanTemp.setLoanDate(loan.getLoanDate());
		if (loan.getReturnDate() != null) {
			loanTemp.setReturnDate(loan.getReturnDate());
			// Auto set status to Returned if a return date is added
			if (loan.getStatus() != LoanStatus.Returned) {
				loan.setStatus(LoanStatus.Returned);
			}
			log.info("Return date entered. Auto-setting status to Returned for Loan ID: {}", loanId);
		}
		if (loan.getStatus() != null) {
			log.info("Updating Loan ID: {} status from {} to {}", loanId, loanTemp.getStatus(), loan.getStatus());
			loanTemp.setStatus(loan.getStatus());

			// When loan is returned, increment copies and possibly restore availability
			if (loan.getStatus() == LoanStatus.Returned) {
				Book book = loanTemp.getBook();
				if (book != null) {
					int newCopies = book.getCopies() + 1;
					book.setCopies(newCopies);
					// If book had zero copies (was Loaned/NotAvailable), restore to Available
					if (book.getAvailabilityStatus() == AvailabilityStatus.Loaned
							|| book.getAvailabilityStatus() == AvailabilityStatus.NotAvailable) {
						book.setAvailabilityStatus(AvailabilityStatus.Available);
					}
					bookRepository.save(book);
					log.info("Loan returned. Book '{}' (ID: {}) now has {} copies.", book.getTitle(), book.getBookId(), newCopies);
				} else {
					log.warn("Loan ID: {} marked as Returned but has no associated Book!", loanId);
				}
			}
		}
		if (loan.getUser() != null)
			loanTemp.setUser(loan.getUser());

		return mapToDto(loanRepo.save(loanTemp));
	}

	@Override
	@Transactional
	public String deleteLoan(Long loanId) {
		Loan loan = loanRepo.findById(loanId).orElseThrow(() -> new LoanNotFoundException("Invalid Loan Id"));

		// Free a copy when an active/overdue loan record is deleted
		Book book = loan.getBook();
		if (book != null) {
			log.info("Deleting loan ID: {}. Current book status: {}", loanId, book.getAvailabilityStatus());
			// Only increment copies if the loan was not yet returned
			if (loan.getStatus() != LoanStatus.Returned) {
				int newCopies = book.getCopies() + 1;
				book.setCopies(newCopies);
				if (book.getAvailabilityStatus() == AvailabilityStatus.Loaned
						|| book.getAvailabilityStatus() == AvailabilityStatus.NotAvailable) {
					book.setAvailabilityStatus(AvailabilityStatus.Available);
				}
				bookRepository.save(book);
				log.info("Freeing book '{}' (ID: {}) on deletion of active/overdue loan. Copies: {}", book.getTitle(), book.getBookId(), newCopies);
			}
		}

		loanRepo.delete(loan);
		log.info("Loan ID: {} deleted successfully", loanId);
		return "Loan Deleted";
	}
	
	private void checkAndUpdateOverdueLoans(List<Loan> loans) {
		java.time.LocalDate today = java.time.LocalDate.now();
		boolean updated = false;
		for (Loan loan : loans) {
			if (loan.getStatus() == LoanStatus.Active && loan.getDueDate() != null && loan.getDueDate().isBefore(today)) {
				loan.setStatus(LoanStatus.Overdue);
				updated = true;
				log.info("Dynamically marked Loan ID: {} as Overdue", loan.getLoanId());
			} else if (loan.getStatus() == LoanStatus.Overdue && loan.getDueDate() != null && !loan.getDueDate().isBefore(today)) {
				loan.setStatus(LoanStatus.Active);
				updated = true;
				log.info("Dynamically marked Loan ID: {} back to Active due to extended date", loan.getLoanId());
			}
		}
		if (updated) {
			loanRepo.saveAll(loans);
		}
	}

	private void checkAndUpdateOverdueLoan(Loan loan) {
		java.time.LocalDate today = java.time.LocalDate.now();
		if (loan.getStatus() == LoanStatus.Active && loan.getDueDate() != null && loan.getDueDate().isBefore(today)) {
			loan.setStatus(LoanStatus.Overdue);
			loanRepo.save(loan);
			log.info("Dynamically marked Loan ID: {} as Overdue", loan.getLoanId());
		} else if (loan.getStatus() == LoanStatus.Overdue && loan.getDueDate() != null && !loan.getDueDate().isBefore(today)) {
			loan.setStatus(LoanStatus.Active);
			loanRepo.save(loan);
			log.info("Dynamically marked Loan ID: {} back to Active due to extended date", loan.getLoanId());
		}
	}

	private LoanDto mapToDto(Loan loan) {
		return LoanDto.builder()
				.loanId(loan.getLoanId())
				.userId(loan.getUser().getUserId())
				.userName(loan.getUser().getUsername())
				.book(loan.getBook())
				.loanDate(loan.getLoanDate())
				.dueDate(loan.getDueDate())
				.returnDate(loan.getReturnDate())
				.status(loan.getStatus())
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
