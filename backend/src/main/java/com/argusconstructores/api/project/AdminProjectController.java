package com.argusconstructores.api.project;

import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.argusconstructores.api.project.ProjectDtos.OrderRequest;
import com.argusconstructores.api.project.ProjectDtos.ProjectRequest;
import com.argusconstructores.api.project.ProjectDtos.ProjectResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/** Full management, hidden projects included. {@code /admin/**} requires ROLE_ADMIN. */
@RestController
@RequestMapping("/admin/projects")
public class AdminProjectController {

    private final ProjectService projectService;

    public AdminProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProjectResponse> list() {
        return projectService.listAll();
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable Long id) {
        return projectService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@Valid @RequestBody ProjectRequest request) {
        return projectService.create(request);
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return projectService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        projectService.delete(id);
    }

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@Valid @RequestBody OrderRequest request) {
        projectService.reorder(request.ids());
    }

    /** One file per request; the size cap is {@code spring.servlet.multipart.max-file-size}. */
    @PostMapping("/{id}/images")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> addImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The file is empty");
        }
        return Map.of("id", projectService.addImage(id, file.getBytes()));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        projectService.deleteImage(id, imageId);
    }

    @PutMapping("/{id}/images/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderImages(@PathVariable Long id, @Valid @RequestBody OrderRequest request) {
        projectService.reorderImages(id, request.ids());
    }

    @GetMapping("/{id}/images/{imageId}")
    public ResponseEntity<byte[]> image(@PathVariable Long id, @PathVariable Long imageId) {
        return PublicProjectController.imageResponse(projectService.image(id, imageId, false), CacheControl.noStore());
    }
}
