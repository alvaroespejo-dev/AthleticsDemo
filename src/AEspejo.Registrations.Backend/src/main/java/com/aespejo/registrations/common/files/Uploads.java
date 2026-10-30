package com.aespejo.registrations.common.files;

import java.util.Arrays;
import java.util.Optional;

/**
 * Format detection by file signature, never by the declared content type or extension (both are chosen by the uploader).
 * Ported from {@code ValidadorImagen}, {@code ValidadorDocumento} and {@code ValidadorComprobante} in the C# reference.
 */
public final class Uploads {

    public static final int IMAGE_MAX_BYTES = 4 * 1024 * 1024;
    public static final int DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
    public static final int RECEIPT_MAX_BYTES = 8 * 1024 * 1024;

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] RIFF = "RIFF".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
    private static final byte[] WEBP = "WEBP".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
    private static final byte[] PDF = "%PDF".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
    private static final byte[] ZIP = {0x50, 0x4B, 0x03, 0x04};
    private static final byte[] OLE = {(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1};

    private Uploads() {
    }

    /** A detected format: the extension to store the file with and its content type. */
    public record Format(String extension, String contentType) {
    }

    public static Optional<Format> detectImage(byte[] content) {
        if (starts(content, PNG)) return Optional.of(new Format(".png", "image/png"));
        if (starts(content, JPEG)) return Optional.of(new Format(".jpg", "image/jpeg"));
        if (starts(content, RIFF) && content.length >= 12 && Arrays.equals(Arrays.copyOfRange(content, 8, 12), WEBP)) {
            return Optional.of(new Format(".webp", "image/webp"));
        }
        return Optional.empty();
    }

    /** Documents for the runner manual: PDF, Word 97-2003 and Word 2007+. */
    public static Optional<Format> detectDocument(byte[] content) {
        if (starts(content, PDF)) return Optional.of(new Format(".pdf", "application/pdf"));
        if (starts(content, OLE)) return Optional.of(new Format(".doc", "application/msword"));
        if (starts(content, ZIP)) {
            return Optional.of(new Format(".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        }
        return Optional.empty();
    }

    /** Receipts: an image or a PDF (a Word file makes no sense as proof of payment). */
    public static Optional<Format> detectReceipt(byte[] content) {
        Optional<Format> image = detectImage(content);
        if (image.isPresent()) return image;
        return detectDocument(content).filter(f -> f.extension().equals(".pdf"));
    }

    /** Content type of a stored file, from its extension. */
    public static String contentTypeOf(String extension) {
        return switch (extension.toLowerCase(java.util.Locale.ROOT)) {
            case ".png" -> "image/png";
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".webp" -> "image/webp";
            case ".pdf" -> "application/pdf";
            case ".docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case ".doc" -> "application/msword";
            default -> "application/octet-stream";
        };
    }

    private static boolean starts(byte[] content, byte[] signature) {
        return content.length >= signature.length && Arrays.equals(Arrays.copyOf(content, signature.length), signature);
    }
}
