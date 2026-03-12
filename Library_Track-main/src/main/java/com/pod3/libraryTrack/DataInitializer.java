package com.pod3.libraryTrack;

import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.pod3.libraryTrack.model.Role;
import com.pod3.libraryTrack.model.User;
import com.pod3.libraryTrack.repository.RoleRepository;
import com.pod3.libraryTrack.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class DataInitializer {

	@Bean
	CommandLineRunner initData(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			List<String> roles = List.of("ROLE_ADMIN", "ROLE_LIBRARIAN", "ROLE_READER");

			roles.stream()
					.map(roleName -> roleRepository.findByName(roleName)
							.orElseGet(() -> {
								Role role = Role.builder()
										.name(roleName)
										.build();
								return roleRepository.save(role);
							}))
					.toList();

			if (userRepository.findByEmail("admin@example.com").isEmpty()) {
				Role adminRole = roleRepository.findByName("ROLE_ADMIN")
						.orElseThrow(() -> new RuntimeException("ROLE_ADMIN not found after initialization"));

				User admin = new User();
				admin.setUsername("admin");
				admin.setEmail("admin@example.com");
				admin.setPassword(passwordEncoder.encode("admin123"));
				admin.setRole(adminRole);
				admin.setGender("Male");
				admin.setPhone(9876543210L);
				admin.setAddress("System Default Admin,india");

				userRepository.save(admin);
				log.info("Default admin created at startup.");
			} else {
				log.info("Admin already exists, skipping creation.");
			}
		};
	}
}
