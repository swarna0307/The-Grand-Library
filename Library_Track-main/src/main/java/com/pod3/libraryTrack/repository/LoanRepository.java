package com.pod3.libraryTrack.repository;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;
import com.pod3.libraryTrack.model.Loan;
import com.pod3.libraryTrack.constants.LoanStatus;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
	List<Loan> findByUserUserId(Long userId);

	List<Loan> findByUserUsername(String username);

	@Modifying
	@Transactional
	void deleteByBookBookId(Long bookId);
	
	boolean existsByBookBookIdAndStatusIn(Long bookId, List<LoanStatus> statuses);

	boolean existsByUserUsernameAndBookBookIdAndStatusIn(String username, Long bookId, List<LoanStatus> statuses);
}
