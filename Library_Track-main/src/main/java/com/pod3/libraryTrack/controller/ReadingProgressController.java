package com.pod3.libraryTrack.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pod3.libraryTrack.dto.ReadingProgressDto;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.model.ReadingProgress;
import com.pod3.libraryTrack.service.ReadingProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/readingprogress")
@RequiredArgsConstructor
@Slf4j
public class ReadingProgressController {

    private final ReadingProgressService readService;

    @PostMapping
    @PreAuthorize("hasAnyRole('READER')")
    public ResponseEntity<ResponseStructure<ReadingProgressDto>> createProgress(@RequestBody ReadingProgress progress) {
        log.info("Creating reading progress");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseStructure.success("Reading Progress Created Successfully",
                        readService.createProgress(progress)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<List<ReadingProgressDto>>> getAllProgresses() {
        log.info("Fetching all reading progresses");
        return ResponseEntity
                .ok(ResponseStructure.success("Progresses Retrieved Successfully", readService.getAllProgresses()));
    }

    @GetMapping("/{readingprogressId}")
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<ReadingProgressDto>> getProgressById(@PathVariable Long readingprogressId) {
        log.info("Fetching reading progress with ID: {}", readingprogressId);
        return ResponseEntity.ok(ResponseStructure.success("Progress Retrieved Successfully",
                readService.getProgressById(readingprogressId)));
    }

    @PutMapping("/{readingprogressId}")
    @PreAuthorize("hasAnyRole('READER')")
    public ResponseEntity<ResponseStructure<ReadingProgressDto>> updateProgress(@PathVariable Long readingprogressId,
            @RequestBody ReadingProgress progress) {
        log.info("Updating reading progress with ID: {}", readingprogressId);
        return ResponseEntity.ok(ResponseStructure.success("Progress Updated Successfully",
                readService.updateProgress(readingprogressId, progress)));
    }

    @DeleteMapping("/{readingprogressId}")
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<String>> deleteProgress(@PathVariable Long readingprogressId) {
        log.info("Deleting reading progress with ID: {}", readingprogressId);
        readService.deleteProgress(readingprogressId);
        return ResponseEntity.ok(ResponseStructure.success("Progress Deleted Successfully",
                "Deleted progress with ID: " + readingprogressId));
    }
}