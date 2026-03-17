package com.pod3.libraryTrack.repository;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;
import com.pod3.libraryTrack.model.Reservation;
import com.pod3.libraryTrack.constants.ReservationStatus;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation,Long> {
	List<Reservation> findByUserUserId(Long userId);

	List<Reservation> findByUserUsername(String username);

	@Modifying
	@Transactional
	void deleteByBookBookId(Long bookId);

	boolean existsByBookBookIdAndStatus(Long bookId, ReservationStatus status);

	boolean existsByUserUsernameAndBookBookIdAndStatus(String username, Long bookId, ReservationStatus status);
}
