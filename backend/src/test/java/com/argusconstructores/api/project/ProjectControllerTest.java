package com.argusconstructores.api.project;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.argusconstructores.api.TestcontainersConfiguration;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class ProjectControllerTest {

    private static final RequestPostProcessor ADMIN = jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectRepository projectRepository;

    @BeforeEach
    void cleanDatabase() {
        projectRepository.deleteAll();
    }

    @Test
    void adminEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/admin/projects")).andExpect(status().isUnauthorized());
        mockMvc.perform(json(post("/admin/projects"), body("Villa", false))).andExpect(status().isUnauthorized());
    }

    @Test
    void aNewProjectStaysHiddenUntilPublished() throws Exception {
        long id = create("Villa");

        mockMvc.perform(get("/projects")).andExpect(jsonPath("$", empty()));
        mockMvc.perform(get("/projects/" + id)).andExpect(status().isNotFound());

        mockMvc.perform(json(put("/admin/projects/" + id), body("Villa", true)).with(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.published").value(true));

        mockMvc.perform(get("/projects"))
                .andExpect(jsonPath("$[0].name").value("Villa"))
                .andExpect(jsonPath("$[0].sector").value("HOSPITAL"))
                .andExpect(jsonPath("$[0].areaM2").value(19393))
                .andExpect(jsonPath("$[0].valueSmmlv").value(34.854));
        mockMvc.perform(get("/projects/" + id)).andExpect(status().isOk());
    }

    @Test
    void createIgnoresThePublishedFlag() throws Exception {
        mockMvc.perform(json(post("/admin/projects"), body("Villa", true)).with(ADMIN))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.published").value(false));
    }

    /** Jackson 3 rejects a missing primitive, so {@code published} must be optional. */
    @Test
    void publishedMayBeOmitted() throws Exception {
        long id = create("Villa");
        mockMvc.perform(json(put("/admin/projects/" + id), body("Villa", true)).with(ADMIN));

        // Área and Valor are optional too: projects in execution have none yet.
        String withoutPublished = """
                {"name":"Villa 2","purpose":"d","client":"c","city":"Bogotá D.C.",
                 "sector":"HOUSING","status":"IN_PROGRESS"}""";
        mockMvc.perform(json(post("/admin/projects"), withoutPublished).with(ADMIN))
                .andExpect(status().isCreated());
        mockMvc.perform(json(put("/admin/projects/" + id), withoutPublished).with(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.published").value(true));
    }

    @Test
    void anInvalidProjectIsRejected() throws Exception {
        mockMvc.perform(json(post("/admin/projects"),
                        """
                        {"name":" ","purpose":"d","client":"c","city":"Lyon","sector":"HOUSING",
                         "status":"COMPLETED","areaM2":-1}""")
                        .with(ADMIN))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void projectsAreListedInTheChosenOrder() throws Exception {
        long first = create("First");
        long second = create("Second");

        mockMvc.perform(json(put("/admin/projects/order"), "{\"ids\":[%d,%d]}".formatted(second, first)).with(ADMIN))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/admin/projects").with(ADMIN))
                .andExpect(jsonPath("$[*].name", contains("Second", "First")));
    }

    @Test
    void aReorderMustNameEveryProject() throws Exception {
        long first = create("First");
        create("Second");

        mockMvc.perform(json(put("/admin/projects/order"), "{\"ids\":[%d]}".formatted(first)).with(ADMIN))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void imagesAreServedWithTheirDetectedTypeOnlyOncePublished() throws Exception {
        long id = create("Villa");
        long imageId = upload(id, ImageTypeTest.PNG);

        // The type comes from the bytes, not from the client's claim.
        mockMvc.perform(get("/admin/projects/%d/images/%d".formatted(id, imageId)).with(ADMIN))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"));
        mockMvc.perform(get("/projects/%d/images/%d".formatted(id, imageId))).andExpect(status().isNotFound());

        mockMvc.perform(json(put("/admin/projects/" + id), body("Villa", true)).with(ADMIN));

        mockMvc.perform(get("/projects/%d/images/%d".formatted(id, imageId)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(content().bytes(ImageTypeTest.PNG));
        mockMvc.perform(get("/projects/" + id)).andExpect(jsonPath("$.imageIds", contains((int) imageId)));
    }

    @Test
    void aNonImageUploadIsRejected() throws Exception {
        long id = create("Villa");
        var file = new MockMultipartFile("file", "x.png", "image/png", "<svg/>".getBytes());

        mockMvc.perform(multipart("/admin/projects/%d/images".formatted(id)).file(file).with(ADMIN))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void imagesCanBeReorderedAndDeleted() throws Exception {
        long id = create("Villa");
        long first = upload(id, ImageTypeTest.PNG);
        long second = upload(id, ImageTypeTest.JPEG);

        mockMvc.perform(json(put("/admin/projects/%d/images/order".formatted(id)),
                        "{\"ids\":[%d,%d]}".formatted(second, first)).with(ADMIN))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/admin/projects/" + id).with(ADMIN))
                .andExpect(jsonPath("$.imageIds", contains((int) second, (int) first)));

        mockMvc.perform(delete("/admin/projects/%d/images/%d".formatted(id, second)).with(ADMIN))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/admin/projects/" + id).with(ADMIN))
                .andExpect(jsonPath("$.imageIds", contains((int) first)));
    }

    @Test
    void deletingAProjectDeletesItsImages() throws Exception {
        long id = create("Villa");
        long imageId = upload(id, ImageTypeTest.PNG);

        mockMvc.perform(delete("/admin/projects/" + id).with(ADMIN)).andExpect(status().isNoContent());

        mockMvc.perform(get("/admin/projects/" + id).with(ADMIN)).andExpect(status().isNotFound());
        mockMvc.perform(get("/admin/projects/%d/images/%d".formatted(id, imageId)).with(ADMIN))
                .andExpect(status().isNotFound());
    }

    private long create(String title) throws Exception {
        String response = mockMvc.perform(json(post("/admin/projects"), body(title, false)).with(ADMIN))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private long upload(long projectId, byte[] data) throws Exception {
        var file = new MockMultipartFile("file", "image", "application/octet-stream", data);
        String response = mockMvc.perform(multipart("/admin/projects/%d/images".formatted(projectId)).file(file).with(ADMIN))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private static String body(String name, boolean published) {
        return """
                {"name":"%s","purpose":"Diseño y construcción","client":"Agencia Logística",
                 "areaM2":19393,"valueSmmlv":34.854,"city":"Medellín - Antioquia",
                 "sector":"HOSPITAL","status":"COMPLETED","published":%s}""".formatted(name, published);
    }

    private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String body) {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }
}
