package com.argusconstructores.api.chat;

import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.TextBlock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.argusconstructores.api.TestcontainersConfiguration;
import com.argusconstructores.api.project.Project;
import com.argusconstructores.api.project.ProjectRepository;
import com.argusconstructores.api.project.ProjectStatus;
import com.argusconstructores.api.project.Sector;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ChatService chatService;

    @Autowired
    private ProjectRepository projectRepository;

    @MockitoBean(answers = Answers.RETURNS_DEEP_STUBS)
    private AnthropicClient claude;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();
        TextBlock text = mock(TextBlock.class);
        when(text.text()).thenReturn("Hola, soy Jaime.");
        ContentBlock block = mock(ContentBlock.class);
        when(block.text()).thenReturn(Optional.of(text));
        Message message = mock(Message.class);
        when(message.content()).thenReturn(List.of(block));
        when(message.stopReason()).thenReturn(Optional.empty());
        when(claude.messages().create(any(MessageCreateParams.class))).thenReturn(message);
    }

    @Test
    void answersAnonymously() throws Exception {
        mockMvc.perform(chat("""
                        [{"role": "USER", "content": "¿Quiénes son?"}]"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Hola, soy Jaime."));
    }

    @Test
    void rejectsAConversationThatDoesNotEndWithTheVisitor() throws Exception {
        mockMvc.perform(chat("""
                        [{"role": "USER", "content": "Hola"}, {"role": "ASSISTANT", "content": "Hola"}]"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsAnEmptyConversationOrABlankMessage() throws Exception {
        mockMvc.perform(chat("[]")).andExpect(status().isBadRequest());
        mockMvc.perform(chat("""
                        [{"role": "USER", "content": " "}]""")).andExpect(status().isBadRequest());
    }

    @Test
    void thePromptHoldsTheKnowledgeBaseAndOnlyPublishedProjects() {
        projectRepository.save(project("Hospital de Usme", true, 0));
        projectRepository.save(project("Proyecto secreto", false, 1));

        String prompt = chatService.systemPrompt();

        assertThat(prompt).contains("argus.licitaciones@gmail.com", "Hospital de Usme", "n/d SMMLV");
        assertThat(prompt).doesNotContain("Proyecto secreto");
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder chat(String messages) {
        return post("/chat").contentType(MediaType.APPLICATION_JSON).content("{\"messages\": " + messages + "}");
    }

    private static Project project(String name, boolean published, int position) {
        Project project = new Project(position);
        project.setName(name);
        project.setPurpose("Construcción");
        project.setClient("Secretaría de Salud");
        project.setCity("Bogotá - Cundinamarca");
        project.setSector(Sector.values()[0]);
        project.setStatus(ProjectStatus.COMPLETED);
        project.setPublished(published);
        return project;
    }
}
