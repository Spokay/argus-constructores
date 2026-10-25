package com.argusconstructores.api.configuration.logging;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    @Test
    void generatesAnIdWhenTheCallerSendsNone() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> seenInsideTheChain = doFilter(new MockHttpServletRequest(), response);

        assertThat(seenInsideTheChain.get()).isNotBlank();
        assertThat(response.getHeader(RequestIdFilter.REQUEST_ID_HEADER)).isEqualTo(seenInsideTheChain.get());
        assertThatCode(() -> UUID.fromString(seenInsideTheChain.get())).doesNotThrowAnyException();
    }

    @Test
    void honoursTheCallersId() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIdFilter.REQUEST_ID_HEADER, "abc-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> seenInsideTheChain = doFilter(request, response);

        assertThat(seenInsideTheChain.get()).isEqualTo("abc-123");
        assertThat(response.getHeader(RequestIdFilter.REQUEST_ID_HEADER)).isEqualTo("abc-123");
    }

    /**
     * The id is echoed into a response header and into log lines, so a value that could
     * inject into either is replaced rather than trusted.
     */
    @Test
    void replacesAnIdThatCouldInjectIntoAHeaderOrALogLine() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIdFilter.REQUEST_ID_HEADER, "evil\nInjected: header");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> seenInsideTheChain = doFilter(request, response);

        assertThat(seenInsideTheChain.get()).doesNotContain("Injected");
        assertThatCode(() -> UUID.fromString(seenInsideTheChain.get())).doesNotThrowAnyException();
    }

    /** The container reuses threads; a leaked key would mislabel the next request. */
    @Test
    void clearsTheMdcAfterTheChainReturns() throws Exception {
        doFilter(new MockHttpServletRequest(), new MockHttpServletResponse());

        assertThat(MDC.get(RequestIdFilter.TRACE_ID_MDC_KEY)).isNull();
    }

    private AtomicReference<String> doFilter(MockHttpServletRequest request,
                                             MockHttpServletResponse response) throws Exception {
        AtomicReference<String> seen = new AtomicReference<>();
        MockFilterChain chain = new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                seen.set(MDC.get(RequestIdFilter.TRACE_ID_MDC_KEY));
            }
        };
        filter.doFilter(request, response, chain);
        return seen;
    }
}
