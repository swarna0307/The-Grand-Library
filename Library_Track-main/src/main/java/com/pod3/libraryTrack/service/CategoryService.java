package com.pod3.libraryTrack.service;

import java.util.List;
import com.pod3.libraryTrack.model.Category;

public interface CategoryService {

    List<Category> getAllCategories();

    Category createCategory(Category category);

    Category getCategoryById(Long categoryId);

    Category updateCategory(Long categoryId, Category category);

    String deleteCategoryById(Long categoryId);
}

