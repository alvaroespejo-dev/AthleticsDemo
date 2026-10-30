package com.aespejo.registrations.application.media;

import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.common.files.Uploads;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.entities.Kit;
import com.aespejo.registrations.domain.entities.PaymentQrCode;
import com.aespejo.registrations.domain.entities.PriceTier;
import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.entities.SystemSettings;
import com.aespejo.registrations.infrastructure.files.FileStore;
import com.aespejo.registrations.infrastructure.files.ImageResizer;
import com.aespejo.registrations.infrastructure.persistence.repository.EventRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.KitRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.PaymentQrCodeRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.PriceTierRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.SettingsRepository;
import java.nio.file.Path;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

/**
 * Uploaded files: event cover, runner manual, kit photo, payment QR codes, the generic QR and payment receipts. Ported
 * from the {@code ServicioImagenEvento}, {@code ServicioManualCorredor}, {@code ServicioImagenKit},
 * {@code ServicioQrCobro} and {@code ServicioComprobantePago} services of the C# reference.
 *
 * The new file is saved and referenced before the previous one is deleted, so a failure in the middle never leaves the
 * owner without a file.
 */
@Service
@Transactional
public class MediaService {

    /** A file ready to be sent: its bytes, content type and the name to offer when downloaded. */
    public record FileContent(byte[] bytes, String contentType, String fileName) {
    }

    private final EventRepository events;
    private final KitRepository kits;
    private final PriceTierRepository priceTiers;
    private final PaymentQrCodeRepository qrCodes;
    private final RegistrationRepository registrations;
    private final SettingsRepository settings;
    private final FileStore files;
    private final ImageResizer resizer;

    public MediaService(EventRepository events, KitRepository kits, PriceTierRepository priceTiers,
                        PaymentQrCodeRepository qrCodes, RegistrationRepository registrations,
                        SettingsRepository settings, FileStore files, ImageResizer resizer) {
        this.events = events;
        this.kits = kits;
        this.priceTiers = priceTiers;
        this.qrCodes = qrCodes;
        this.registrations = registrations;
        this.settings = settings;
        this.files = files;
        this.resizer = resizer;
    }

    // ---- Event cover ----

    /** Cover image of the event, fitted to a 500x500 square. */
    public void setEventImage(int eventId, byte[] content) {
        Event event = findEvent(eventId);
        checkImage(content);
        String path = files.save("eventos", ".jpg", resizer.fitToSquareJpeg(content));
        replaceFile(event.getImagePath(), path);
        event.setImagePath(path);
    }

    public void clearEventImage(int eventId) {
        Event event = findEvent(eventId);
        clear(event.getImagePath());
        event.setImagePath(null);
    }

    public FileContent eventImage(String slug) {
        Event event = findEventBySlug(slug);
        return load(event.getImagePath(), "media.image", "evento-" + slug + ".jpg");
    }

    // ---- Runner manual ----

    public void setRunnerManual(int eventId, byte[] content, String originalName) {
        Event event = findEvent(eventId);
        if (content.length == 0) throw new BusinessRuleException("upload.empty");
        if (content.length > Uploads.DOCUMENT_MAX_BYTES) {
            throw new BusinessRuleException("upload.tooLarge", Uploads.DOCUMENT_MAX_BYTES / (1024 * 1024));
        }
        Uploads.Format format = Uploads.detectDocument(content)
                .orElseThrow(() -> new BusinessRuleException("upload.document.invalid"));
        String path = files.save("manuales-corredor", format.extension(), content);
        replaceFile(event.getRunnerManualPath(), path);
        event.setRunnerManualPath(path);
        event.setRunnerManualName(displayName(originalName, format.extension()));
    }

    public void clearRunnerManual(int eventId) {
        Event event = findEvent(eventId);
        clear(event.getRunnerManualPath());
        event.setRunnerManualPath(null);
        event.setRunnerManualName(null);
    }

