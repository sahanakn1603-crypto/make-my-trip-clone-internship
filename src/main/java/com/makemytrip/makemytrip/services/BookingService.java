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


    /*
     * =========================================================
     * FLIGHT BOOKING
     * =========================================================
     *
     * IMPORTANT:
     *
     * The price received from the frontend is NOT trusted.
     *
     * The backend determines the actual flight price:
     *
     * 1. If the user has an ACTIVE price freeze:
     *      use the locked price.
     *
     * 2. Otherwise:
     *      calculate the current dynamic price.
     *
     * This prevents the frontend from changing the booking price.
     */
    public Booking bookFlight(
            String userId,
            String flightId,
            int seats,
            double price) {

        /*
         * Validate basic input.
         */
        if (userId == null || userId.isBlank()) {
            throw new RuntimeException("User ID is required");
        }

        if (flightId == null || flightId.isBlank()) {
            throw new RuntimeException("Flight ID is required");
        }

        if (seats <= 0) {
            throw new RuntimeException("Number of seats must be greater than zero");
        }


        /*
         * Find user.
         */
        Optional<Users> usersOptional =
                userRepository.findById(userId);


        /*
         * Find flight.
         */
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


        /*
         * Check seat availability.
         */
        if (flight.getAvailableSeats() < seats) {
            throw new RuntimeException(
                    "Not enough seats available. Available seats: "
                            + flight.getAvailableSeats()
            );
        }


        /*
         * =====================================================
         * SERVER-SIDE PRICE CALCULATION
         * =====================================================
         */

        double bookingPricePerSeat;

        Optional<PriceFreeze> activeFreeze =
                priceFreezeRepository
                        .findFirstByUserIdAndFlightIdAndStatusOrderByCreatedAtDesc(
                                userId,
                                flightId,
                                "ACTIVE"
                        );


        /*
         * Check whether an ACTIVE freeze is still valid.
         */
        if (activeFreeze.isPresent()) {

            PriceFreeze freeze = activeFreeze.get();

            if (freeze.getExpiresAt() != null &&
                    freeze.getExpiresAt().isAfter(LocalDateTime.now())) {

                /*
                 * ---------------------------------------------
                 * PRICE FREEZE IS ACTIVE
                 * ---------------------------------------------
                 *
                 * Use the locked price instead of the
                 * current dynamic price.
                 */
                bookingPricePerSeat =
                        freeze.getLockedPrice();

                System.out.println(
                        "========================================"
                );

                System.out.println(
                        "🔒 PRICE FREEZE USED"
                );

                System.out.println(
                        "User ID: " + userId
                );

                System.out.println(
                        "Flight ID: " + flightId
                );

                System.out.println(
                        "Locked Price: ₹" + bookingPricePerSeat
                );

                System.out.println(
                        "Seats: " + seats
                );

                System.out.println(
                        "========================================"
                );

            } else {

                /*
                 * Freeze has expired.
                 */
                freeze.setStatus("EXPIRED");

                priceFreezeRepository.save(freeze);

                activeFreeze = Optional.empty();

                /*
                 * Calculate current dynamic price.
                 */
                bookingPricePerSeat =
                        pricingService
                                .calculatePrice(flight)
                                .getDynamicPrice();

                System.out.println(
                        "⏰ Price freeze expired. "
                                + "Using current dynamic price: ₹"
                                + bookingPricePerSeat
                );
            }

        } else {

            /*
             * =================================================
             * NO ACTIVE FREEZE
             * =================================================
             *
             * Calculate the current price from the
             * Dynamic Pricing Engine.
             */
            bookingPricePerSeat =
                    pricingService
                            .calculatePrice(flight)
                            .getDynamicPrice();

            System.out.println(
                    "💰 Dynamic price used for booking: ₹"
                            + bookingPricePerSeat
            );
        }


        /*
         * =====================================================
         * SERVER-CALCULATED TOTAL
         * =====================================================
         *
         * The frontend "price" parameter is intentionally
         * ignored for the flight fare.
         *
         * This prevents users from manipulating the price
         * through browser requests.
         */
        double serverCalculatedTotal =
                bookingPricePerSeat * seats;


        /*
         * Reduce available seats.
         */
        flight.setAvailableSeats(
                flight.getAvailableSeats() - seats
        );

        flightRepository.save(flight);


        /*
         * =====================================================
         * CREATE BOOKING
         * =====================================================
         */
        Booking booking = new Booking();

        booking.setType("Flight");

        booking.setBookingId(flightId);

        booking.setDate(
                LocalDateTime.now().toString()
        );

        booking.setQuantity(seats);

        /*
         * IMPORTANT:
         *
         * Store the price calculated by the backend,
         * not the price supplied by the frontend.
         */
        booking.setTotalPrice(
                serverCalculatedTotal
        );


        /*
         * Add booking to user.
         */
        user.getBookings().add(booking);

        userRepository.save(user);


        /*
         * =====================================================
         * CONSUME PRICE FREEZE
         * =====================================================
         *
         * Once the booking has successfully been created,
         * the freeze is marked USED.
         *
         * This prevents the same frozen price from being
         * reused for another separate booking.
         */
        if (activeFreeze.isPresent()) {

            PriceFreeze freeze = activeFreeze.get();

            /*
             * Only mark it USED if it was actually valid.
             */
            if (freeze.getExpiresAt() != null &&
                    freeze.getExpiresAt().isAfter(LocalDateTime.now())) {

                freeze.setStatus("USED");

                priceFreezeRepository.save(freeze);

                System.out.println(
                        "🔒 Price freeze marked as USED"
                );
            }
        }


        /*
         * Return the completed booking.
         */
        return booking;
    }


    /*
     * =========================================================
     * HOTEL BOOKING
     * =========================================================
     *
     * Existing hotel booking logic is preserved.
     */
    public Booking bookhotel(
            String userId,
            String hotelId,
            int rooms,
            double price) {

        Optional<Users> usersOptional =
                userRepository.findById(userId);

        Optional<Hotel> hotelOptional =
                hotelRepository.findById(hotelId);


        if (usersOptional.isPresent()
                && hotelOptional.isPresent()) {

            Users user = usersOptional.get();

            Hotel hotel = hotelOptional.get();


            /*
             * Check room availability.
             */
            if (hotel.getAvailableRooms() >= rooms) {

                hotel.setAvailableRooms(
                        hotel.getAvailableRooms() - rooms
                );

                hotelRepository.save(hotel);


                Booking booking = new Booking();

                booking.setType("Hotel");

                booking.setBookingId(hotelId);

                booking.setDate(
                        LocalDateTime.now().toString()
                );

                booking.setQuantity(rooms);

                /*
                 * Existing hotel behaviour preserved.
                 */
                booking.setTotalPrice(price);


                user.getBookings().add(booking);

                userRepository.save(user);


                return booking;

            } else {

                throw new RuntimeException(
                        "Not enough rooms available"
                );
            }

        }


        throw new RuntimeException(
                "User or hotel not found"
        );
    }
}