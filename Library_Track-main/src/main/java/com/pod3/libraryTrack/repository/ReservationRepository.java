package com.pod3.libraryTrack.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.pod3.libraryTrack.model.Reservation;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation,Long> {
	List<Reservation> findByUserUserId(Long userId);

	List<Reservation> findByUserUsername(String username);
}
