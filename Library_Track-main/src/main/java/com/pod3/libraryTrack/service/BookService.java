package com.pod3.libraryTrack.service;

import com.pod3.libraryTrack.dto.CategoryDto;
import com.pod3.libraryTrack.model.Book;

public interface BookService {

	CategoryDto getAllBooks(Long categoryId, String title, String author);

    Book getBookById(Long categoryId, Long bookId);

    Book saveBook(Book book,Long caegoryId);

    String deleteBook(Long catergoryId, Long bookId);

    Book updateBook(Long categoryId, Long bookId, Book updatedBook);

    Book findByIsbn(String isbn);
}