    public FileContent runnerManual(String slug) {
        Event event = findEventBySlug(slug);
        String name = event.getRunnerManualName() != null ? event.getRunnerManualName()
                : "manual-corredor-" + slug + extensionOf(event.getRunnerManualPath() == null ? ".pdf" : event.getRunnerManualPath());
        return load(event.getRunnerManualPath(), "media.runnerManual", name);
    }

    // ---- Kit photo ----

    public void setKitImage(int kitId, byte[] content) {
        Kit kit = findKit(kitId);
        checkImage(content);
        String path = files.save("kits", ".jpg", resizer.fitToSquareJpeg(content));
        replaceFile(kit.getImagePath(), path);
        kit.setImagePath(path);
    }

    public void clearKitImage(int kitId) {
        Kit kit = findKit(kitId);
        clear(kit.getImagePath());
        kit.setImagePath(null);
    }

    public FileContent kitImage(int kitId) {
        return load(findKit(kitId).getImagePath(), "media.image", "kit-" + kitId + ".jpg");
    }

    // ---- Payment QR per price tier and kit ----

    /** Stores the QR of one combination of price tier and kit. Both must belong to the same modality. */
    public void setTierQr(int tierId, int kitId, byte[] content) {
        PriceTier tier = findTier(tierId);
        Kit kit = findKit(kitId);
        if (tier.getModality().getId() != kit.getModality().getId()) {
            throw new BusinessRuleException("upload.tierKit.mismatch");
        }
        checkImage(content);
        Uploads.Format format = Uploads.detectImage(content).orElseThrow();
        String path = files.save("qr", format.extension(), content);
        Optional<PaymentQrCode> existing = qrCodes.findByPriceTierIdAndKitId(tierId, kitId);
        if (existing.isPresent()) {
            replaceFile(existing.get().getImagePath(), path);
            existing.get().setImagePath(path);
        } else {
            PaymentQrCode qr = new PaymentQrCode();
            qr.setPriceTier(tier);
            qr.setKit(kit);
            qr.setImagePath(path);
            qrCodes.save(qr);
        }
    }

    public void clearTierQr(int tierId, int kitId) {
        qrCodes.findByPriceTierIdAndKitId(tierId, kitId).ifPresent(qr -> {
            clear(qr.getImagePath());
            qrCodes.delete(qr);
        });
    }

    public FileContent tierQr(int tierId, int kitId) {
        String path = qrCodes.findByPriceTierIdAndKitId(tierId, kitId).map(PaymentQrCode::getImagePath).orElse(null);
        return load(path, "media.qr", "qr-" + tierId + "-" + kitId + ".png");
    }

    // ---- Generic QR (open amount, used when money sport credit is applied) ----

    public void setGenericQr(byte[] content) {
        checkImage(content);
        Uploads.Format format = Uploads.detectImage(content).orElseThrow();
        SystemSettings row = settingsRow();
        String path = files.save("qr", format.extension(), content);
        replaceFile(row.getGenericQrPath(), path);
        row.setGenericQrPath(path);
    }

    public void clearGenericQr() {
        SystemSettings row = settingsRow();
        clear(row.getGenericQrPath());
        row.setGenericQrPath(null);
    }

    public FileContent genericQr() {
        return load(settingsRow().getGenericQrPath(), "media.genericQr", "qr-generico.png");
    }

    /** The QR an athlete pays with: the generic one when money sport credit applies, otherwise the tier and kit one. */
    public FileContent registrationQr(String code, boolean download) {
        Registration registration = registrations.findByCode(code)
                .orElseThrow(() -> new NotFoundException("entity.registration", code));
        String path;
        if (registration.getMoneySportDiscountCents() > 0) {
            path = settingsRow().getGenericQrPath();
        } else if (registration.getPriceTier() == null) {
            path = null;
        } else {
            path = qrCodes.findByPriceTierIdAndKitId(registration.getPriceTier().getId(), registration.getKit().getId())
                    .map(PaymentQrCode::getImagePath).orElse(null);
        }
        return load(path, "media.qr", "qr-pago-" + code + ".png");
    }

