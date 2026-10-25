package com.argusconstructores.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.argusconstructores.api.configuration.logging.RequestIdFilter;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Every failure this server can produce comes back as RFC 9457, including the two that are
 * answered inside the security filter chain and so never reach a controller advice on their
 * own.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class ErrorContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void unauthorizedIsAProblemDetailAndKeepsTheBearerChallenge() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(header().exists("WWW-Authenticate"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.instance").value("/auth/me"))
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    @Test
    void forbiddenIsAProblemDetail() throws Exception {
        mockMvc.perform(get("/admin/anything")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_VISITOR"))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Forbidden"))
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    @Test
    void unknownRouteIsANotFoundProblemDetail() throws Exception {
        mockMvc.perform(get("/nowhere").with(jwt()))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.instance").value("/nowhere"))
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    @Test
    void anInvalidBodyIsABadRequestProblemDetail() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    /**
     * The id a caller supplies is the id it gets back, in the header and in the body, on a
     * request rejected before any controller runs — which is what proves the filter sits
     * ahead of the security chain.
     */
    @Test
    void theCallersRequestIdReachesTheHeaderAndTheBody() throws Exception {
        mockMvc.perform(get("/auth/me").header(RequestIdFilter.REQUEST_ID_HEADER, "client-supplied-id"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(RequestIdFilter.REQUEST_ID_HEADER, "client-supplied-id"))
                .andExpect(jsonPath("$.traceId").value("client-supplied-id"));
    }
}
