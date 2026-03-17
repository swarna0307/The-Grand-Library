package com.pod3.libraryTrack.service;

import java.util.List;

import com.pod3.libraryTrack.dto.ReadingProgressDto;
import com.pod3.libraryTrack.model.ReadingProgress;

public interface ReadingProgressService {

    List<ReadingProgressDto> getAllProgresses();

    ReadingProgressDto getProgressById(Long readingProgressId);

    ReadingProgressDto createProgress(ReadingProgress readingProgress);

    ReadingProgressDto updateProgress(Long progressId, ReadingProgress readingProgress);

    void deleteProgress(Long readingProgressId);
}