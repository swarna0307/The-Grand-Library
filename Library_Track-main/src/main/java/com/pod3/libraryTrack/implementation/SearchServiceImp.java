package com.pod3.libraryTrack.implementation;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pod3.libraryTrack.Exceptions.CategoryNotFoundException;
import com.pod3.libraryTrack.dto.BookDto;
import com.pod3.libraryTrack.dto.CategoryDto;
import com.pod3.libraryTrack.model.Book;
import com.pod3.libraryTrack.model.Category;
import com.pod3.libraryTrack.repository.BookRepository;
import com.pod3.libraryTrack.repository.CategoryRepository;
import com.pod3.libraryTrack.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SearchServiceImp implements SearchService {

    private final CategoryRepository categoryRepo;
    private final BookRepository bookRepo;

    @Override
    public CategoryDto getCategoryById(Long categoryId) {
        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Failed to fetch Categories"));
        
        List<Book> bookList = bookRepo.findByCategoryCategoryId(categoryId);
        List<BookDto> books = bookList.stream()
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
                .books(books)
                .build();
    }
 
}
