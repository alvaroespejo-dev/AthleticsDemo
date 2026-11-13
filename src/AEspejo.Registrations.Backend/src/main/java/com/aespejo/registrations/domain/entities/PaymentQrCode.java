package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payment QR code for one specific combination of price tier and kit. Bank QR codes embed the
 * amount, so a single QR per event cannot serve two different prices.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "PaymentQrCodes")
public class PaymentQrCode implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private PriceTier priceTier;

    @ManyToOne
    private Kit kit;

    private String imagePath;
}
