package com.argusconstructores.api.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProjectImageRepository extends JpaRepository<ProjectImage, Long> {

    /** Id and order only: the projection keeps the bytes out of the query. */
    interface ImageSummary {
        Long getId();

        Long getProjectId();
    }

    List<ImageSummary> findByProjectIdInOrderByPositionAsc(Collection<Long> projectIds);

    Optional<ProjectImage> findByIdAndProjectId(Long id, Long projectId);

    @Query("select coalesce(max(i.position), -1) from ProjectImage i where i.projectId = :projectId")
    int findMaxPosition(Long projectId);

    @Modifying
    @Query("update ProjectImage i set i.position = :position where i.id = :id")
    void updatePosition(Long id, int position);
}
