package com.pod3.libraryTrack.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.model.Category;
import com.pod3.libraryTrack.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<Category>> createCategories(@RequestBody Category category) {
        log.info("Creating a new category with name: {}", category.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseStructure.success("Category List Created Successfully.", 
        		categoryService.createCategory(category)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<List<Category>>> getAllCategories() {
        log.info("Fetching all categories");
        return ResponseEntity.status(HttpStatus.OK).body(ResponseStructure.success("Category List Fetched Successfully.", 
        		categoryService.getAllCategories()));
    }

    @GetMapping("/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<Category>> getCategoriesById(@PathVariable Long categoryId) {
        log.info("Fetching category with ID: {}", categoryId);
        return ResponseEntity.status(HttpStatus.OK).body(ResponseStructure.success("Category Fetched By Id Successfully.", 
        		categoryService.getCategoryById(categoryId)));
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<Category>> updateCategory(@PathVariable Long categoryId,
            @RequestBody Category updates) {
        log.info("Updating category with ID: {}", categoryId);
        return ResponseEntity.status(HttpStatus.OK).body(ResponseStructure.success("Category Updated Successfully.", 
        		categoryService.updateCategory(categoryId, updates)));
    }

    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<String>> deleteCategoryById(@PathVariable Long categoryId) {
        log.info("Deleting category with ID: {}", categoryId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(ResponseStructure.success("Category Deleted Successfully.",
                categoryService.deleteCategoryById(categoryId)));
    }
}
