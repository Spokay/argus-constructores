package com.argusconstructores.api.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/**
 * Carries the image bytes, so it is only loaded to serve one image; listings go through
 * {@link ProjectImageRepository.ImageSummary}, which never selects {@code data}.
 * The project link is a plain id: the database cascades deletes, no association needed.
 */
@Entity
public class ProjectImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long projectId;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    protected ProjectImage() {
    }

    public ProjectImage(Long projectId, int position, String contentType, byte[] data) {
        this.projectId = projectId;
        this.position = position;
        this.contentType = contentType;
        this.data = data;
    }

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getData() {
        return data;
    }
}
