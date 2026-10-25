package com.argusconstructores.api.auth;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.argusconstructores.api.TestcontainersConfiguration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The admin account comes from {@code application-test.properties} via {@link AdminAccountSeeder}. */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginWithTheSeededAdminReturnsAToken() throws Exception {
        mockMvc.perform(login("admin", "admin-password"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.expiresAt").isNotEmpty());
    }

    @Test
    void wrongPasswordIsUnauthorized() throws Exception {
        mockMvc.perform(login("admin", "wrong"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Invalid username or password"));
    }

    @Test
    void unknownUserGetsTheSameAnswerAsAWrongPassword() throws Exception {
        mockMvc.perform(login("nobody", "admin-password"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid username or password"));
    }

    @Test
    void meReturnsTheUserBehindTheIssuedToken() throws Exception {
        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                // Only roles: Spring Security 7 also grants FACTOR_* authorities on login.
                .andExpect(jsonPath("$.roles").value(org.hamcrest.Matchers.contains("ADMIN")));
    }

    @Test
    void aTamperedTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + adminToken() + "x"))
                .andExpect(status().isUnauthorized());
    }

    /** No /admin endpoint exists yet: a 404 proves the request got past authorization. */
    @Test
    void theIssuedTokenCarriesTheAdminRole() throws Exception {
        mockMvc.perform(get("/admin/anything").header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminRoutesAreForbiddenWithoutTheAdminRole() throws Exception {
        mockMvc.perform(get("/admin/anything").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_VISITOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void preflightIsAnsweredWithTheAllowOriginHeader() throws Exception {
        mockMvc.perform(options("/auth/login")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
    }

    private String adminToken() throws Exception {
        String body = mockMvc.perform(login("admin", "admin-password"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    private static org.springframework.test.web.servlet.RequestBuilder login(String username, String password) {
        return post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password));
    }
}
