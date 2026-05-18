package com.mecscable.billing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "door_number", length = 50)
    private String doorNumber;

    @Column(name = "street_name", length = 200)
    private String streetName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "upi_id", length = 100)
    private String upiId;

    @Column(name = "stb_id", length = 100)
    private String stbId;

    @CreationTimestamp
    @Column(name = "account_created_at", nullable = false, updatable = false)
    private OffsetDateTime accountCreatedAt;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private CustomerStatus status = CustomerStatus.ACTIVE;

    @Column(name = "last_payment_amount", precision = 10, scale = 2)
    private BigDecimal lastPaymentAmount;

    @Column(name = "last_payment_date")
    private LocalDate lastPaymentDate;

    @Column(name = "current_payment_amount", precision = 10, scale = 2)
    private BigDecimal currentPaymentAmount;

    @Column(name = "current_payment_date")
    private LocalDate currentPaymentDate;

    @Column(name = "current_payment_due_date")
    private LocalDate currentPaymentDueDate;

    @Column(name = "is_payment_pending", nullable = false)
    private boolean paymentPending = false;

    @Column(name = "current_subscription_start")
    private LocalDate currentSubscriptionStart;

    @Column(name = "current_subscription_end")
    private LocalDate currentSubscriptionEnd;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
