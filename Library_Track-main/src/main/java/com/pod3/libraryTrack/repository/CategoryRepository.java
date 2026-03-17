package com.pod3.libraryTrack.repository;

import com.pod3.libraryTrack.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

	boolean existsByName(String name);
	
}