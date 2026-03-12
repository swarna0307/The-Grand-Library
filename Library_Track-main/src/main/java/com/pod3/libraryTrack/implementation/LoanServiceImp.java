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

		// Mark book as Loaned
		book.setAvailabilityStatus(AvailabilityStatus.Loaned);
		bookRepository.save(book);

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
		return loans.stream().map(this::mapToDto).toList();
	}

	@Override
	public LoanDto getLoanById(Long loanId) {
		Loan loan = loanRepo.findById(loanId).orElseThrow(() -> new LoanNotFoundException("Invalid Loan Id"));

		User currentUser = getCurrentUser();
		String roleName = currentUser.getRole().getName();

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
		if (loan.getDueDate() != null)
			loanTemp.setDueDate(loan.getDueDate());
		if (loan.getLoanDate() != null)
			loanTemp.setLoanDate(loan.getLoanDate());
		if (loan.getReturnDate() != null)
			loanTemp.setReturnDate(loan.getReturnDate());
		if (loan.getStatus() != null) {
			loanTemp.setStatus(loan.getStatus());
			// When loan is returned, free the book
			if (loan.getStatus() == LoanStatus.Returned) {
				Book book = loanTemp.getBook();
				if (book != null) {
					book.setAvailabilityStatus(AvailabilityStatus.Available);
					bookRepository.save(book);
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

		// Free the book when loan record is deleted
		Book book = loan.getBook();
		if (book != null && book.getAvailabilityStatus() == AvailabilityStatus.Loaned) {
			book.setAvailabilityStatus(AvailabilityStatus.Available);
			bookRepository.save(book);
		}

		loanRepo.delete(loan);
		return "Loan Deleted";
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
