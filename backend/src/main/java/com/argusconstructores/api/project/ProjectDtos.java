package com.argusconstructores.api.project;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
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
            @NotBlank @Size(max = 200) String name,
            @NotBlank String purpose,
            @NotBlank @Size(max = 200) String client,
            @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal areaM2,
            @DecimalMin("0") @Digits(integer = 11, fraction = 3) BigDecimal valueSmmlv,
            @NotBlank @Size(max = 100) String city,
            @NotNull Sector sector,
            @NotNull ProjectStatus status,
            Boolean published) {
    }

    /** {@code imageIds} is in display order; the first one is the cover. */
    public record ProjectResponse(
            Long id,
            String name,
            String purpose,
            String client,
            BigDecimal areaM2,
            BigDecimal valueSmmlv,
            String city,
            Sector sector,
            ProjectStatus status,
            boolean published,
            List<Long> imageIds) {

        static ProjectResponse of(Project project, List<Long> imageIds) {
            return new ProjectResponse(project.getId(), project.getName(), project.getPurpose(),
                    project.getClient(), project.getAreaM2(), project.getValueSmmlv(), project.getCity(),
                    project.getSector(), project.getStatus(), project.isPublished(), imageIds);
        }
    }

    /** The complete new order: every id exactly once. */
    public record OrderRequest(@NotEmpty List<@NotNull Long> ids) {
    }
}
