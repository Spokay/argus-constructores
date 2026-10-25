package com.argusconstructores.api.project;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Wire shapes of the project API, public and admin. */
public final class ProjectDtos {

    private ProjectDtos() {
    }

    /**
     * Body of create and update. {@code published} is ignored on create (a new project starts
     * hidden) and, when absent, leaves an update's visibility unchanged.
     */
    public record ProjectRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank String description,
            @Size(max = 100) String city,
            @Min(1900) @Max(2100) Integer completionYear,
            @NotNull Category category,
            Boolean published) {
    }

    /** {@code imageIds} is in display order; the first one is the cover. */
    public record ProjectResponse(
            Long id,
            String title,
            String description,
            String city,
            Integer completionYear,
            Category category,
            boolean published,
            List<Long> imageIds) {

        static ProjectResponse of(Project project, List<Long> imageIds) {
            return new ProjectResponse(project.getId(), project.getTitle(), project.getDescription(),
                    project.getCity(), project.getCompletionYear(), project.getCategory(),
                    project.isPublished(), imageIds);
        }
    }

    /** The complete new order: every id exactly once. */
    public record OrderRequest(@NotEmpty List<@NotNull Long> ids) {
    }
}
