package com.pod3.libraryTrack.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.pod3.libraryTrack.dto.CategoryDto;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.service.SearchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/search/categories/{categoryId}/books")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<CategoryDto>> getCategoriesById(
            @PathVariable("categoryId") Long categoryId) {
        log.info("Searching category by ID: {}", categoryId);
        return ResponseEntity.ok(ResponseStructure.success("Categories Fetched by Id Successfully.",
                searchService.getCategoryById(categoryId)));
    }
}
