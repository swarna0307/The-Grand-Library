package com.pod3.libraryTrack.service;

import java.util.List;
import com.pod3.libraryTrack.dto.UserDto;
import com.pod3.libraryTrack.model.User;

public interface UserService {

    UserDto registerReader(User userDetails);

    UserDto createUser(User userDetails);

    List<UserDto> getAllUsers();

    UserDto getUserById(Long userId);

    UserDto updateUser(Long userId, User updatedUser);

    String deleteUserById(Long userId);
}

