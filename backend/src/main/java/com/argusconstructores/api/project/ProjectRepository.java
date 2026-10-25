package com.argusconstructores.api.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByOrderByPositionAsc();

    List<Project> findByPublishedTrueOrderByPositionAsc();

    Optional<Project> findByIdAndPublishedTrue(Long id);

    @Query("select coalesce(max(p.position), -1) from Project p")
    int findMaxPosition();
}
