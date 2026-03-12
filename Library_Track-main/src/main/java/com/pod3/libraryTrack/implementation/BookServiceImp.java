package com.pod3.libraryTrack.implementation;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pod3.libraryTrack.Exceptions.BookNotExistsException;
import com.pod3.libraryTrack.Exceptions.CategoryNotFoundException;
import com.pod3.libraryTrack.Exceptions.DetailsAlreadyExistsException;
import com.pod3.libraryTrack.dto.BookDto;
import com.pod3.libraryTrack.dto.CategoryDto;
import com.pod3.libraryTrack.model.Book;
import com.pod3.libraryTrack.model.Category;
import com.pod3.libraryTrack.repository.BookRepository;
import com.pod3.libraryTrack.repository.CategoryRepository;
import com.pod3.libraryTrack.service.BookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookServiceImp implements BookService {

	private final BookRepository bookRepository;
	private final CategoryRepository categoryRepository;

	@Override
	@Transactional
	public Book saveBook(Book book, Long categoryId) {
		log.info("Saving book with ISBN: {}", book.getIsbn());
		if (bookRepository.existsByIsbn(book.getIsbn())) {
			throw new DetailsAlreadyExistsException("Book already exists");
		}
		Category category = categoryRepository.findById(categoryId)
				.orElseThrow(() -> new BookNotExistsException("Category not found"));

		book.setCategory(category);
		return bookRepository.save(book);
	}

	@Override
	public CategoryDto getAllBooks(Long categoryId, String title, String author) {
		log.info("Fetching books for category: {}", categoryId);
		Category category = categoryRepository.findById(categoryId)
				.orElseThrow(() -> new CategoryNotFoundException("Category not found"));

		List<Book> bookEntities;
		if (title != null && author != null) {
			bookEntities = bookRepository
					.findByCategoryCategoryIdAndTitleContainingIgnoreCaseAndAuthorContainingIgnoreCase(categoryId,
							title, author);
		} 
		else if (title != null) {
			bookEntities = bookRepository.findByCategoryCategoryIdAndTitleContainingIgnoreCase(categoryId, title);
		} 
		else if (author != null) {
			bookEntities = bookRepository.findByCategoryCategoryIdAndAuthorContainingIgnoreCase(categoryId, author);
		} 
		else {
			bookEntities = bookRepository.findByCategoryCategoryId(categoryId);
		} 
		// Convert entities to DTOs
		List<BookDto> books = bookEntities.stream()
				.map(book -> BookDto.builder()
						.bookId(book.getBookId())
						.title(book.getTitle())
						.author(book.getAuthor())
						.isbn(book.getIsbn())
						.availabilityStatus(book.getAvailabilityStatus())
						.build()).toList();

		return CategoryDto.builder()
				.categoryId(category.getCategoryId())
				.name(category.getName())
				.description(category.getDescription())
				.books(books).build();
	}

	@Override
	public Book getBookById(Long categoryId, Long bookId) {
		return bookRepository
				.findById(bookId).filter(b -> b.getCategory().getCategoryId().equals(categoryId))
				.orElseThrow(() -> new BookNotExistsException("Book not found in this category"));
	}

	@Override
	@Transactional
	public Book updateBook(Long categoryId, Long bookId, Book updatedBook) {
		Book book = bookRepository.findById(bookId).filter(b -> b.getCategory().getCategoryId().equals(categoryId))
				.orElseThrow(() -> new BookNotExistsException("Book not found or category mismatch"));

		if (updatedBook.getTitle() != null)
			book.setTitle(updatedBook.getTitle());
		if (updatedBook.getAuthor() != null)
			book.setAuthor(updatedBook.getAuthor());
		if (updatedBook.getAvailabilityStatus() != null)
			book.setAvailabilityStatus(updatedBook.getAvailabilityStatus());

		return bookRepository.save(book);
	}

	@Override
	@Transactional
	public String deleteBook(Long categoryId, Long bookId) {
		Book book = bookRepository.findById(bookId).filter(b -> b.getCategory().getCategoryId().equals(categoryId))
				.orElseThrow(() -> new BookNotExistsException("Book not found or category mismatch"));

		bookRepository.delete(book);
		return "Book deleted successfully";
	}

	@Override
	public Book findByIsbn(String isbn) {
		log.info("Fetching book with ISBN: {}", isbn);
		return bookRepository.findByIsbn(isbn)
				.orElseThrow(() -> new BookNotExistsException("Book not found with ISBN: " + isbn));
	}
}
