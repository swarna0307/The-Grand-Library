package com.pod3.libraryTrack.model;

import com.pod3.libraryTrack.constants.AvailabilityStatus;
import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookId;

    private String title;
    private String author;

    @Column(length = 17, unique = true)
    private String isbn;

    @ManyToOne
    @JoinColumn(name = "categoryId")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.Available;

    @Column(columnDefinition = "integer default 1")
    @Builder.Default
    private int copies = 1;

    @Column(columnDefinition = "integer default 1")
    @Builder.Default
    private int totalCopies = 1;

}