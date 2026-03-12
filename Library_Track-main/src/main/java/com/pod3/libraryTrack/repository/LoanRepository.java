package com.pod3.libraryTrack.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.pod3.libraryTrack.model.Loan;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
	List<Loan> findByUserUserId(Long userId);

	List<Loan> findByUserUsername(String username);
}
