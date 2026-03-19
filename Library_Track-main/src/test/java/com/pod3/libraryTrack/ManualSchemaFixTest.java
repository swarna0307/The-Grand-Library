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
            
            // Clean up old data values that are no longer in the enum
            jdbcTemplate.execute("UPDATE book SET availability_status = 'NotAvailable' WHERE availability_status IN ('Loaned', 'Reserved')");
            
            // Ensure consistency between available_copies and availability_status
            jdbcTemplate.execute("UPDATE book SET availability_status = 'Available' WHERE available_copies > 0");
            jdbcTemplate.execute("UPDATE book SET availability_status = 'NotAvailable' WHERE available_copies = 0");
            
            System.out.println("✅ SUCCESSFULLY cleaned up and synced availability statuses!");
        } catch (Exception e) {
            System.err.println("❌ FAILED to update book status column or data: " + e.getMessage());
        }
    }
}
