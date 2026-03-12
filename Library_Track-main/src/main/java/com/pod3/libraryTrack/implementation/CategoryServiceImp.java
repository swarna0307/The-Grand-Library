package com.pod3.libraryTrack.implementation;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pod3.libraryTrack.Exceptions.CategoryNotFoundException;
import com.pod3.libraryTrack.Exceptions.DetailsAlreadyExistsException;
import com.pod3.libraryTrack.model.Category;
import com.pod3.libraryTrack.model.Book;
import com.pod3.libraryTrack.repository.CategoryRepository;
import com.pod3.libraryTrack.repository.BookRepository;
import com.pod3.libraryTrack.service.CategoryService;
import com.pod3.libraryTrack.service.BookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CategoryServiceImp implements CategoryService {

    private final CategoryRepository categoryRepo;

    @Override
    @Transactional
    public Category createCategory(Category category) {
        if (categoryRepo.existsByName(category.getName())) {
            throw new DetailsAlreadyExistsException("Category already present");
        }
        return categoryRepo.save(category);
    }

    @Override
    public List<Category> getAllCategories() {
        List<Category> categories = categoryRepo.findAll();
        if (categories.isEmpty()) {
            throw new CategoryNotFoundException("No categories available");
        }
        return categories;
    }

    @Override
    public Category getCategoryById(Long categoryId) {
        return categoryRepo.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Failed to fetch Categories"));
    }

    @Override
    @Transactional
    public Category updateCategory(Long categoryId, Category category) {
        Category existingCategory = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Categories not found"));

        if (category.getName() != null)
            existingCategory.setName(category.getName());
        if (category.getDescription() != null)
            existingCategory.setDescription(category.getDescription());

        return categoryRepo.save(existingCategory);
    }

    private final BookRepository bookRepo;
    private final BookService bookService;

    @Override
    @Transactional
    public String deleteCategoryById(Long categoryId) {
        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found"));

        log.info("Performing cascading deletion for category ID: {}", categoryId);
        
        // Find all books in this category and delete them one by one
        // to invoke the cascading logic in BookService (loans, progress, etc)
        List<Book> books = bookRepo.findByCategoryCategoryId(categoryId);
        for (Book book : books) {
            bookService.deleteBook(categoryId, book.getBookId());
        }

        categoryRepo.delete(category);
        log.info("Category ID: {} and its books were deleted successfully", categoryId);
        return "Category deletion completed";
    }
}
