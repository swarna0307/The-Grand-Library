package com.pod3.libraryTrack.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.dto.UserDto;
import com.pod3.libraryTrack.model.User;
import com.pod3.libraryTrack.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseStructure<UserDto>> createUser(@RequestBody User user) {
        log.info("Creating new user with username: {}", user.getUsername());
        UserDto createdUser = userService.createUser(user);
        log.info("Returning response for createUser with ID: {}", createdUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseStructure.success("User Created Successfully.", createdUser));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseStructure<List<UserDto>>> getAllUsers() {
        log.info("Fetching all users");
        List<UserDto> users = userService.getAllUsers();
        log.info("Returning response for getAllUsers, count: {}", users.size());
        return ResponseEntity.ok(ResponseStructure.success("Users Fetched Successfully", users));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ResponseStructure<UserDto>> getUserById(@PathVariable Long userId) {
        log.info("Fetching user by ID: {}", userId);
        UserDto user = userService.getUserById(userId);
        log.info("Returning response for getUserById with ID: {}", userId);
        return ResponseEntity.ok(ResponseStructure.success("User Fetched By Id Successfully.", user));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ResponseStructure<UserDto>> updateUser(@PathVariable Long userId, @RequestBody User user) {
        log.info("Updating user with ID: {}", userId);
        UserDto updatedUser = userService.updateUser(userId, user);
        log.info("Returning response for updateUser with ID: {}", userId);
        return ResponseEntity.ok(ResponseStructure.success("User Updated Successfully", updatedUser));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ResponseStructure<String>> deleteUserById(@PathVariable Long userId) {
        log.info("Deleting user with ID: {}", userId);
        String result = userService.deleteUserById(userId);
        log.info("Returning response for deleteUserById with ID: {}", userId);
        return ResponseEntity.ok(ResponseStructure.success("User Deleted Successfully.", result));
    }
}
