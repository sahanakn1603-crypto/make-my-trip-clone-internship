package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.CancellationRefund;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.repositories.CancellationRefundRepository;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class CancellationRefundService {

    private static final double REFUND_WITHIN_24_HOURS = 50.0;
    private static final int REFUND_TIMELINE_DAYS = 5;

    // Demo progression so all three tracker states can be verified locally.
    private static final long PROCESSED_AFTER_MINUTES = 1;
    private static final long COMPLETED_AFTER_MINUTES = 2;

    @Autowired
    private CancellationRefundRepository cancellationRefundRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public CancellationRefund cancelBooking(
            String userId,
            String bookingId,
            String reason) {

        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID is required.");
        }

        if (bookingId == null || bookingId.trim().isEmpty()) {
            throw new IllegalArgumentException("Booking ID is required.");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Please select a cancellation reason."
            );
        }

        Optional<CancellationRefund> existing =
                cancellationRefundRepository
                        .findFirstByUserIdAndBookingIdOrderByCancelledAtDesc(
                                userId, bookingId);

        if (existing.isPresent()) {
            throw new IllegalArgumentException(
                    "This booking has already been cancelled."
            );
        }

        Document userDocument = findUserDocument(userId);

        if (userDocument == null) {
            throw new IllegalArgumentException("User not found.");
        }

        Object bookingsObject = userDocument.get("bookings");

        if (!(bookingsObject instanceof List<?>)) {
            throw new IllegalArgumentException(
                    "No bookings found for this user."
            );
        }

        @SuppressWarnings("unchecked")
        List<Document> bookings = (List<Document>) bookingsObject;

        Document selectedBooking = null;

        for (Document booking : bookings) {
            Object currentBookingId = booking.get("bookingId");

            if (currentBookingId != null
                    && bookingId.equals(String.valueOf(currentBookingId))) {
                selectedBooking = booking;
                break;
            }
        }

        if (selectedBooking == null) {
            throw new IllegalArgumentException("Booking not found.");
        }

        String currentStatus = selectedBooking.getString("status");

        if (currentStatus != null
                && "CANCELLED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalArgumentException(
                    "This booking is already cancelled."
            );
        }

        String bookingType = selectedBooking.getString("type");

        if (bookingType == null || bookingType.isBlank()) {
            bookingType = "Flight";
        }

        double bookingAmount = readDouble(
                selectedBooking.get("totalPrice")
        );

        int quantity = readInt(
                selectedBooking.get("quantity"),
                1
        );

        if (quantity < 1) {
            quantity = 1;
        }

        LocalDateTime reservationDate =
                parseReservationDate(selectedBooking.get("date"));

        LocalDateTime cancelledAt = LocalDateTime.now();

        long minutesSinceReservation = Math.max(
                0,
                Duration.between(
                        reservationDate,
                        cancelledAt
                ).toMinutes()
        );

        double refundPercentage =
                minutesSinceReservation <= 24 * 60
                        ? REFUND_WITHIN_24_HOURS
                        : 0.0;

        double refundAmount =
                Math.round(
                        bookingAmount * refundPercentage
                                / 100.0 * 100.0
                ) / 100.0;

        LocalDateTime expectedRefundDate =
                cancelledAt.plusDays(REFUND_TIMELINE_DAYS);

        if ("Flight".equalsIgnoreCase(bookingType)) {
            restoreFlightSeats(bookingId, quantity);
        } else if ("Hotel".equalsIgnoreCase(bookingType)) {
            restoreHotelRooms(bookingId, quantity);
        }

        String collectionName = getUserCollectionName();

        Query query = new Query(
                Criteria.where("_id").is(userId)
        );

        Update update = new Update()
                .set("bookings.$[booking].status", "CANCELLED")
                .set(
                        "bookings.$[booking].cancellationReason",
                        reason
                )
                .set(
                        "bookings.$[booking].refundAmount",
                        refundAmount
                )
                .set(
                        "bookings.$[booking].refundStatus",
                        "PENDING"
                )
                .set(
                        "bookings.$[booking].cancelledAt",
                        cancelledAt
                );

        update.filterArray(
                Criteria.where("booking.bookingId").is(bookingId)
        );

        mongoTemplate.updateFirst(
                query,
                update,
                collectionName
        );

        CancellationRefund refund =
                new CancellationRefund();

        refund.setUserId(userId);
        refund.setBookingId(bookingId);
        refund.setBookingType(bookingType);
        refund.setBookingAmount(bookingAmount);
        refund.setRefundPercentage(refundPercentage);
        refund.setRefundAmount(refundAmount);
        refund.setCancellationReason(reason);
        refund.setStatus("PENDING");
        refund.setCancelledAt(cancelledAt);
        refund.setExpectedRefundDate(expectedRefundDate);

        return cancellationRefundRepository.save(refund);
    }

    public Optional<CancellationRefund> getRefundStatus(
            String userId,
            String bookingId) {

        Optional<CancellationRefund> optional =
                cancellationRefundRepository
                        .findFirstByUserIdAndBookingIdOrderByCancelledAtDesc(
                                userId,
                                bookingId
                        );

        if (optional.isEmpty()) {
            return optional;
        }

        CancellationRefund refund = optional.get();

        refreshRefundStatus(refund);

        return Optional.of(refund);
    }

    /**
     * Automatically progresses refund status:
     * PENDING -> PROCESSED -> COMPLETED.
     *
     * These short demo intervals are only for local verification.
     * The expected customer-facing refund timeline remains 5 days.
     */
    @Scheduled(fixedRate = 30000)
    public void processRefundStatuses() {

        List<CancellationRefund> refunds =
                cancellationRefundRepository.findAll();

        for (CancellationRefund refund : refunds) {
            refreshRefundStatus(refund);
        }
    }

    private void refreshRefundStatus(
            CancellationRefund refund) {

        if (refund.getCancelledAt() == null) {
            return;
        }

        long minutesElapsed =
                Duration.between(
                        refund.getCancelledAt(),
                        LocalDateTime.now()
                ).toMinutes();

        String currentStatus = refund.getStatus();

        if (currentStatus == null || currentStatus.isBlank()) {
            currentStatus = "PENDING";
        }

        String calculatedStatus;

        if (minutesElapsed >= COMPLETED_AFTER_MINUTES) {
            calculatedStatus = "COMPLETED";
        } else if (minutesElapsed >= PROCESSED_AFTER_MINUTES) {
            calculatedStatus = "PROCESSED";
        } else {
            calculatedStatus = "PENDING";
        }

        // Refund status is monotonic: it can only move forward.
        // COMPLETED can never become PROCESSED or PENDING.
        String newStatus = getHighestRefundStatus(currentStatus, calculatedStatus);

        if (!newStatus.equalsIgnoreCase(currentStatus)) {

            refund.setStatus(newStatus);

            cancellationRefundRepository.save(refund);

            updateEmbeddedBookingRefundStatus(
                    refund.getUserId(),
                    refund.getBookingId(),
                    newStatus
            );
        }
    }

    private String getHighestRefundStatus(
            String currentStatus,
            String calculatedStatus) {

        int currentRank = refundStatusRank(currentStatus);
        int calculatedRank = refundStatusRank(calculatedStatus);

        return calculatedRank > currentRank
                ? calculatedStatus
                : currentStatus.toUpperCase();
    }

    private int refundStatusRank(String status) {
        if (status == null) {
            return 1; // PENDING
        }

        switch (status.toUpperCase()) {
            case "COMPLETED":
                return 3;
            case "PROCESSED":
                return 2;
            case "PENDING":
            default:
                return 1;
        }
    }

    private void updateEmbeddedBookingRefundStatus(
            String userId,
            String bookingId,
            String status) {

        String collectionName;

        try {
            collectionName = getUserCollectionName();
        } catch (Exception e) {
            return;
        }

        Query query = new Query(
                Criteria.where("_id").is(userId)
        );

        Update update = new Update()
                .set(
                        "bookings.$[booking].refundStatus",
                        status
                );

        update.filterArray(
                Criteria.where("booking.bookingId").is(bookingId)
        );

        mongoTemplate.updateFirst(
                query,
                update,
                collectionName
        );
    }

    private Document findUserDocument(String userId) {

        if (mongoTemplate.collectionExists("users")) {

            Document user = mongoTemplate.findOne(
                    new Query(
                            Criteria.where("_id").is(userId)
                    ),
                    Document.class,
                    "users"
            );

            if (user != null) {
                return user;
            }
        }

        if (mongoTemplate.collectionExists("user")) {

            Document user = mongoTemplate.findOne(
                    new Query(
                            Criteria.where("_id").is(userId)
                    ),
                    Document.class,
                    "user"
            );

            if (user != null) {
                return user;
            }
        }

        return null;
    }

    private String getUserCollectionName() {

        if (mongoTemplate.collectionExists("users")) {
            return "users";
        }

        if (mongoTemplate.collectionExists("user")) {
            return "user";
        }

        throw new IllegalArgumentException(
                "User collection not found."
        );
    }

    private void restoreHotelRooms(
            String bookingId,
            int quantity) {

        try {

            Optional<Hotel> hotel =
                    hotelRepository.findById(bookingId);

            if (hotel.isPresent()) {

                Hotel selectedHotel = hotel.get();

                selectedHotel.setAvailableRooms(
                        selectedHotel.getAvailableRooms()
                                + quantity
                );

                hotelRepository.save(selectedHotel);
            }

        } catch (Exception e) {

            System.out.println(
                    "Warning: Unable to restore hotel rooms: "
                            + e.getMessage()
            );
        }
    }

    private void restoreFlightSeats(
            String bookingId,
            int quantity) {

        try {

            Optional<Flight> flight =
                    flightRepository.findById(bookingId);

            if (flight.isPresent()) {

                Flight selectedFlight = flight.get();

                selectedFlight.setAvailableSeats(
                        selectedFlight.getAvailableSeats()
                                + quantity
                );

                flightRepository.save(selectedFlight);
            }

        } catch (Exception e) {

            System.out.println(
                    "Warning: Unable to restore flight seats: "
                            + e.getMessage()
            );
        }
    }

    private double readDouble(Object value) {

        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }

        if (value != null) {
            try {
                return Double.parseDouble(value.toString());
            } catch (NumberFormatException ignored) {
            }
        }

        return 0.0;
    }

    private int readInt(Object value, int fallback) {

        if (value instanceof Number) {
            return ((Number) value).intValue();
        }

        if (value != null) {
            try {
                return Integer.parseInt(value.toString());
            } catch (NumberFormatException ignored) {
            }
        }

        return fallback;
    }

    private LocalDateTime parseReservationDate(Object value) {

        if (value == null) {
            return LocalDateTime.now();
        }

        if (value instanceof Date) {
            return ((Date) value)
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime();
        }

        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }

        if (value instanceof LocalDate) {
            return ((LocalDate) value).atStartOfDay();
        }

        String text = value.toString().trim();

        try {
            return LocalDateTime.parse(text);
        } catch (DateTimeParseException ignored) {
        }

        try {
            return LocalDate.parse(text).atStartOfDay();
        } catch (DateTimeParseException ignored) {
        }

        try {
            return LocalDateTime.parse(
                    text,
                    DateTimeFormatter.ofPattern(
                            "yyyy-MM-dd HH:mm:ss"
                    )
            );
        } catch (DateTimeParseException ignored) {
        }

        return LocalDateTime.now();
    }
}
