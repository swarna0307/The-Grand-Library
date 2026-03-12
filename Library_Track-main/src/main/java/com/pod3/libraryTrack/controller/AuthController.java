package com.pod3.libraryTrack.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.pod3.libraryTrack.dto.LoginResponseDto;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.dto.UserDto;
import com.pod3.libraryTrack.model.User;
import com.pod3.libraryTrack.repository.UserRepository;
import com.pod3.libraryTrack.security.JwtUtils;
import com.pod3.libraryTrack.service.CustomUserDetailsService;
import com.pod3.libraryTrack.service.UserService;
import com.pod3.libraryTrack.Exceptions.DetailsNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;
    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ResponseStructure<UserDto>> register(@RequestBody User user) {
        UserDto registeredUser = userService.registerReader(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseStructure.success("Reader Created Successfully.", registeredUser));
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseStructure<LoginResponseDto>> login(@RequestBody User request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtUtils.generateToken(userDetails);

        // Fetch user entity from DB to get correct role and userId
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new DetailsNotFoundException("User not found"));

        LoginResponseDto loginResponse = LoginResponseDto.builder()
                .token(token)
                .role(user.getRole().getName())       // e.g. "ROLE_ADMIN"
                .userId(user.getUserId())
                .username(user.getUsername())
                .build();

        return ResponseEntity.ok(ResponseStructure.success("User Logged In Successfully.", loginResponse));
    }
}
