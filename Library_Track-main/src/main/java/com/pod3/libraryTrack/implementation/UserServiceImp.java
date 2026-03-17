package com.pod3.libraryTrack.implementation;

import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import com.pod3.libraryTrack.Exceptions.AccessDeniedException;
import com.pod3.libraryTrack.Exceptions.DetailsAlreadyExistsException;
import com.pod3.libraryTrack.Exceptions.DetailsNotFoundException;
import com.pod3.libraryTrack.dto.UserDto;
import com.pod3.libraryTrack.model.Role;
import com.pod3.libraryTrack.model.User;
import com.pod3.libraryTrack.repository.RoleRepository;
import com.pod3.libraryTrack.repository.UserRepository;
import com.pod3.libraryTrack.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserServiceImp implements UserService {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public UserDto registerReader(User userDetails) {
		log.info("Registering new reader with username: {}", userDetails.getUsername());

		if (userRepository.findByEmail(userDetails.getEmail()).isPresent()) {
			throw new DetailsAlreadyExistsException("Email already exists");
		}
		if (userRepository.findByUsername(userDetails.getUsername()).isPresent()) {
			throw new DetailsAlreadyExistsException("Username already exists");
		}

		Role role = roleRepository.findByName("ROLE_READER")
				.orElseThrow(() -> new DetailsNotFoundException("Role not found"));

		userDetails.setPassword(passwordEncoder.encode(userDetails.getPassword()));
		userDetails.setRole(role);
		User user = userRepository.save(userDetails);

		log.info("Reader registered successfully with ID: {}", user.getUserId());
		return mapToDto(user);
	}

	@Override
	@Transactional
	public UserDto createUser(User userDetails) {
		if (userRepository.findByEmail(userDetails.getEmail()).isPresent()) {
			throw new DetailsAlreadyExistsException("Email already exists");
		}
		if (userRepository.findByUsername(userDetails.getUsername()).isPresent()) {
			throw new DetailsAlreadyExistsException("Username already exists");
		}

		Role role = roleRepository.findByName(userDetails.getRole().getName())
				.orElseThrow(() -> new DetailsNotFoundException("Role not found: " + userDetails.getRole().getName()));

		userDetails.setPassword(passwordEncoder.encode(userDetails.getPassword()));
		userDetails.setRole(role);

		User user = userRepository.save(userDetails);
		return mapToDto(user);
	}

	@Override
	public List<UserDto> getAllUsers() {
		log.info("Fetching all users");
		List<User> users = userRepository.findAll();

		if (users.isEmpty()) {
			log.warn("No users found");
			throw new DetailsNotFoundException("Users not found");
		}

		return users.stream().map(this::mapToDto).toList();
	}

	@Override
	public UserDto getUserById(Long userId) {
		User currentUser = getCurrentUser();
		User requestedUser = userRepository.findById(userId)
				.orElseThrow(() -> new DetailsNotFoundException("User not found"));

		if (isAdmin(currentUser) || currentUser.getUserId().equals(userId)) {
			return mapToDto(requestedUser);
		}
		throw new AccessDeniedException("Access Denied");
	}

	@Override
	@Transactional
	public UserDto updateUser(Long userId, User updatedUser) {
		User currentUser = getCurrentUser();
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new DetailsNotFoundException("User not found"));

		if (!isAdmin(currentUser) && !currentUser.getUserId().equals(userId)) {
			throw new AccessDeniedException("Access Denied");
		}

		if (updatedUser.getUsername() != null)
			user.setUsername(updatedUser.getUsername());
		if (updatedUser.getPassword() != null)
			user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
		if (updatedUser.getGender() != null)
			user.setGender(updatedUser.getGender());
		if (updatedUser.getPhone() != null)
			user.setPhone(updatedUser.getPhone());
		if (updatedUser.getAddress() != null)
			user.setAddress(updatedUser.getAddress());
		if (updatedUser.getRole() != null)
			user.setRole(updatedUser.getRole());

		return mapToDto(userRepository.save(user));
	}

	@Override
	@Transactional
	public String deleteUserById(Long userId) {
		User currentUser = getCurrentUser();
		User requestedUser = userRepository.findById(userId)
				.orElseThrow(() -> new DetailsNotFoundException("User not found"));

		if (isAdmin(currentUser) || currentUser.getUserId().equals(userId)) {
			userRepository.delete(requestedUser);
			return "User deleted successfully";
		}
		throw new AccessDeniedException("Access Denied");
	}

	private UserDto mapToDto(User user) {
		return UserDto.builder()
				.id(user.getUserId())
				.username(user.getUsername())
				.email(user.getEmail())
				.role(user.getRole())
				.gender(user.getGender())
				.phone(user.getPhone())
				.address(user.getAddress())
				.registeredDate(user.getRegisteredDate())
				.build();
	}

	private User getCurrentUser() {
		String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByUsername(currentUsername)
				.orElseThrow(() -> new DetailsNotFoundException("Current user not found"));
	}

	private boolean isAdmin(User user) {
		return user.getRole().getName().equals("ROLE_ADMIN");
	}
}
