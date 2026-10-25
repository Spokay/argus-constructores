package com.argusconstructores.api.project;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.argusconstructores.api.exception.ResourceNotFoundException;
import com.argusconstructores.api.project.ProjectDtos.ProjectRequest;
import com.argusconstructores.api.project.ProjectDtos.ProjectResponse;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectImageRepository imageRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectImageRepository imageRepository) {
        this.projectRepository = projectRepository;
        this.imageRepository = imageRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listPublished() {
        return withImages(projectRepository.findByPublishedTrueOrderByPositionAsc());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getPublished(Long id) {
        Project project = projectRepository.findByIdAndPublishedTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
        return withImages(List.of(project)).getFirst();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listAll() {
        return withImages(projectRepository.findAllByOrderByPositionAsc());
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(Long id) {
        return withImages(List.of(find(id))).getFirst();
    }

    /** New projects go last and stay hidden until published explicitly. */
    public ProjectResponse create(ProjectRequest request) {
        Project project = new Project(projectRepository.findMaxPosition() + 1);
        apply(project, request);
        project.setPublished(false);
        return ProjectResponse.of(projectRepository.save(project), List.of());
    }

    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = find(id);
        apply(project, request);
        if (request.published() != null) {
            project.setPublished(request.published());
        }
        return withImages(List.of(project)).getFirst();
    }

    /** Images go with it: the foreign key cascades. */
    public void delete(Long id) {
        projectRepository.delete(find(id));
    }

    public void reorder(List<Long> ids) {
        List<Project> projects = projectRepository.findAll();
        requireSameIds(ids, projects.stream().map(Project::getId).toList());
        Map<Long, Project> byId = projects.stream().collect(Collectors.toMap(Project::getId, p -> p));
        for (int position = 0; position < ids.size(); position++) {
            byId.get(ids.get(position)).setPosition(position);
        }
    }

    public Long addImage(Long projectId, byte[] data) {
        find(projectId);
        ImageType type = ImageType.detect(data).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only JPEG, PNG and WebP images are accepted"));
        int position = imageRepository.findMaxPosition(projectId) + 1;
        return imageRepository.save(new ProjectImage(projectId, position, type.contentType(), data)).getId();
    }

    public void deleteImage(Long projectId, Long imageId) {
        imageRepository.delete(findImage(projectId, imageId));
    }

    public void reorderImages(Long projectId, List<Long> ids) {
        find(projectId);
        List<Long> current = imageIdsOf(List.of(projectId)).getOrDefault(projectId, List.of());
        requireSameIds(ids, current);
        for (int position = 0; position < ids.size(); position++) {
            imageRepository.updatePosition(ids.get(position), position);
        }
    }

    /** An image of a hidden project is only served to the admin. */
    @Transactional(readOnly = true)
    public ProjectImage image(Long projectId, Long imageId, boolean publishedOnly) {
        if (publishedOnly && projectRepository.findByIdAndPublishedTrue(projectId).isEmpty()) {
            throw new ResourceNotFoundException("Project", projectId);
        }
        return findImage(projectId, imageId);
    }

    private Project find(Long id) {
        return projectRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private ProjectImage findImage(Long projectId, Long imageId) {
        return imageRepository.findByIdAndProjectId(imageId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Image", imageId));
    }

    private static void apply(Project project, ProjectRequest request) {
        project.setTitle(request.title().strip());
        project.setDescription(request.description().strip());
        project.setCity(request.city() == null || request.city().isBlank() ? null : request.city().strip());
        project.setCompletionYear(request.completionYear());
        project.setCategory(request.category());
    }

    private List<ProjectResponse> withImages(List<Project> projects) {
        Map<Long, List<Long>> imageIds = imageIdsOf(projects.stream().map(Project::getId).toList());
        return projects.stream()
                .map(project -> ProjectResponse.of(project, imageIds.getOrDefault(project.getId(), List.of())))
                .toList();
    }

    /** One query for every project's images, already in display order. */
    private Map<Long, List<Long>> imageIdsOf(List<Long> projectIds) {
        return imageRepository.findByProjectIdInOrderByPositionAsc(projectIds).stream()
                .collect(Collectors.groupingBy(ProjectImageRepository.ImageSummary::getProjectId,
                        Collectors.mapping(ProjectImageRepository.ImageSummary::getId, Collectors.toList())));
    }

    /** A reorder must name every existing id exactly once, or positions would silently collide. */
    private static void requireSameIds(List<Long> requested, List<Long> existing) {
        if (requested.size() != existing.size() || !new HashSet<>(requested).equals(new HashSet<>(existing))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The order must list every existing id exactly once");
        }
    }
}
