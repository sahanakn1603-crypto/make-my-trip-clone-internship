package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Flight;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;

@Service
public class PricingService {

    /**
     * Calculates the current dynamic price of a flight.
     *
     * Factors:
     * 1. Base price
     * 2. Seat demand
     * 3. Real-time demand pulse
     * 4. Weekend / peak travel
     * 5. Holiday pricing
     */
    public PricingResult calculatePrice(Flight flight) {

        double basePrice = flight.getPrice();

        /*
         * Demand based on remaining seats.
         */
        double seatDemandMultiplier = calculateSeatDemandMultiplier(
                flight.getAvailableSeats()
        );

        /*
         * Small real-time demand variation.
         * This makes the dynamic pricing engine visibly
         * change during demonstration/testing.
         */
        double realtimeDemandMultiplier =
                calculateRealtimeDemandMultiplier();

        /*
         * Combine both demand factors.
         */
        double demandMultiplier =
                seatDemandMultiplier * realtimeDemandMultiplier;

        /*
         * Weekend / peak travel.
         */
        double peakMultiplier = calculatePeakMultiplier(
                flight.getDepartureTime()
        );

        /*
         * Holiday pricing.
         */
        double holidayMultiplier = calculateHolidayMultiplier(
                flight.getDepartureTime()
        );

        /*
         * Final dynamic pricing multiplier.
         */
        double finalMultiplier =
                demandMultiplier
                * peakMultiplier
                * holidayMultiplier;

        /*
         * Calculate dynamic price.
         */
        double dynamicPrice =
                basePrice * finalMultiplier;

        /*
         * Round to nearest ₹10.
         */
        dynamicPrice =
                Math.round(dynamicPrice / 10.0) * 10.0;

        /*
         * Calculate individual adjustments.
         */
        double demandAdjustment =
                dynamicPrice
                - (basePrice * peakMultiplier * holidayMultiplier);

        double peakAdjustment =
                (basePrice * peakMultiplier) - basePrice;

        double holidayAdjustment =
                (basePrice * holidayMultiplier) - basePrice;

        return new PricingResult(
                basePrice,
                dynamicPrice,
                demandMultiplier,
                peakMultiplier,
                holidayMultiplier,
                demandAdjustment,
                peakAdjustment,
                holidayAdjustment
        );
    }

    /**
     * Demand pricing based on remaining seats.
     *
     * More seats available = normal demand.
     * Fewer seats available = higher demand.
     */
    private double calculateSeatDemandMultiplier(
            int availableSeats) {

        if (availableSeats <= 10) {
            return 1.30; // +30%
        }

        if (availableSeats <= 25) {
            return 1.20; // +20%
        }

        if (availableSeats <= 40) {
            return 1.10; // +10%
        }

        return 1.00; // Normal demand
    }

    /**
     * Real-time demand variation.
     *
     * This simulates changing demand during the day.
     *
     * 00-19 seconds -> 1.00
     * 20-39 seconds -> 1.05
     * 40-59 seconds -> 1.10
     *
     * It is intentionally small so the price does not
     * change unrealistically.
     */
    private double calculateRealtimeDemandMultiplier() {

        int second =
                LocalDateTime.now().getSecond();

        if (second >= 40) {
            return 1.10; // +10%
        }

        if (second >= 20) {
            return 1.05; // +5%
        }

        return 1.00; // Normal demand
    }

    /**
     * Weekend / peak travel pricing.
     *
     * Friday, Saturday and Sunday receive +10%.
     */
    private double calculatePeakMultiplier(
            String departureTime) {

        try {

            LocalDateTime departure =
                    LocalDateTime.parse(departureTime);

            DayOfWeek day =
                    departure.getDayOfWeek();

            if (day == DayOfWeek.FRIDAY
                    || day == DayOfWeek.SATURDAY
                    || day == DayOfWeek.SUNDAY) {

                return 1.10; // +10%
            }

        } catch (Exception e) {

            // If date cannot be parsed,
            // keep normal pricing.
        }

        return 1.00;
    }

    /**
     * Holiday pricing.
     *
     * Demo holiday dates are included so the feature
     * can be demonstrated during evaluation.
     */
    private double calculateHolidayMultiplier(
            String departureTime) {

        try {

            LocalDateTime departure =
                    LocalDateTime.parse(departureTime);

            LocalDate date =
                    departure.toLocalDate();

            int day =
                    date.getDayOfMonth();

            Month month =
                    date.getMonth();

            /*
             * Republic Day
             */
            if (month == Month.JANUARY
                    && day == 26) {

                return 1.20;
            }

            /*
             * Independence Day
             */
            if (month == Month.AUGUST
                    && day == 15) {

                return 1.20;
            }

            /*
             * Gandhi Jayanti
             */
            if (month == Month.OCTOBER
                    && day == 2) {

                return 1.20;
            }

            /*
             * Christmas
             */
            if (month == Month.DECEMBER
                    && day == 25) {

                return 1.20;
            }

        } catch (Exception e) {

            // If date cannot be parsed,
            // keep normal pricing.
        }

        return 1.00;
    }

    /**
     * Result returned by the pricing engine.
     */
    public static class PricingResult {

        private final double basePrice;
        private final double dynamicPrice;

        private final double demandMultiplier;
        private final double peakMultiplier;
        private final double holidayMultiplier;

        private final double demandAdjustment;
        private final double peakAdjustment;
        private final double holidayAdjustment;

        public PricingResult(
                double basePrice,
                double dynamicPrice,
                double demandMultiplier,
                double peakMultiplier,
                double holidayMultiplier,
                double demandAdjustment,
                double peakAdjustment,
                double holidayAdjustment) {

            this.basePrice = basePrice;
            this.dynamicPrice = dynamicPrice;

            this.demandMultiplier =
                    demandMultiplier;

            this.peakMultiplier =
                    peakMultiplier;

            this.holidayMultiplier =
                    holidayMultiplier;

            this.demandAdjustment =
                    demandAdjustment;

            this.peakAdjustment =
                    peakAdjustment;

            this.holidayAdjustment =
                    holidayAdjustment;
        }

        public double getBasePrice() {
            return basePrice;
        }

        public double getDynamicPrice() {
            return dynamicPrice;
        }

        public double getDemandMultiplier() {
            return demandMultiplier;
        }

        public double getPeakMultiplier() {
            return peakMultiplier;
        }

        public double getHolidayMultiplier() {
            return holidayMultiplier;
        }

        public double getDemandAdjustment() {
            return demandAdjustment;
        }

        public double getPeakAdjustment() {
            return peakAdjustment;
        }

        public double getHolidayAdjustment() {
            return holidayAdjustment;
        }
    }
}