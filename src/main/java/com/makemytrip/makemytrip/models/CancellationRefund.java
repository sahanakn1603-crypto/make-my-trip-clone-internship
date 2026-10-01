package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "cancellation_refund")
public class CancellationRefund {

    @Id
    private String id;

    private String userId;
    private String bookingId;
    private String bookingType;
    private double bookingAmount;
    private double refundPercentage;
    private double refundAmount;
    private String cancellationReason;
    private String status;
    private LocalDateTime cancelledAt;
    private LocalDateTime expectedRefundDate;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public String getBookingType() { return bookingType; }
    public void setBookingType(String bookingType) { this.bookingType = bookingType; }
    public double getBookingAmount() { return bookingAmount; }
    public void setBookingAmount(double bookingAmount) { this.bookingAmount = bookingAmount; }
    public double getRefundPercentage() { return refundPercentage; }
    public void setRefundPercentage(double refundPercentage) { this.refundPercentage = refundPercentage; }
    public double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(double refundAmount) { this.refundAmount = refundAmount; }
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
    public LocalDateTime getExpectedRefundDate() { return expectedRefundDate; }
    public void setExpectedRefundDate(LocalDateTime expectedRefundDate) { this.expectedRefundDate = expectedRefundDate; }
}
