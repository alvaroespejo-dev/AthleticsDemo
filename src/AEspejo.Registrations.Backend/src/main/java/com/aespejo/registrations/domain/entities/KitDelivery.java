package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Record of a kit pickup. It feeds the live dashboard used on the day of delivery. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "KitDeliveries")
public class KitDelivery implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    private Registration registration;

    private OffsetDateTime deliveredAt;

    @ManyToOne
    private User user;

    private String pickupPoint;

    /** Name of the person who picked up the kit, when it is not the athlete. */
    private String pickedUpBy;

    private String notes;
}
