package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "price_history")
public class PriceHistory {

    @Id
    private String id;

    private String flightId;
    private double basePrice;
    private double dynamicPrice;

    private double demandMultiplier;
    private double peakMultiplier;
    private double holidayMultiplier;

    private LocalDateTime recordedAt;

    public PriceHistory() {
    }

    public PriceHistory(
            String flightId,
            double basePrice,
            double dynamicPrice,
            double demandMultiplier,
            double peakMultiplier,
            double holidayMultiplier,
            LocalDateTime recordedAt
    ) {
        this.flightId = flightId;
        this.basePrice = basePrice;
        this.dynamicPrice = dynamicPrice;
        this.demandMultiplier = demandMultiplier;
        this.peakMultiplier = peakMultiplier;
        this.holidayMultiplier = holidayMultiplier;
        this.recordedAt = recordedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFlightId() {
        return flightId;
    }

    public void setFlightId(String flightId) {
        this.flightId = flightId;
    }

    public double getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(double basePrice) {
        this.basePrice = basePrice;
    }

    public double getDynamicPrice() {
        return dynamicPrice;
    }

    public void setDynamicPrice(double dynamicPrice) {
        this.dynamicPrice = dynamicPrice;
    }

    public double getDemandMultiplier() {
        return demandMultiplier;
    }

    public void setDemandMultiplier(double demandMultiplier) {
        this.demandMultiplier = demandMultiplier;
    }

    public double getPeakMultiplier() {
        return peakMultiplier;
    }

    public void setPeakMultiplier(double peakMultiplier) {
        this.peakMultiplier = peakMultiplier;
    }

    public double getHolidayMultiplier() {
        return holidayMultiplier;
    }

    public void setHolidayMultiplier(double holidayMultiplier) {
        this.holidayMultiplier = holidayMultiplier;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }
}
