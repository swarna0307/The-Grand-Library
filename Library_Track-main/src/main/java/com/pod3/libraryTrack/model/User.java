package com.pod3.libraryTrack.model;

import java.time.LocalDate;


import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;



@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long userId;

	@Column(unique = true)
	private String username;

	@Column(unique = true)
	private String email;

	private String password;

	@ManyToOne
	@JoinColumn(name = "role_id")
	private Role role;

	private String gender;
	private Long phone;
	private String address;

	@CreationTimestamp
	private LocalDate registeredDate;
}