package com.argusconstructores.api.project;

import java.util.Arrays;
import java.util.Optional;

/**
 * The accepted image formats, recognised from the file's first bytes. The client's
 * Content-Type is never trusted: it is whatever the uploader says it is.
 */
enum ImageType {

    JPEG("image/jpeg"),
    PNG("image/png"),
    WEBP("image/webp");

    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] RIFF = {'R', 'I', 'F', 'F'};
    private static final byte[] WEBP_TAG = {'W', 'E', 'B', 'P'};

    private final String contentType;

    ImageType(String contentType) {
        this.contentType = contentType;
    }

    String contentType() {
        return contentType;
    }

    static Optional<ImageType> detect(byte[] data) {
        if (startsWith(data, 0, JPEG_SIGNATURE)) return Optional.of(JPEG);
        if (startsWith(data, 0, PNG_SIGNATURE)) return Optional.of(PNG);
        // RIFF container: "RIFF", 4-byte size, then "WEBP".
        if (startsWith(data, 0, RIFF) && startsWith(data, 8, WEBP_TAG)) return Optional.of(WEBP);
        return Optional.empty();
    }

    private static boolean startsWith(byte[] data, int offset, byte[] prefix) {
        return data.length >= offset + prefix.length
                && Arrays.equals(data, offset, offset + prefix.length, prefix, 0, prefix.length);
    }
}
