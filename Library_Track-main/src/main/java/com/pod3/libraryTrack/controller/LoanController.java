package com.pod3.libraryTrack.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.pod3.libraryTrack.dto.LoanDto;
import com.pod3.libraryTrack.dto.ResponseStructure;
import com.pod3.libraryTrack.model.Loan;
import com.pod3.libraryTrack.service.LoanService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
@Slf4j
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<LoanDto>> createLoan(@RequestBody Loan loan) {
        log.info("Creating new loan");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseStructure.success("Loan Created Successfully", loanService.createLoan(loan)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN','READER')")
    public ResponseEntity<ResponseStructure<List<LoanDto>>> getAllLoans() {
        log.info("Fetching all loans");
        return ResponseEntity.ok(ResponseStructure.success("Loans Retrieved Successfully", loanService.getAllLoans()));
    }

    @GetMapping("/{loanId}")
    @PreAuthorize("hasAnyRole('ADMIN','READER','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<LoanDto>> getLoanById(@PathVariable Long loanId) {
        log.info("Fetching loan with ID: {}", loanId);
        return ResponseEntity
                .ok(ResponseStructure.success("Loan Retrieved Successfully", loanService.getLoanById(loanId)));
    }

    @PutMapping("/{loanId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<LoanDto>> updateLoan(@PathVariable Long loanId, @RequestBody Loan loan) {
        log.info("Updating loan with ID: {}", loanId);
        return ResponseEntity
                .ok(ResponseStructure.success("Loan Updated Successfully", loanService.updateLoan(loanId, loan)));
    }

    @DeleteMapping("/{loanId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<ResponseStructure<String>> deleteLoan(@PathVariable Long loanId) {
        log.info("Deleting loan with ID: {}", loanId);
        return ResponseEntity
                .ok(ResponseStructure.success("Loan Deleted Successfully", loanService.deleteLoan(loanId)));
    }
}
