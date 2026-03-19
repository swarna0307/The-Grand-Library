package com.pod3.libraryTrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ResponseStructure<T> {
	private String message;
	private T data;

	public static <T> ResponseStructure<T> success(String message, T data) {
		return ResponseStructure.<T>builder()
				.message(message)
				.data(data)
				.build();
	}

	public static <T> ResponseStructure<T> error(String message, T data) {
		return ResponseStructure.<T>builder()
				.message(message)
				.data(data)
				.build();
	}
}