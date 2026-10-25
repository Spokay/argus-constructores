package com.argusconstructores.api.project;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argusconstructores.api.project.ProjectDtos.ProjectResponse;

import java.time.Duration;
import java.util.List;

/** Anonymous read access to published projects only. */
@RestController
@RequestMapping("/projects")
public class PublicProjectController {

    private final ProjectService projectService;

    public PublicProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProjectResponse> list() {
        return projectService.listPublished();
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable Long id) {
        return projectService.getPublished(id);
    }

    /** Image bytes never change under an id, so browsers may keep them a day. */
    @GetMapping("/{id}/images/{imageId}")
    public ResponseEntity<byte[]> image(@PathVariable Long id, @PathVariable Long imageId) {
        return imageResponse(projectService.image(id, imageId, true), CacheControl.maxAge(Duration.ofDays(1)).cachePublic());
    }

    static ResponseEntity<byte[]> imageResponse(ProjectImage image, CacheControl cacheControl) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(cacheControl)
                .body(image.getData());
    }
}
