package com.pod3.libraryTrack.repository;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;
import com.pod3.libraryTrack.model.ReadingProgress;

@Repository
public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, Long> {
	List<ReadingProgress> findByUserUserId(Long userId);

	@Modifying
	@Transactional
	void deleteByBookBookId(Long bookId);
}
