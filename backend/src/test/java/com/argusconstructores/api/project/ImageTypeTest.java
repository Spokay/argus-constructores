package com.argusconstructores.api.project;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class ImageTypeTest {

    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0};
    static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0};
    static final byte[] WEBP = "RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1);

    @Test
    void recognisesTheAcceptedFormats() {
        assertThat(ImageType.detect(PNG)).contains(ImageType.PNG);
        assertThat(ImageType.detect(JPEG)).contains(ImageType.JPEG);
        assertThat(ImageType.detect(WEBP)).contains(ImageType.WEBP);
    }

    @Test
    void rejectsAnythingElse() {
        assertThat(ImageType.detect("<svg></svg>".getBytes(StandardCharsets.UTF_8))).isEmpty();
        assertThat(ImageType.detect("RIFF\0\0\0\0WAVE".getBytes(StandardCharsets.ISO_8859_1))).isEmpty();
        assertThat(ImageType.detect(new byte[0])).isEmpty();
        assertThat(ImageType.detect(new byte[]{(byte) 0xFF})).isEmpty();
    }
}
