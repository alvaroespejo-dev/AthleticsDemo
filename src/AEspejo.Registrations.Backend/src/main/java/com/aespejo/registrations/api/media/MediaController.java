package com.aespejo.registrations.api.media;

import com.aespejo.registrations.application.media.MediaService;
import com.aespejo.registrations.application.media.MediaService.FileContent;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.infrastructure.security.Policies;
import java.io.IOException;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.ResponseStatus;
import java.util.Map;

/**
 * Uploads and downloads of files. Writes are restricted by role as; the reads that appear on public
 * pages (cover, kit photo, QR codes, manual) are anonymous. The upload field is named {@code archivo}, as in the panel.
 */
@RestController
public class MediaController {

    private final MediaService media;

    public MediaController(MediaService media) {
        this.media = media;
    }

    // ---- Event cover ----

    @PostMapping("/api/events/{id}/image")
    @PreAuthorize(Policies.ADMIN)
    public Map<String, String> setEventImage(@PathVariable int id, @RequestParam("archivo") MultipartFile file) {
        media.setEventImage(id, bytes(file));
        return Map.of("path", "api/public/events/" + id + "/image");
    }

    @DeleteMapping("/api/events/{id}/image")
    @PreAuthorize(Policies.ADMIN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearEventImage(@PathVariable int id) {
        media.clearEventImage(id);
    }

    @GetMapping("/api/public/events/{slug}/image")
    public ResponseEntity<byte[]> eventImage(@PathVariable String slug) {
        return file(media.eventImage(slug), false);
    }

    // ---- Runner manual ----

    @PostMapping("/api/events/{id}/runner-manual")
    @PreAuthorize(Policies.ADMIN)
    public Map<String, String> setRunnerManual(@PathVariable int id, @RequestParam("archivo") MultipartFile file) {
        media.setRunnerManual(id, bytes(file), file.getOriginalFilename());
        return Map.of("path", "api/public/events/" + id + "/runner-manual");
    }

    @DeleteMapping("/api/events/{id}/runner-manual")
    @PreAuthorize(Policies.ADMIN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearRunnerManual(@PathVariable int id) {
        media.clearRunnerManual(id);
    }

    @GetMapping("/api/public/events/{slug}/runner-manual")
    public ResponseEntity<byte[]> runnerManual(@PathVariable String slug,
                                               @RequestParam(defaultValue = "false") boolean download) {
        return file(media.runnerManual(slug), download);
    }

    // ---- Kit photo ----

    @PostMapping("/api/kits/{id}/image")
    @PreAuthorize(Policies.ADMIN)
    public Map<String, String> setKitImage(@PathVariable int id, @RequestParam("archivo") MultipartFile file) {
        media.setKitImage(id, bytes(file));
        return Map.of("path", "api/kits/" + id + "/image");
    }

    @DeleteMapping("/api/kits/{id}/image")
    @PreAuthorize(Policies.ADMIN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearKitImage(@PathVariable int id) {
        media.clearKitImage(id);
    }

    @GetMapping("/api/kits/{id}/image")
    public ResponseEntity<byte[]> kitImage(@PathVariable int id) {
        return file(media.kitImage(id), false);
    }

    // ---- Payment QR per price tier and kit ----

    @PostMapping("/api/price-tiers/{tierId}/kits/{kitId}/qr")
    @PreAuthorize(Policies.ADMIN)
    public Map<String, String> setTierQr(@PathVariable int tierId, @PathVariable int kitId,
                                         @RequestParam("archivo") MultipartFile file) {
        media.setTierQr(tierId, kitId, bytes(file));
        return Map.of("path", "api/price-tiers/" + tierId + "/kits/" + kitId + "/qr");
    }

    @DeleteMapping("/api/price-tiers/{tierId}/kits/{kitId}/qr")
    @PreAuthorize(Policies.ADMIN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearTierQr(@PathVariable int tierId, @PathVariable int kitId) {
        media.clearTierQr(tierId, kitId);
    }

    @GetMapping("/api/price-tiers/{tierId}/kits/{kitId}/qr")
    public ResponseEntity<byte[]> tierQr(@PathVariable int tierId, @PathVariable int kitId) {
        return file(media.tierQr(tierId, kitId), false);
    }

    // ---- Generic QR ----

    @PostMapping("/api/settings/generic-qr")
    @PreAuthorize(Policies.ADMIN)
    public Map<String, String> setGenericQr(@RequestParam("archivo") MultipartFile file) {
        media.setGenericQr(bytes(file));
        return Map.of("path", "api/settings/generic-qr");
    }

    @DeleteMapping("/api/settings/generic-qr")
    @PreAuthorize(Policies.ADMIN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearGenericQr() {
        media.clearGenericQr();
    }

    @GetMapping("/api/settings/generic-qr")
    public ResponseEntity<byte[]> genericQr() {
        return file(media.genericQr(), false);
    }

    // ---- QR an athlete pays with, and receipts ----

    @GetMapping("/api/public/registrations/{code}/qr")
    public ResponseEntity<byte[]> registrationQr(@PathVariable String code,
                                                 @RequestParam(defaultValue = "false") boolean download) {
        return file(media.registrationQr(code, download), download);
    }

    @PostMapping("/api/public/registrations/{code}/receipt")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void uploadReceipt(@PathVariable String code, @RequestParam("archivo") MultipartFile file) {
        media.setReceipt(code, bytes(file));
    }

    @GetMapping("/api/registrations/{id}/receipt")
    @PreAuthorize(Policies.READ)
    public ResponseEntity<byte[]> receipt(@PathVariable int id,
                                          @RequestParam(defaultValue = "false") boolean download) {
        return file(media.receipt(id), download);
    }

    private static byte[] bytes(MultipartFile file) {
        if (file == null) {
            throw new BusinessRuleException("upload.empty");
        }
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessRuleException("upload.empty");
        }
    }

    /** Sends the file inline, or as an attachment when the caller asks to download it. */
    private static ResponseEntity<byte[]> file(FileContent content, boolean download) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(content.contentType()));
        headers.setContentDisposition(download
                ? ContentDisposition.attachment().filename(content.fileName()).build()
                : ContentDisposition.inline().filename(content.fileName()).build());
        return ResponseEntity.ok().headers(headers).body(content.bytes());
    }
}
