package com.pod3.libraryTrack.repository;

import com.pod3.libraryTrack.model.Book;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

	List<Book> findByTitleContainingIgnoreCase(String title);

	List<Book> findByAuthorContainingIgnoreCase(String author);

	List<Book> findByCategoryCategoryId(Long categoryId);

	Optional<Book> findByIsbn(String isbn);

	boolean existsByIsbn(String isbn);

	List<Book> findByCategoryCategoryIdAndTitleContainingIgnoreCaseAndAuthorContainingIgnoreCase(Long categoryId,
			String title, String author);

	List<Book> findByCategoryCategoryIdAndTitleContainingIgnoreCase(Long categoryId, String title);

	List<Book> findByCategoryCategoryIdAndAuthorContainingIgnoreCase(Long categoryId, String author);

}