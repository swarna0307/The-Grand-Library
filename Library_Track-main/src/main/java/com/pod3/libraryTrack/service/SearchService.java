package com.pod3.libraryTrack.service;

import com.pod3.libraryTrack.dto.CategoryDto;

public interface SearchService {

    CategoryDto getCategoryById(Long categoryId);
}

