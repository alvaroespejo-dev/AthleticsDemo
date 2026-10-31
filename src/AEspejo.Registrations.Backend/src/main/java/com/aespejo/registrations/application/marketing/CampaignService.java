package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.application.marketing.AudienceModels.Filter;
import com.aespejo.registrations.application.marketing.CampaignModels.CampaignDetail;
import com.aespejo.registrations.application.marketing.CampaignModels.CampaignSummary;
import com.aespejo.registrations.application.marketing.CampaignModels.Progress;
import com.aespejo.registrations.application.marketing.CampaignModels.RecipientView;
import com.aespejo.registrations.application.marketing.CampaignModels.SaveCampaignRequest;
import com.aespejo.registrations.application.marketing.MessageTemplateRenderer.Context;
import com.aespejo.registrations.common.PageMapper;
import com.aespejo.registrations.common.PageResponse;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.entities.Brand;
import com.aespejo.registrations.domain.entities.Campaign;
import com.aespejo.registrations.domain.entities.CampaignMessage;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.enums.CampaignStatus;
import com.aespejo.registrations.domain.enums.MessageStatus;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.BrandRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.CampaignMessageRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.CampaignRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.EventRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.UserRepository;
import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates and controls WhatsApp campaigns. Nothing is sent here: recipients are
 * built and the state moves, and the background dispatcher does the rest. This way "Send" answers at once even when the
 * audience has thousands of people.
 */
@Service
@Transactional
public class CampaignService {

    private final CampaignRepository campaigns;
    private final CampaignMessageRepository messages;
    private final BrandRepository brands;
    private final EventRepository events;
    private final AthleteRepository athletes;
    private final UserRepository users;
    private final AudienceService audience;
    private final String fixedBrandCode;
    private final ObjectMapper json;

    public CampaignService(CampaignRepository campaigns, CampaignMessageRepository messages, BrandRepository brands,
                           EventRepository events, AthleteRepository athletes, UserRepository users,
                           AudienceService audience, ObjectMapper json,
                           @Value("${brand.fixed-code:}") String fixedBrandCode) {
        this.fixedBrandCode = fixedBrandCode;
        this.campaigns = campaigns;
        this.messages = messages;
        this.brands = brands;
        this.events = events;
        this.athletes = athletes;
        this.users = users;
        this.audience = audience;
        this.json = json;
    }

    @Transactional(readOnly = true)
    /**
     * Lists campaigns. Unlike events, this list never took a brand parameter: it shows both brands, and is narrowed only
     * when the deployment is fixed to one brand ({@code brand.fixed-code}).
     */
    public PageResponse<CampaignSummary> list(int page, int size) {
        var request = PageMapper.request(page, size);
        Page<Campaign> result = fixedBrandCode == null || fixedBrandCode.isBlank()
                ? campaigns.findAllByOrderByCreatedAtDesc(request)
                : campaigns.findByBrandCodeOrderByCreatedAtDesc(fixedBrandCode, request);
        return PageMapper.of(result.map(this::summary));
    }

    @Transactional(readOnly = true)
    public CampaignDetail get(int id) {
        return detail(find(id));
    }

    /** The recipients of a campaign, failed ones first, optionally filtered by status. */
    @Transactional(readOnly = true)
    public PageResponse<RecipientView> recipients(int id, MessageStatus status, int page, int size) {
        find(id);
        var request = PageMapper.request(page, size);

        Page<CampaignMessage> result = status == null
                ? messages.findByCampaignFailedFirst(id, MessageStatus.Failed, request)
                : messages.findByCampaignIdAndStatusOrderByIdAsc(id, status, request);

        return PageMapper.of(result.map(this::recipient));
    }

