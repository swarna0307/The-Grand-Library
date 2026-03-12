package com.pod3.libraryTrack.service;

import com.pod3.libraryTrack.dto.DashboardDto;

public interface DashboardService {

    DashboardDto getDashboardReport();

    DashboardDto getReaderDashboardById(Long readerId);
}

