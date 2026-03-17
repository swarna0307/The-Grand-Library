package com.pod3.libraryTrack.service;

import java.util.List;

import com.pod3.libraryTrack.dto.LoanDto;
import com.pod3.libraryTrack.model.Loan;

public interface LoanService {

    List<LoanDto> getAllLoans();

    LoanDto getLoanById(Long loanId);

    LoanDto createLoan(Loan loan);

    LoanDto updateLoan(Long loanId, Loan loan);

    String deleteLoan(Long loanId);
}