    /** Creates the campaign as a draft and builds its recipients. It sends nothing. */
    public CampaignDetail create(SaveCampaignRequest request, int userId) {
        MessageTemplateRenderer.validate(request.body());

        if (notBlank(request.header())) {
            MessageTemplateRenderer.validate(request.header());
        }

        if (request.brandId() == null || request.brandId() < 1) {
            throw new BusinessRuleException("campaign.brand.required");
        }

        Brand brand = brands.findById(request.brandId())
                .filter(Brand::isActive)
                .orElseThrow(() -> new BusinessRuleException("campaign.brand.invalid"));

        Event event = null;

        if (request.eventId() != null) {
            event = events.findById(request.eventId())
                    .orElseThrow(() -> new NotFoundException("entity.event", request.eventId()));

            // Promoting an event of one brand from the other brand's number is almost always an operator slip, and the
            // recipient would get a message that leads nowhere.
            if (event.getBrand() == null || !event.getBrand().getId().equals(brand.getId())) {
                throw new BusinessRuleException("campaign.event.otherBrand");
            }
        }

        Campaign campaign = new Campaign();
        campaign.setName(request.name().trim());
        campaign.setBody(request.body().trim());
        campaign.setTemplateName(blankToNull(request.templateName()));
        campaign.setTemplateLanguage(blankToNull(request.templateLanguage()));
        campaign.setHeader(blankToNull(request.header()));
        campaign.setHeaderMediaUrl(blankToNull(request.headerMediaUrl()));
        campaign.setFilterJson(audience.serialize(request.filter()));
        campaign.setBrand(brand);
        campaign.setEvent(event);
        campaign.setStatus(CampaignStatus.Draft);
        campaign.setCreatedAt(OffsetDateTime.now());
        campaign.setCreatedByUser(users.findById(userId).orElse(null));
        campaigns.save(campaign);

        materialize(campaign.getId());

        return detail(campaign);
    }

    /**
     * Resolves the audience of a draft or scheduled campaign and creates one message per recipient, with the phone
     * number and the text already frozen. Pending messages are rebuilt; sent ones are never touched, so retrying can
     * never send the same ad twice to the same person.
     */
    public int materialize(int campaignId) {
        Campaign campaign = find(campaignId);

        if (campaign.getStatus() != CampaignStatus.Draft && campaign.getStatus() != CampaignStatus.Scheduled) {
            throw new ConflictException("campaign.rebuild.status");
        }

        Filter filter = audience.parse(campaign.getFilterJson());
        List<Athlete> recipients = audience.resolve(filter);
        Event event = campaign.getEvent();

        messages.deleteAll(messages.findByCampaignIdAndStatus(campaignId, MessageStatus.Pending));

        Set<Integer> handled = new HashSet<>(messages.findAthleteIdsWithStatusNot(campaignId, MessageStatus.Pending));
        List<CampaignMessage> created = new ArrayList<>();

        for (Athlete athlete : recipients) {
            if (handled.contains(athlete.getId())) {
                continue;
            }

            Context context = new Context(
                    athlete.getFirstNames(),
                    athlete.getLastNames(),
                    athlete.getCity(),
                    event == null ? null : event.getName(),
                    event == null ? null : event.getEventDate(),
                    event == null ? null : event.getLocation());

            CampaignMessage message = new CampaignMessage();
            message.setCampaign(campaign);
            message.setAthlete(athlete);
            message.setPhone("+" + athlete.getPhoneCountryCode() + athlete.getPhoneNumber());
            message.setRenderedBody(MessageTemplateRenderer.render(campaign.getBody(), context));
            message.setParametersJson(toJson(MessageTemplateRenderer.parameters(campaign.getBody(), context)));

            if (notBlank(campaign.getHeader())) {
                message.setRenderedHeader(MessageTemplateRenderer.render(campaign.getHeader(), context));
                message.setHeaderParametersJson(toJson(MessageTemplateRenderer.parameters(campaign.getHeader(), context)));
            } else {
                message.setHeaderParametersJson(toJson(List.of()));
            }

            message.setHeaderImageUrl(campaign.getHeaderMediaUrl());
            message.setStatus(MessageStatus.Pending);
            created.add(message);
        }

        messages.saveAll(created);
        return created.size();
    }

