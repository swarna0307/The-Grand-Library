package com.pod3.libraryTrack;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
public class ManualSchemaFixTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void widenStatusColumns() {
        System.out.println("Running manual schema fix for status columns...");
        
        try {
            jdbcTemplate.execute("ALTER TABLE reservation MODIFY COLUMN status VARCHAR(20)");
            System.out.println("✅ SUCCESSFULLY widened reservation.status to VARCHAR(20)!");
        } catch (Exception e) {
            System.err.println("❌ FAILED to widen reservation.status: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE book MODIFY COLUMN availability_status VARCHAR(20)");
            System.out.println("✅ SUCCESSFULLY widened book.availability_status to VARCHAR(20)!");
        } catch (Exception e) {
            System.err.println("❌ FAILED to widen book.availability_status: " + e.getMessage());
        }
    }
}
