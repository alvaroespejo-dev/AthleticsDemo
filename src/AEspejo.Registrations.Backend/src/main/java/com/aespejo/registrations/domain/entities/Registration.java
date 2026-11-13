package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.ParticipationResult;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An athlete's participation in one specific event. It holds the payment status, the reserved seat
 * and the operational data for race day.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Registrations")
public class Registration implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Public code the athlete uses, together with their document number, to sign in to the portal. Separate from the internal id. */
    private String code;

    @ManyToOne
    private Event event;

    @ManyToOne
    private Athlete athlete;

    @ManyToOne
    private Modality modality;

    @ManyToOne
    private Kit kit;

    /** Price tier in effect when the athlete registered. Null only for registrations created before this field existed. */
    @ManyToOne
    private PriceTier priceTier;

    /** Required when the kit includes a shirt. */
    @ManyToOne
    private Size size;

    /** Age category resolved with the age on the event date. */
    @ManyToOne
    private AgeCategory ageCategory;

    /** Race bib number. It is assigned in batches before the event, not at registration time. */
    private Integer bibNumber;

    private RegistrationStatus status = RegistrationStatus.Draft;

    /** Net amount to pay in cents (gross amount minus the Money Sport discount), with the kit surcharge included. */
    private int amountCents;

    /** Discount applied for using the Money Sport virtual wallet. */
    private int moneySportDiscountCents;

    /** Participation result of the athlete at the event, recorded after the event date. */
    private ParticipationResult result;

    /** When the participation result was recorded. */
    private OffsetDateTime resultAt;

    private OffsetDateTime createdAt;

    /** Until when the seat stays reserved if the athlete does not pay. */
    private OffsetDateTime reservationExpiresAt;

    private OffsetDateTime paidAt;

    private boolean waiverAccepted;
    private OffsetDateTime waiverAcceptedAt;
    private String waiverIp;

    /** How the athlete heard about the event. Feeds the acquisition-channel report. */
    private String acquisitionChannel;

    /** Ambassador or referral code. */
    private String referralCode;

    /** Marks complimentary and sponsored seats so they do not distort expected revenue. */
    private boolean isComplimentary;

    private String notes;

    /** Receipt, as an image or PDF, that the athlete uploads on the confirmation screen so the cashier can check it before recording a manual payment. */
    private String receiptPath;

    @OneToMany(mappedBy = "registration")
    private List<Payment> payments = new ArrayList<>();

    @OneToOne(mappedBy = "registration")
    private KitDelivery kitDelivery;

    /** Total amount credited so far, in cents. */
    public long getTotalPaidCents() {
        return payments.stream().mapToLong(Payment::getAmountCents).sum();
    }

    /** A registration occupies a seat while it is pending and not expired, paid, or under review. */
    public boolean occupiesSeat() {
        return status == RegistrationStatus.Pending
                || status == RegistrationStatus.Paid
                || status == RegistrationStatus.UnderReview;
    }
}
