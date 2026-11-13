package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.application.marketing.WhatsAppMedia.Downloaded;
import com.aespejo.registrations.domain.entities.WhatsAppMessage;
import com.aespejo.registrations.infrastructure.files.FileStore;
import com.aespejo.registrations.infrastructure.persistence.repository.WhatsAppMessageRepository;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Downloads the media of inbound WhatsApp messages (photos, audio, documents) and stores it with {@link FileStore}.
 *. It runs apart from the webhook for the same reason as in the
 * A multi-megabyte audio inside the POST Meta expects to confirm in seconds would make Meta time out.
 */
@Service
@Transactional
public class InboxMediaService {

    private static final Logger LOG = LoggerFactory.getLogger(InboxMediaService.class);

    /** Attempts before the file is given up on. Meta deletes media after 30 days, so retrying longer does not help. */
    public static final int MAX_ATTEMPTS = 3;

    private static final String FOLDER = "whatsapp";
    private static final String EXPIRED_MESSAGE = "No se pudo descargar el archivo de Meta (puede que ya haya expirado).";

    private final WhatsAppMessageRepository messages;
    private final WhatsAppMedia media;
    private final FileStore files;

    public InboxMediaService(WhatsAppMessageRepository messages, WhatsAppMedia media, FileStore files) {
        this.messages = messages;
        this.media = media;
        this.files = files;
    }

    /** Processes one batch and returns how many messages were looked at. */
    public int downloadPending() {
        List<WhatsAppMessage> pending = messages
                .findTop10ByMediaMetaIdIsNotNullAndMediaDownloadedFalseAndDownloadAttemptsLessThanOrderByIdAsc(MAX_ATTEMPTS);

        pending.forEach(this::download);
        return pending.size();
    }

    private void download(WhatsAppMessage message) {
        try {
            Optional<Downloaded> downloaded = media.download(
                    message.getConversation().getBrand().getCode(), message.getMediaMetaId());

            if (downloaded.isEmpty()) {
                message.setDownloadAttempts(message.getDownloadAttempts() + 1);

                if (message.getDownloadAttempts() >= MAX_ATTEMPTS) {
                    message.setError(EXPIRED_MESSAGE);
                }

                return;
            }

            byte[] content = downloaded.get().content();
            String path = files.save(FOLDER, extensionOf(downloaded.get().mimeType()), content);

            message.setMediaFilePath(path);
            message.setMediaMimeType(downloaded.get().mimeType());
            message.setMediaSizeBytes(content.length > 0 ? (long) content.length : message.getMediaSizeBytes());
            message.setMediaDownloaded(true);
        } catch (RuntimeException ex) {
            LOG.warn("The download of media {} failed.", message.getMediaMetaId(), ex);
            message.setDownloadAttempts(message.getDownloadAttempts() + 1);
        }
    }

    /** Extension to store the file with, from its MIME type. Anything unknown is stored as ".bin". */
    static String extensionOf(String mimeType) {
        return switch (mimeType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "audio/ogg", "audio/ogg; codecs=opus" -> ".ogg";
            case "audio/mpeg" -> ".mp3";
            case "audio/aac" -> ".aac";
            case "audio/amr" -> ".amr";
            case "video/mp4" -> ".mp4";
            case "video/3gpp" -> ".3gp";
            case "application/pdf" -> ".pdf";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "application/vnd.ms-excel" -> ".xls";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx";
            default -> ".bin";
        };
    }
}
