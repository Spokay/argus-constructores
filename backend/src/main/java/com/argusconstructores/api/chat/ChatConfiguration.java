package com.argusconstructores.api.chat;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnBooleanProperty("chat.enabled")
class ChatConfiguration {

    /** A visitor waits on the answer: fail after a minute instead of the SDK's ten. */
    @Bean
    AnthropicClient anthropicClient(@Value("${chat.anthropic-api-key}") String apiKey) {
        if (apiKey.isBlank()) {
            throw new IllegalStateException("ANTHROPIC_API_KEY is required when CHAT_ENABLED=true");
        }
        return AnthropicOkHttpClient.builder()
                .apiKey(apiKey)
                .timeout(Duration.ofSeconds(60))
                .maxRetries(1)
                .build();
    }
}