    /** Queues the campaign. It answers at once; the dispatcher does the calls, one by one, at a controlled pace. */
    public CampaignDetail send(int id) {
        Campaign campaign = find(id);

        if (campaign.getStatus() != CampaignStatus.Draft && campaign.getStatus() != CampaignStatus.Scheduled) {
            throw new ConflictException("campaign.send.status", campaign.getStatus());
        }

        if (messages.countByCampaignIdAndStatus(id, MessageStatus.Pending) == 0) {
            throw new BusinessRuleException("campaign.send.noRecipients");
        }

        if (!notBlank(campaign.getTemplateName())) {
            throw new BusinessRuleException("campaign.send.noTemplate");
        }

        campaign.setStatus(CampaignStatus.Sending);
        return detail(campaign);
    }

    public CampaignDetail cancel(int id) {
        Campaign campaign = find(id);

        if (campaign.getStatus() == CampaignStatus.Sent || campaign.getStatus() == CampaignStatus.Cancelled) {
            throw new ConflictException("campaign.cancel.status", campaign.getStatus());
        }

        // Pending recipients stay pending and are not sent. They are kept on purpose: they record who would have received it.
        campaign.setStatus(CampaignStatus.Cancelled);
        return detail(campaign);
    }

    /** Excludes the athlete from every future campaign. It is the mandatory counterpart of sending marketing. */
    public void optOut(int athleteId) {
        Athlete athlete = athletes.findById(athleteId)
                .orElseThrow(() -> new NotFoundException("entity.athlete", athleteId));

        if (athlete.getUnsubscribedAt() != null) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        athlete.setUnsubscribedAt(now);
        athlete.setUpdatedAt(now);
    }

    private Campaign find(int id) {
        return campaigns.findById(id).orElseThrow(() -> new NotFoundException("entity.campaign", id));
    }

    private CampaignSummary summary(Campaign c) {
        return new CampaignSummary(
                c.getId(),
                c.getName(),
                c.getStatus(),
                c.getBrand().getName(),
                c.getEvent() == null ? null : c.getEvent().getName(),
                c.getTemplateName(),
                c.getProvider(),
                c.getCreatedAt(),
                c.getSentAt(),
                creatorName(c),
                progress(c.getId()));
    }

    private CampaignDetail detail(Campaign c) {
        return new CampaignDetail(
                c.getId(),
                c.getName(),
                c.getStatus(),
                c.getBrand().getId(),
                c.getBrand().getName(),
                c.getBody(),
                c.getTemplateName(),
                c.getTemplateLanguage(),
                c.getHeader(),
                c.getEvent() == null ? null : c.getEvent().getId(),
                c.getEvent() == null ? null : c.getEvent().getName(),
                audience.parse(c.getFilterJson()),
                c.getProvider(),
                c.getCreatedAt(),
                c.getScheduledAt(),
                c.getSentAt(),
                creatorName(c),
                progress(c.getId()));
    }

    private RecipientView recipient(CampaignMessage m) {
        return new RecipientView(
                m.getId(),
                m.getAthlete().getId(),
                m.getAthlete().getFirstNames() + " " + m.getAthlete().getLastNames(),
                m.getPhone(),
                m.getStatus(),
                m.getRenderedBody(),
                m.getExternalId(),
                m.getAttempts(),
                m.getLastError(),
                m.getSentAt());
    }

    /** The progress counters, computed from the messages of the campaign. */
    private Progress progress(int campaignId) {
        return new Progress(
                (int) messages.countByCampaignId(campaignId),
                (int) messages.countByCampaignIdAndStatus(campaignId, MessageStatus.Pending),
                (int) messages.countByCampaignIdAndStatus(campaignId, MessageStatus.Sent),
                (int) messages.countByCampaignIdAndStatus(campaignId, MessageStatus.Delivered),
                (int) messages.countByCampaignIdAndStatus(campaignId, MessageStatus.Read),
                (int) messages.countByCampaignIdAndStatus(campaignId, MessageStatus.Failed));
    }

    private static String creatorName(Campaign c) {
        return c.getCreatedByUser() == null ? "" : c.getCreatedByUser().getName();
    }

    private String toJson(List<String> values) {
        try {
            return json.writeValueAsString(values);
        } catch (JacksonException ex) {
            throw new IllegalStateException("The message parameters could not be serialized.", ex);
        }
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static String blankToNull(String value) {
        return notBlank(value) ? value.trim() : null;
    }
}
