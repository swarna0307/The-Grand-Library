package com.pod3.libraryTrack.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pod3.libraryTrack.dto.CategoryDto;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.model.Book;
import com.pod3.libraryTrack.service.BookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class BookController {

    private final BookService bookService;

    @PostMapping("/categories/{categoryId}/books")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<Book>> createBook(@PathVariable("categoryId") Long categoryId,
            @RequestBody Book book) {
        log.info("Creating a new book");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseStructure.success("Book created successfully", bookService.saveBook(book, categoryId)));
    }

    @GetMapping("/categories/{categoryId}/books")
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<CategoryDto>> getAllBooks(@PathVariable("categoryId") Long categoryId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author) {
        log.info("Fetching all books");
        return ResponseEntity.status(HttpStatus.OK).body(ResponseStructure.success("Fetched all books successfully",
                bookService.getAllBooks(categoryId, title, author)));
    }

    @GetMapping("/categories/{categoryId}/books/{bookId}")
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<Book>> getBookById(@PathVariable("categoryId") Long categoryId,
            @PathVariable Long bookId) {
        log.info("Fetching book with ID: {}", bookId);
        return ResponseEntity.status(HttpStatus.OK).body(ResponseStructure.success("Book found", bookService.getBookById(categoryId, bookId)));
    }

    @PatchMapping("/categories/{categoryId}/books/{bookId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<Book>> updateBook(@PathVariable("categoryId") Long categoryId,
            @PathVariable Long bookId, @RequestBody Book book) {
        log.info("Updating book with ID: {}", bookId);
        return ResponseEntity.status(HttpStatus.OK).body(ResponseStructure.success("Book updated successfully",
                bookService.updateBook(categoryId, bookId, book)));
    }

    @DeleteMapping("/categories/{categoryId}/books/{bookId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<String>> deleteBook(@PathVariable("categoryId") Long categoryId,
            @PathVariable Long bookId) {
        log.info("Attempting to delete book with ID: {}", bookId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(ResponseStructure.success("Deleted successfully", bookService.deleteBook(categoryId, bookId)));
    }

    @GetMapping("/books/isbn/{isbn}")
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<Book>> getBookByIsbn(@PathVariable String isbn) {
        log.info("Fetching book with ISBN: {}", isbn);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ResponseStructure.success("Book found", bookService.findByIsbn(isbn)));
    }
}