    // ---- Payment receipt ----

    /** Receipt uploaded by the athlete from the confirmation screen: an image or a PDF. */
    public void setReceipt(String code, byte[] content) {
        Registration registration = registrations.findByCode(code)
                .orElseThrow(() -> new NotFoundException("entity.registration", code));
        if (content.length == 0) throw new BusinessRuleException("upload.empty");
        if (content.length > Uploads.RECEIPT_MAX_BYTES) {
            throw new BusinessRuleException("upload.tooLarge", Uploads.RECEIPT_MAX_BYTES / (1024 * 1024));
        }
        Uploads.Format format = Uploads.detectReceipt(content)
                .orElseThrow(() -> new BusinessRuleException("upload.receipt.invalid"));
        String path = files.save("comprobantes-pago", format.extension(), content);
        replaceFile(registration.getReceiptPath(), path);
        registration.setReceiptPath(path);
    }

    public FileContent receipt(int registrationId) {
        Registration registration = registrations.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("entity.registration", registrationId));
        return load(registration.getReceiptPath(), "media.receipt", "comprobante"
                + (registration.getReceiptPath() == null ? "" : extensionOf(registration.getReceiptPath())));
    }

    // ---- helpers ----

    private void checkImage(byte[] content) {
        if (content.length == 0) throw new BusinessRuleException("upload.empty");
        if (content.length > Uploads.IMAGE_MAX_BYTES) {
            throw new BusinessRuleException("upload.tooLarge", Uploads.IMAGE_MAX_BYTES / (1024 * 1024));
        }
        if (Uploads.detectImage(content).isEmpty()) {
            throw new BusinessRuleException("upload.image.invalid");
        }
    }

    /** Deletes the previous file only after the new one is saved and referenced. */
    private void replaceFile(String previous, String next) {
        if (previous != null && !previous.isBlank() && !previous.equals(next)) {
            files.delete(previous);
        }
    }

    private void clear(String path) {
        if (path != null && !path.isBlank()) {
            files.delete(path);
        }
    }

    private FileContent load(String path, String entityKey, String fileName) {
        if (path == null || path.isBlank()) {
            throw new NotFoundException(entityKey, fileName);
        }
        byte[] bytes = files.read(path).orElseThrow(() -> new NotFoundException(entityKey, fileName));
        return new FileContent(bytes, Uploads.contentTypeOf(extensionOf(path)), fileName);
    }

    private SystemSettings settingsRow() {
        return settings.findById(1).orElseGet(() -> {
            SystemSettings created = new SystemSettings();
            return settings.save(created);
        });
    }

    private Event findEvent(int id) {
        return events.findById(id).orElseThrow(() -> new NotFoundException("entity.event", id));
    }

    private Event findEventBySlug(String slug) {
        return events.findBySlug(slug).orElseThrow(() -> new NotFoundException("entity.event", slug));
    }

    private Kit findKit(int id) {
        return kits.findById(id).orElseThrow(() -> new NotFoundException("entity.kit", id));
    }

    private PriceTier findTier(int id) {
        return priceTiers.findById(id).orElseThrow(() -> new NotFoundException("entity.priceTier", id));
    }

    private static String extensionOf(String path) {
        String name = Path.of(path).getFileName().toString();
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot);
    }

    /** The name shown to people: the original name without its extension, at most 150 characters, plus the real extension. */
    static String displayName(String original, String extension) {
        String stem = original == null ? "" : original.trim();
        int dot = stem.lastIndexOf('.');
        if (dot > 0) stem = stem.substring(0, dot);
        if (stem.isBlank()) stem = "manual-corredor";
        if (stem.length() > 150) stem = stem.substring(0, 150);
        return stem + extension;
    }
}
