package com.pod3.libraryTrack.dto;

import java.time.LocalDate;
import com.pod3.libraryTrack.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UserDto {
	
	private Long id;
	private String username;
	private String email;
	private Role role;
	private String gender;
	private Long phone;
	private String address;
	private LocalDate registeredDate;
	
}