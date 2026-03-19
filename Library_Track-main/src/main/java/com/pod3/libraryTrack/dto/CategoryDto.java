package com.pod3.libraryTrack.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class CategoryDto {

	private Long categoryId;
    private String name;
    private String description;
    private List<BookDto> books;

}