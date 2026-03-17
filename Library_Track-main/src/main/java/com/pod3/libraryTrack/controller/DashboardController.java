package com.pod3.libraryTrack.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pod3.libraryTrack.dto.DashboardDto;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/dashboard")
@Slf4j
@RequiredArgsConstructor
public class DashboardController {

	private final DashboardService dashboardService;

	@GetMapping
	@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
	public ResponseEntity<ResponseStructure<DashboardDto>> getDashboard() {
		log.info("Fetching dashboard report for ADMIN/LIBRARIAN");
		DashboardDto dashboard = dashboardService.getDashboardReport();

		ResponseStructure<DashboardDto> response = ResponseStructure.<DashboardDto>builder()
				.message("Dashboard report fetched successfully.").data(dashboard).build();

		return ResponseEntity.status(HttpStatus.OK).body(response);
	}

	@GetMapping("/reader/{readerId}")
	@PreAuthorize("hasAnyRole('READER')")
	public ResponseEntity<ResponseStructure<DashboardDto>> getReaderDashboard(@PathVariable Long readerId) {
		log.info("Fetching dashboard report for READER with ID: {}", readerId);
		DashboardDto dashboard = dashboardService.getReaderDashboardById(readerId);

		ResponseStructure<DashboardDto> response = ResponseStructure.<DashboardDto>builder()
				.message("Reader dashboard fetched successfully.").data(dashboard).build();

		return ResponseEntity.status(HttpStatus.OK).body(response);
	}
}