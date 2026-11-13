package com.aespejo.registrations.api.marketing;

import com.aespejo.registrations.application.athlete.AthleteModels.AthleteRow;
import com.aespejo.registrations.application.marketing.AudienceModels.Estimate;
import com.aespejo.registrations.application.marketing.AudienceModels.Filter;
import com.aespejo.registrations.application.marketing.AudienceModels.PreviewRequest;
import com.aespejo.registrations.application.marketing.AudienceService;
import com.aespejo.registrations.application.marketing.CampaignModels.CampaignDetail;
import com.aespejo.registrations.application.marketing.CampaignModels.CampaignSummary;
import com.aespejo.registrations.application.marketing.CampaignModels.RecipientView;
import com.aespejo.registrations.application.marketing.CampaignModels.SaveCampaignRequest;
import com.aespejo.registrations.application.marketing.CampaignService;
import com.aespejo.registrations.application.marketing.SegmentService;
import com.aespejo.registrations.application.marketing.SegmentService.SaveSegmentRequest;
import com.aespejo.registrations.application.marketing.SegmentService.SegmentView;
import com.aespejo.registrations.application.marketing.WhatsAppTemplateCatalog;
import com.aespejo.registrations.application.marketing.WhatsAppTemplateCatalog.Template;
import com.aespejo.registrations.common.PageResponse;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.domain.enums.MessageStatus;
import com.aespejo.registrations.infrastructure.security.Policies;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Audience, saved segments and WhatsApp campaigns. Marketing is for administrators only, as: a
 * campaign goes out in the name of the organization and uses the messaging quota of the Meta account.
 */
@RestController
@RequestMapping("/api/marketing")
@PreAuthorize(Policies.ADMIN)
public class MarketingController {

    private final AudienceService audience;
    private final SegmentService segments;
    private final CampaignService campaigns;
    private final WhatsAppTemplateCatalog templates;

    public MarketingController(AudienceService audience, SegmentService segments, CampaignService campaigns,
                               WhatsAppTemplateCatalog templates) {
        this.audience = audience;
        this.segments = segments;
        this.campaigns = campaigns;
        this.templates = templates;
    }

    /**
     * The approved templates of the brand's WhatsApp Business account. Only these can be sent, so the campaign form
     * offers them instead of a free-text name. Every brand has its own account and its own catalog.
     */
    @GetMapping("/whatsapp-templates")
    public List<Template> whatsAppTemplates(@RequestParam String brand,
                                            @RequestParam(defaultValue = "false") boolean refresh) {
        if (brand == null || brand.isBlank()) {
            throw new BusinessRuleException("whatsapp.templates.brandRequired");
        }

        return templates.listApproved(brand, refresh);
    }

    @GetMapping("/campaigns")
    public PageResponse<CampaignSummary> campaigns(@RequestParam(defaultValue = "1") int page,
                                                   @RequestParam(defaultValue = "25") int size) {
        return campaigns.list(page, size);
    }

    @GetMapping("/campaigns/{id}")
    public CampaignDetail campaign(@PathVariable int id) {
        return campaigns.get(id);
    }

    /** The recipients of a campaign with their delivery status and last error. */
    @GetMapping("/campaigns/{id}/messages")
    public PageResponse<RecipientView> campaignRecipients(@PathVariable int id,
                                                          @RequestParam(required = false) MessageStatus status,
                                                          @RequestParam(defaultValue = "1") int page,
                                                          @RequestParam(defaultValue = "25") int size) {
        return campaigns.recipients(id, status, page, size);
    }

    /** Creates the campaign as a draft and builds its recipients. Nothing is sent. */
    @PostMapping("/campaigns")
    @ResponseStatus(HttpStatus.CREATED)
    public CampaignDetail createCampaign(@AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody SaveCampaignRequest request) {
        return campaigns.create(request, Integer.parseInt(jwt.getSubject()));
    }

    /** Recalculates the audience of a draft whose recipients changed. */
    @PostMapping("/campaigns/{id}/rebuild")
    public CampaignDetail rebuildCampaign(@PathVariable int id) {
        campaigns.materialize(id);
        return campaigns.get(id);
    }

    /** Queues the campaign. It answers at once: the background dispatcher makes the calls. */
    @PostMapping("/campaigns/{id}/send")
    public CampaignDetail sendCampaign(@PathVariable int id) {
        return campaigns.send(id);
    }

    @PostMapping("/campaigns/{id}/cancel")
    public CampaignDetail cancelCampaign(@PathVariable int id) {
        return campaigns.cancel(id);
    }

    /** Excludes the athlete from every future campaign. The mandatory counterpart of sending marketing. */
    @PostMapping("/athletes/{id}/opt-out")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void optOut(@PathVariable int id) {
        campaigns.optOut(id);
    }


    @PostMapping("/audience/estimate")
    public Estimate estimate(@RequestBody Filter filter) {
        return audience.estimate(filter);
    }

    @PostMapping("/audience/preview")
    public PageResponse<AthleteRow> preview(@RequestBody PreviewRequest request) {
        int page = request.page() == null ? 1 : request.page();
        int size = request.size() == null ? 25 : request.size();
        return audience.preview(request.filter(), page, size);
    }

    @GetMapping("/segments")
    public List<SegmentView> segments() {
        return segments.list();
    }

    @GetMapping("/segments/{id}")
    public SegmentView segment(@PathVariable int id) {
        return segments.get(id);
    }

    @PostMapping("/segments")
    @ResponseStatus(HttpStatus.CREATED)
    public SegmentView createSegment(@AuthenticationPrincipal Jwt jwt, @RequestBody SaveSegmentRequest request) {
        return segments.create(request, Integer.parseInt(jwt.getSubject()));
    }

    @PutMapping("/segments/{id}")
    public SegmentView updateSegment(@PathVariable int id, @RequestBody SaveSegmentRequest request) {
        return segments.update(id, request);
    }

    @DeleteMapping("/segments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSegment(@PathVariable int id) {
        segments.delete(id);
    }
}
