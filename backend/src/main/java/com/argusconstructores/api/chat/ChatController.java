package com.argusconstructores.api.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Anonymous chat assistant for the presentation. The client keeps the conversation and sends
 * it whole each time, so nothing is stored here.
 */
@RestController
@RequestMapping("/chat")
@ConditionalOnBooleanProperty("chat.enabled")
public class ChatController {

    private final ChatService chatService;
    private final ChatThrottle chatThrottle;

    public ChatController(ChatService chatService, ChatThrottle chatThrottle) {
        this.chatService = chatService;
        this.chatThrottle = chatThrottle;
    }

    @PostMapping
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        List<ChatTurn> turns = request.messages();
        // Claude needs the conversation to start and end with the visitor.
        if (turns.getFirst().role() != ChatRole.USER || turns.getLast().role() != ChatRole.USER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The conversation must start and end with a USER message");
        }
        chatThrottle.acquire();
        return new ChatResponse(chatService.answer(turns));
    }

    public enum ChatRole { USER, ASSISTANT }

    public record ChatTurn(@NotNull ChatRole role, @NotBlank @Size(max = 2000) String content) {
    }

    /** At most 20 turns: bounds what one anonymous request can cost. */
    public record ChatRequest(@NotEmpty @Size(max = 20) List<@Valid @NotNull ChatTurn> messages) {
    }

    public record ChatResponse(String answer) {
    }
}
