package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.models.Users.Booking;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.models.PriceFreeze;

import com.makemytrip.makemytrip.repositories.UserRepository;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import com.makemytrip.makemytrip.repositories.PriceFreezeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private PriceFreezeRepository priceFreezeRepository;

    @Autowired
    private PricingService pricingService;

    @Autowired
    private FlightSeatService flightSeatService;


    // =========================================================
    // FLIGHT BOOKING
    // =========================================================

    public Booking bookFlight(
            String userId,
            String flightId,
            int seats,
            double price,
            String date,
            String selectedSeats) {

        // -----------------------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------------------

        if (userId == null || userId.isBlank()) {
            throw new RuntimeException("User ID is required");
        }

        if (flightId == null || flightId.isBlank()) {
            throw new RuntimeException("Flight ID is required");
        }

        if (seats <= 0) {
            throw new RuntimeException(
                    "Number of seats must be greater than zero"
            );
        }


        // -----------------------------------------------------
        // VALIDATE SELECTED PHYSICAL SEATS
        // -----------------------------------------------------

        if (selectedSeats == null || selectedSeats.isBlank()) {
            throw new RuntimeException(
                    "Please select at least one seat"
            );
        }

        List<String> selectedSeatList =
                java.util.Arrays.stream(selectedSeats.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isBlank())
                        .map(String::toUpperCase)
                        .distinct()
                        .toList();

        if (selectedSeatList.size() != seats) {
            throw new RuntimeException(
                    "Please select exactly " + seats + " seat"
                            + (seats > 1 ? "s" : "")
            );
        }


        // -----------------------------------------------------
        // FIND USER
        // -----------------------------------------------------

        Optional<Users> usersOptional =
                userRepository.findById(userId);


        // -----------------------------------------------------
        // FIND FLIGHT
        // -----------------------------------------------------

        Optional<Flight> flightOptional =
                flightRepository.findById(flightId);


        if (usersOptional.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        if (flightOptional.isEmpty()) {
            throw new RuntimeException("Flight not found");
        }


        Users user = usersOptional.get();
        Flight flight = flightOptional.get();


        // -----------------------------------------------------
        // VALIDATE TRAVEL DATE
        // -----------------------------------------------------

        LocalDate bookingDate;

        if (date == null || date.isBlank()) {

            if (flight.getDepartureTime() == null ||
                    flight.getDepartureTime().isBlank()) {

                throw new RuntimeException(
                        "Please select an updated travel date"
                );
            }

            try {

                bookingDate = LocalDate.parse(
                        flight.getDepartureTime().substring(0, 10)
                );

            } catch (Exception e) {

                throw new RuntimeException(
                        "Invalid flight travel date"
                );
            }

        } else {

            try {

                bookingDate = LocalDate.parse(date);

            } catch (Exception e) {

                throw new RuntimeException(
                        "Invalid travel date. Please select an updated date"
                );
            }
        }


        if (bookingDate.isBefore(LocalDate.now())) {

            throw new RuntimeException(
                    "This date has already passed. Please select an updated date"
            );
        }


        if (flight.getDepartureTime() != null &&
                !flight.getDepartureTime().isBlank()) {

            String flightDate =
                    flight.getDepartureTime().substring(0, 10);

            if (!flightDate.equals(bookingDate.toString())) {

                throw new RuntimeException(
                        "The selected date does not match this flight. "
                                + "Please select the correct travel date"
                );
            }
        }


        // -----------------------------------------------------
        // CHECK GENERAL FLIGHT AVAILABILITY
        // -----------------------------------------------------

        if (flight.getAvailableSeats() < seats) {

            throw new RuntimeException(
                    "Not enough seats available. Available seats: "
                            + flight.getAvailableSeats()
            );
        }


        // =====================================================
        // SERVER-SIDE PRICE CALCULATION
        // =====================================================

        double bookingPricePerSeat;

        Optional<PriceFreeze> activeFreeze =
                priceFreezeRepository
                        .findFirstByUserIdAndFlightIdAndStatusOrderByCreatedAtDesc(
                                userId,
                                flightId,
                                "ACTIVE"
                        );


        // -----------------------------------------------------
        // ACTIVE PRICE FREEZE
        // -----------------------------------------------------

        if (activeFreeze.isPresent()) {

            PriceFreeze freeze =
                    activeFreeze.get();

            if (freeze.getExpiresAt() != null &&
                    freeze.getExpiresAt()
                            .isAfter(LocalDateTime.now())) {

                bookingPricePerSeat =
                        freeze.getLockedPrice();

                System.out.println(
                        "========================================"
                );

                System.out.println(
                        "PRICE FREEZE USED"
                );

                System.out.println(
                        "User ID: " + userId
                );

                System.out.println(
                        "Flight ID: " + flightId
                );

                System.out.println(
                        "Locked Price: ₹"
                                + bookingPricePerSeat
                );

                System.out.println(
                        "Seats: " + seats
                );

                System.out.println(
                        "========================================"
                );

            } else {

                // Freeze expired

                freeze.setStatus("EXPIRED");

                priceFreezeRepository.save(freeze);

                activeFreeze = Optional.empty();

                bookingPricePerSeat =
                        pricingService
                                .calculatePrice(flight)
                                .getDynamicPrice();

                System.out.println(
                        "Price freeze expired. "
                                + "Using current dynamic price: ₹"
                                + bookingPricePerSeat
                );
            }

        } else {

            // -------------------------------------------------
            // NO ACTIVE FREEZE
            // -------------------------------------------------

            bookingPricePerSeat =
                    pricingService
                            .calculatePrice(flight)
                            .getDynamicPrice();

            System.out.println(
                    "Dynamic price used for booking: ₹"
                            + bookingPricePerSeat
            );
        }


        // =====================================================
        // BOOK THE ACTUAL SELECTED SEATS
        // =====================================================
        //
        // IMPORTANT:
        //
        // We now use the existing FlightSeatService.
        //
        // It checks:
        //
        // AVAILABLE -> BOOKED
        //
        // This means another user cannot book the same seat.
        // =====================================================

        double seatUpgradeAmount =
                flightSeatService.bookSeats(
                        flightId,
                        selectedSeatList
                );


        System.out.println(
                "========================================"
        );

        System.out.println(
                "FLIGHT SEATS BOOKED"
        );

        System.out.println(
                "Flight ID: " + flightId
        );

        System.out.println(
                "Selected Seats: " + selectedSeatList
        );

        System.out.println(
                "Seat Upgrade Amount: ₹"
                        + seatUpgradeAmount
        );

        System.out.println(
                "========================================"
        );


        // =====================================================
        // REDUCE GENERAL AVAILABLE SEAT COUNT
        // =====================================================

        flight.setAvailableSeats(
                flight.getAvailableSeats() - seats
        );

        flightRepository.save(flight);


        // =====================================================
        // CREATE BOOKING
        // =====================================================

        Booking booking = new Booking();

        booking.setType("Flight");

        booking.setBookingId(flightId);

        booking.setDate(
                bookingDate.toString()
        );

        booking.setQuantity(seats);


        // -----------------------------------------------------
        // FINAL PRICE
        // -----------------------------------------------------

        if (price <= 0) {

            throw new RuntimeException(
                    "Invalid booking amount"
            );
        }

        /*
         * The frontend sends the final checkout amount.
         *
         * This includes:
         * - Flight fare
         * - Dynamic pricing
         * - Taxes
         * - Services
         * - Seat upgrade
         * - Discounts
         */

        booking.setTotalPrice(price);


        // =====================================================
        // SAVE BOOKING TO USER
        // =====================================================

        user.getBookings().add(booking);

        userRepository.save(user);


        // =====================================================
        // CONSUME PRICE FREEZE
        // =====================================================

        if (activeFreeze.isPresent()) {

            PriceFreeze freeze =
                    activeFreeze.get();

            if (freeze.getExpiresAt() != null &&
                    freeze.getExpiresAt()
                            .isAfter(LocalDateTime.now())) {

                freeze.setStatus("USED");

                priceFreezeRepository.save(freeze);

                System.out.println(
                        "Price freeze marked as USED"
                );
            }
        }


        return booking;
    }


    // =========================================================
    // HOTEL BOOKING
    // =========================================================

    public Booking bookhotel(
            String userId,
            String hotelId,
            int rooms,
            double price,
            String roomType,
            String date) {


        // -----------------------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------------------

        if (userId == null || userId.isBlank()) {

            throw new RuntimeException(
                    "User ID is required"
            );
        }


        if (hotelId == null || hotelId.isBlank()) {

            throw new RuntimeException(
                    "Hotel ID is required"
            );
        }


        if (rooms <= 0) {

            throw new RuntimeException(
                    "Number of rooms must be greater than zero"
            );
        }


        // =====================================================
        // DATE VALIDATION
        // =====================================================

        if (date == null || date.isBlank()) {

            throw new RuntimeException(
                    "Please select an updated check-in date"
            );
        }


        LocalDate selectedDate;

        try {

            selectedDate =
                    LocalDate.parse(date);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Invalid booking date. Please select an updated date"
            );
        }


        LocalDate today =
                LocalDate.now();


        if (selectedDate.isBefore(today)) {

            throw new RuntimeException(
                    "This date has already passed. "
                            + "Please select an updated date"
            );
        }


        // =====================================================
        // ROOM TYPE
        // =====================================================

        String normalizedRoomType =
                roomType == null ||
                roomType.isBlank()
                        ? "STANDARD"
                        : roomType
                                .trim()
                                .toUpperCase();


        if (!normalizedRoomType.equals("STANDARD")
                && !normalizedRoomType.equals("DELUXE")
                && !normalizedRoomType.equals("PREMIUM")) {

            throw new RuntimeException(
                    "Invalid room type. "
                            + "Use STANDARD, DELUXE or PREMIUM"
            );
        }


        // =====================================================
        // FIND USER
        // =====================================================

        Optional<Users> usersOptional =
                userRepository.findById(userId);


        // =====================================================
        // FIND HOTEL
        // =====================================================

        Optional<Hotel> hotelOptional =
                hotelRepository.findById(hotelId);


        if (usersOptional.isEmpty()) {

            throw new RuntimeException(
                    "User not found"
            );
        }


        if (hotelOptional.isEmpty()) {

            throw new RuntimeException(
                    "Hotel not found"
            );
        }


        Users user =
                usersOptional.get();

        Hotel hotel =
                hotelOptional.get();


        // =====================================================
        // INITIALIZE ROOM AVAILABILITY
        // =====================================================

        hotel.initializeRoomTypeAvailabilityIfNeeded();


        int typeAvailability;


        // =====================================================
        // CHECK ROOM TYPE
        // =====================================================

        switch (normalizedRoomType) {

            case "DELUXE":

                typeAvailability =
                        hotel.getDeluxeRooms();

                break;


            case "PREMIUM":

                typeAvailability =
                        hotel.getPremiumRooms();

                break;


            default:

                typeAvailability =
                        hotel.getStandardRooms();

                break;
        }


        // =====================================================
        // CHECK ROOM AVAILABILITY
        // =====================================================

        if (typeAvailability < rooms) {

            throw new RuntimeException(
                    "Not enough "
                            + normalizedRoomType.toLowerCase()
                            + " rooms available. Available: "
                            + typeAvailability
            );
        }


        // =====================================================
        // REDUCE ROOM AVAILABILITY
        // =====================================================

        switch (normalizedRoomType) {

            case "DELUXE":

                hotel.setDeluxeRooms(
                        hotel.getDeluxeRooms() - rooms
                );

                break;


            case "PREMIUM":

                hotel.setPremiumRooms(
                        hotel.getPremiumRooms() - rooms
                );

                break;


            default:

                hotel.setStandardRooms(
                        hotel.getStandardRooms() - rooms
                );

                break;
        }


        // =====================================================
        // UPDATE TOTAL AVAILABLE ROOMS
        // =====================================================

        hotel.setAvailableRooms(
                hotel.getStandardRooms()
                        + hotel.getDeluxeRooms()
                        + hotel.getPremiumRooms()
        );


        hotelRepository.save(hotel);


        // =====================================================
        // CREATE HOTEL BOOKING
        // =====================================================

        Booking booking =
                new Booking();


        booking.setType(
                "Hotel"
        );


        booking.setBookingId(
                hotelId
        );


        booking.setDate(
                selectedDate.toString()
        );


        booking.setQuantity(
                rooms
        );


        booking.setTotalPrice(
                price
        );


        // =====================================================
        // SAVE BOOKING
        // =====================================================

        user.getBookings().add(
                booking
        );

        userRepository.save(
                user
        );


        System.out.println(
                "========================================"
        );

        System.out.println(
                "HOTEL BOOKING CREATED"
        );

        System.out.println(
                "Hotel ID: " + hotelId
        );

        System.out.println(
                "User ID: " + userId
        );

        System.out.println(
                "Room Type: " + normalizedRoomType
        );

        System.out.println(
                "Rooms: " + rooms
        );

        System.out.println(
                "Booking Date: " + selectedDate
        );

        System.out.println(
                "Total Price: ₹" + price
        );

        System.out.println(
                "========================================"
        );


        return booking;
    }
}