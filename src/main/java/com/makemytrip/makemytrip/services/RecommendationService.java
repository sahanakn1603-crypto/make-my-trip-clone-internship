package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.models.RecommendationFeedback;
import com.makemytrip.makemytrip.models.Review;
import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import com.makemytrip.makemytrip.repositories.RecommendationFeedbackRepository;
import com.makemytrip.makemytrip.repositories.ReviewRepository;
import com.makemytrip.makemytrip.repositories.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

@Service
public class RecommendationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RecommendationFeedbackRepository feedbackRepository;


    // =========================================================
    // GET RECOMMENDATIONS USING EMAIL
    // =========================================================

    public List<Map<String, Object>> getRecommendationsByEmail(
            String email
    ) {

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        Users user =
                userRepository.findByEmail(email.trim());

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        return generateRecommendations(user);
    }


    // =========================================================
    // GET RECOMMENDATIONS USING USER ID
    // =========================================================
    // Kept so the old endpoint continues to work.

    public List<Map<String, Object>> getRecommendations(
            String userId
    ) {

        if (userId == null || userId.isBlank()) {
            throw new RuntimeException("User ID is required");
        }

        Optional<Users> userOptional =
                userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        return generateRecommendations(
                userOptional.get()
        );
    }


    // =========================================================
    // MAIN RECOMMENDATION ENGINE
    // =========================================================

    private List<Map<String, Object>> generateRecommendations(
            Users currentUser
    ) {

        List<Users> allUsers =
                userRepository.findAll();

        List<Hotel> hotels =
                hotelRepository.findAll();

        List<Flight> flights =
                flightRepository.findAll();

        List<Review> allReviews =
                reviewRepository.findAll();

        List<RecommendationFeedback> feedback =
                feedbackRepository.findByUserId(
                        currentUser.getId()
                );


        // =====================================================
        // USER BOOKING HISTORY
        // =====================================================

        Set<String> bookedHotelIds =
                new HashSet<>();

        Set<String> bookedFlightIds =
                new HashSet<>();

        Set<String> preferredLocations =
                new HashSet<>();

        Set<String> preferredFlightDestinations =
                new HashSet<>();

        double averageHotelPrice = 0;
        int hotelPriceCount = 0;

        double averageFlightPrice = 0;
        int flightPriceCount = 0;


        if (currentUser.getBookings() != null) {

            for (Users.Booking booking :
                    currentUser.getBookings()) {

                if (booking == null ||
                        booking.getBookingId() == null) {
                    continue;
                }


                if ("HOTEL".equalsIgnoreCase(
                        booking.getType()
                )) {

                    bookedHotelIds.add(
                            booking.getBookingId()
                    );

                } else if ("FLIGHT".equalsIgnoreCase(
                        booking.getType()
                )) {

                    bookedFlightIds.add(
                            booking.getBookingId()
                    );
                }
            }
        }


        // =====================================================
        // HOTEL PREFERENCES
        // =====================================================

        for (String hotelId : bookedHotelIds) {

            Optional<Hotel> hotelOptional =
                    hotelRepository.findById(hotelId);

            if (hotelOptional.isPresent()) {

                Hotel hotel =
                        hotelOptional.get();

                if (hotel.getLocation() != null) {

                    preferredLocations.add(
                            hotel.getLocation()
                                    .trim()
                                    .toLowerCase()
                    );
                }

                averageHotelPrice +=
                        hotel.getPricePerNight();

                hotelPriceCount++;
            }
        }


        // =====================================================
        // FLIGHT PREFERENCES
        // =====================================================

        for (String flightId :
                bookedFlightIds) {

            Optional<Flight> flightOptional =
                    flightRepository.findById(
                            flightId
                    );

            if (flightOptional.isPresent()) {

                Flight flight =
                        flightOptional.get();

                if (flight.getTo() != null) {

                    preferredFlightDestinations.add(
                            flight.getTo()
                                    .trim()
                                    .toLowerCase()
                    );
                }

                averageFlightPrice +=
                        flight.getPrice();

                flightPriceCount++;
            }
        }


        if (hotelPriceCount > 0) {

            averageHotelPrice =
                    averageHotelPrice /
                            hotelPriceCount;
        }

        if (flightPriceCount > 0) {

            averageFlightPrice =
                    averageFlightPrice /
                            flightPriceCount;
        }


        // =====================================================
        // POSITIVE REVIEWS
        // =====================================================

        Set<String> positivelyRatedHotels =
                new HashSet<>();

        Set<String> positivelyRatedFlights =
                new HashSet<>();


        for (Review review : allReviews) {

            if (!currentUser.getId().equals(
                    review.getUserId()
            )) {
                continue;
            }

            if (review.getRating() >= 4) {

                if ("HOTEL".equalsIgnoreCase(
                        review.getTargetType()
                )) {

                    positivelyRatedHotels.add(
                            review.getTargetId()
                    );

                } else if ("FLIGHT".equalsIgnoreCase(
                        review.getTargetType()
                )) {

                    positivelyRatedFlights.add(
                            review.getTargetId()
                    );
                }
            }
        }


        // =====================================================
        // USER FEEDBACK
        // =====================================================

        Set<String> irrelevantRecommendations =
                feedback.stream()
                        .filter(f ->
                                "IRRELEVANT".equalsIgnoreCase(
                                        f.getFeedback()
                                )
                        )
                        .map(f ->
                                f.getTargetType()
                                        + ":"
                                        + f.getTargetId()
                        )
                        .collect(Collectors.toSet());


        // =====================================================
        // COLLABORATIVE FILTERING
        // =====================================================

        Set<String> similarUserIds =
                findSimilarUsers(
                        currentUser,
                        allUsers
                );


        List<Map<String, Object>> recommendations =
                new ArrayList<>();


        // =====================================================
        // HOTEL RECOMMENDATIONS
        // =====================================================

        for (Hotel hotel : hotels) {

            if (hotel.getId() == null) {
                continue;
            }


            // Don't recommend already booked hotels.

            if (bookedHotelIds.contains(
                    hotel.getId()
            )) {
                continue;
            }


            String feedbackKey =
                    "HOTEL:" + hotel.getId();


            // Don't show recommendations marked irrelevant.

            if (irrelevantRecommendations.contains(
                    feedbackKey
            )) {
                continue;
            }


            double score = 0;

            List<String> reasons =
                    new ArrayList<>();


            // -------------------------------------------------
            // LOCATION MATCH
            // -------------------------------------------------

            if (hotel.getLocation() != null &&
                    preferredLocations.contains(
                            hotel.getLocation()
                                    .trim()
                                    .toLowerCase()
                    )) {

                score += 35;

                reasons.add(
                        "You previously booked a hotel in "
                                + hotel.getLocation()
                );
            }


            // -------------------------------------------------
            // PRICE SIMILARITY
            // -------------------------------------------------

            if (averageHotelPrice > 0) {

                double difference =
                        Math.abs(
                                hotel.getPricePerNight()
                                        - averageHotelPrice
                        );

                double percentageDifference =
                        difference /
                                averageHotelPrice;

                if (percentageDifference <= 0.25) {

                    score += 15;

                    reasons.add(
                            "Its price is similar to hotels you previously booked"
                    );
                }
            }


            // -------------------------------------------------
            // POSITIVE REVIEW
            // -------------------------------------------------

            if (positivelyRatedHotels.contains(
                    hotel.getId()
            )) {

                score += 10;
            }


            // -------------------------------------------------
            // COLLABORATIVE FILTERING
            // -------------------------------------------------

            if (hotelBookedBySimilarUser(
                    hotel.getId(),
                    similarUserIds,
                    allUsers
            )) {

                score += 25;

                reasons.add(
                        "Travelers with similar booking preferences booked this hotel"
                );
            }


            // -------------------------------------------------
            // HELPFUL FEEDBACK
            // -------------------------------------------------

            boolean markedHelpful =
                    feedback.stream().anyMatch(
                            f ->
                                    "HOTEL".equalsIgnoreCase(
                                            f.getTargetType()
                                    )
                                            &&
                                    hotel.getId().equals(
                                            f.getTargetId()
                                    )
                                            &&
                                    "HELPFUL".equalsIgnoreCase(
                                            f.getFeedback()
                                    )
                    );


            if (markedHelpful) {

                score += 15;

                reasons.add(
                        "You previously found this recommendation helpful"
                );
            }


            // -------------------------------------------------
            // DEFAULT REASON
            // -------------------------------------------------

            if (reasons.isEmpty()) {

                score += 10;

                reasons.add(
                        "This property matches current travel options"
                );
            }


            Map<String, Object> recommendation =
                    new HashMap<>();


            recommendation.put(
                    "targetType",
                    "HOTEL"
            );

            recommendation.put(
                    "targetId",
                    hotel.getId()
            );

            recommendation.put(
                    "title",
                    hotel.gethotelName()
            );

            recommendation.put(
                    "location",
                    hotel.getLocation()
            );

            recommendation.put(
                    "price",
                    hotel.getPricePerNight()
            );

            recommendation.put(
                    "amenities",
                    hotel.getamenities()
            );

            recommendation.put(
                    "score",
                    score
            );

            recommendation.put(
                    "reason",
                    reasons.get(0)
            );

            recommendation.put(
                    "reasons",
                    reasons
            );


            recommendations.add(
                    recommendation
            );
        }


        // =====================================================
        // FLIGHT RECOMMENDATIONS
        // =====================================================

        Set<String> recommendedFlightKeys =
                new HashSet<>();

        for (Flight flight : flights) {

            if (flight.getId() == null) {
                continue;
            }

            // Don't recommend flights that have already departed.
            if (!isFutureFlight(flight)) {
                continue;
            }

            // Avoid filling recommendations with duplicate
            // flight name + route combinations.
            String flightKey =
                    (
                            (flight.getFlightName() == null
                                    ? ""
                                    : flight.getFlightName().trim().toLowerCase())
                            + "|"
                            + (flight.getFrom() == null
                                    ? ""
                                    : flight.getFrom().trim().toLowerCase())
                            + "|"
                            + (flight.getTo() == null
                                    ? ""
                                    : flight.getTo().trim().toLowerCase())
                    );

            if (recommendedFlightKeys.contains(flightKey)) {
                continue;
            }

            recommendedFlightKeys.add(flightKey);


            // Don't recommend already booked flights.

            if (bookedFlightIds.contains(
                    flight.getId()
            )) {
                continue;
            }


            String feedbackKey =
                    "FLIGHT:" + flight.getId();


            // Don't show irrelevant recommendations.

            if (irrelevantRecommendations.contains(
                    feedbackKey
            )) {
                continue;
            }


            double score = 0;

            List<String> reasons =
                    new ArrayList<>();


            // -------------------------------------------------
            // DESTINATION MATCH
            // -------------------------------------------------

            if (flight.getTo() != null &&
                    preferredFlightDestinations.contains(
                            flight.getTo()
                                    .trim()
                                    .toLowerCase()
                    )) {

                score += 35;

                reasons.add(
                        "You previously traveled to "
                                + flight.getTo()
                );
            }


            // -------------------------------------------------
            // PRICE SIMILARITY
            // -------------------------------------------------

            if (averageFlightPrice > 0) {

                double difference =
                        Math.abs(
                                flight.getPrice()
                                        - averageFlightPrice
                        );

                double percentageDifference =
                        difference /
                                averageFlightPrice;

                if (percentageDifference <= 0.25) {

                    score += 15;

                    reasons.add(
                            "Its fare is similar to flights you previously booked"
                    );
                }
            }


            // -------------------------------------------------
            // POSITIVE REVIEW
            // -------------------------------------------------

            if (positivelyRatedFlights.contains(
                    flight.getId()
            )) {

                score += 10;
            }


            // -------------------------------------------------
            // COLLABORATIVE FILTERING
            // -------------------------------------------------

            if (flightBookedBySimilarUser(
                    flight.getId(),
                    similarUserIds,
                    allUsers
            )) {

                score += 25;

                reasons.add(
                        "Travelers with similar booking preferences booked this flight"
                );
            }


            // -------------------------------------------------
            // HELPFUL FEEDBACK
            // -------------------------------------------------

            boolean markedHelpful =
                    feedback.stream().anyMatch(
                            f ->
                                    "FLIGHT".equalsIgnoreCase(
                                            f.getTargetType()
                                    )
                                            &&
                                    flight.getId().equals(
                                            f.getTargetId()
                                    )
                                            &&
                                    "HELPFUL".equalsIgnoreCase(
                                            f.getFeedback()
                                    )
                    );


            if (markedHelpful) {

                score += 15;

                reasons.add(
                        "You previously found this recommendation helpful"
                );
            }


            // -------------------------------------------------
            // DEFAULT REASON
            // -------------------------------------------------

            if (reasons.isEmpty()) {

                score += 10;

                reasons.add(
                        "This flight matches current travel options"
                );
            }


            Map<String, Object> recommendation =
                    new HashMap<>();


            recommendation.put(
                    "targetType",
                    "FLIGHT"
            );

            recommendation.put(
                    "targetId",
                    flight.getId()
            );

            recommendation.put(
                    "title",
                    flight.getFlightName()
            );

            recommendation.put(
                    "from",
                    flight.getFrom()
            );

            recommendation.put(
                    "to",
                    flight.getTo()
            );

            recommendation.put(
                    "departureTime",
                    flight.getDepartureTime()
            );

            recommendation.put(
                    "arrivalTime",
                    flight.getArrivalTime()
            );

            recommendation.put(
                    "price",
                    flight.getPrice()
            );

            recommendation.put(
                    "availableSeats",
                    flight.getAvailableSeats()
            );

            recommendation.put(
                    "score",
                    score
            );

            recommendation.put(
                    "reason",
                    reasons.get(0)
            );

            recommendation.put(
                    "reasons",
                    reasons
            );


            recommendations.add(
                    recommendation
            );
        }


        // =====================================================
        // SORT
        // =====================================================

        recommendations.sort(
                (a, b) ->
                        Double.compare(
                                ((Number) b.get("score"))
                                        .doubleValue(),
                                ((Number) a.get("score"))
                                        .doubleValue()
                        )
        );


        // =====================================================
        // RETURN TOP 10
        // =====================================================

        if (recommendations.size() > 10) {

            return new ArrayList<>(
                    recommendations.subList(
                            0,
                            10
                    )
            );
        }


        return recommendations;
    }



    // =========================================================
    // CHECK WHETHER A FLIGHT IS IN THE FUTURE
    // =========================================================

    private boolean isFutureFlight(Flight flight) {

        if (flight.getDepartureTime() == null ||
                flight.getDepartureTime().isBlank()) {
            return false;
        }

        try {
            LocalDateTime departureTime =
                    LocalDateTime.parse(flight.getDepartureTime());

            return departureTime.isAfter(LocalDateTime.now());

        } catch (DateTimeParseException e) {
            return false;
        }
    }


    // =========================================================
    // COLLABORATIVE FILTERING
    // =========================================================

    private Set<String> findSimilarUsers(
            Users currentUser,
            List<Users> allUsers
    ) {

        Set<String> currentBookings =
                currentUser.getBookings()
                        .stream()
                        .filter(b ->
                                b != null &&
                                b.getBookingId() != null
                        )
                        .map(
                                Users.Booking::getBookingId
                        )
                        .collect(Collectors.toSet());


        Set<String> similarUsers =
                new HashSet<>();


        if (currentBookings.isEmpty()) {
            return similarUsers;
        }


        for (Users otherUser : allUsers) {

            if (otherUser.getId() == null) {
                continue;
            }

            if (otherUser.getId().equals(
                    currentUser.getId()
            )) {
                continue;
            }


            if (otherUser.getBookings() == null) {
                continue;
            }


            Set<String> otherBookings =
                    otherUser.getBookings()
                            .stream()
                            .filter(b ->
                                    b != null &&
                                    b.getBookingId() != null
                            )
                            .map(
                                    Users.Booking::getBookingId
                            )
                            .collect(Collectors.toSet());


            for (String bookingId :
                    currentBookings) {

                if (otherBookings.contains(
                        bookingId
                )) {

                    similarUsers.add(
                            otherUser.getId()
                    );

                    break;
                }
            }
        }


        return similarUsers;
    }


    // =========================================================
    // SIMILAR USERS → HOTEL
    // =========================================================

    private boolean hotelBookedBySimilarUser(
            String hotelId,
            Set<String> similarUserIds,
            List<Users> allUsers
    ) {

        for (Users user : allUsers) {

            if (!similarUserIds.contains(
                    user.getId()
            )) {
                continue;
            }

            if (user.getBookings() == null) {
                continue;
            }


            for (Users.Booking booking :
                    user.getBookings()) {

                if ("HOTEL".equalsIgnoreCase(
                        booking.getType()
                )
                        &&
                    hotelId.equals(
                            booking.getBookingId()
                    )) {

                    return true;
                }
            }
        }


        return false;
    }


    // =========================================================
    // SIMILAR USERS → FLIGHT
    // =========================================================

    private boolean flightBookedBySimilarUser(
            String flightId,
            Set<String> similarUserIds,
            List<Users> allUsers
    ) {

        for (Users user : allUsers) {

            if (!similarUserIds.contains(
                    user.getId()
            )) {
                continue;
            }

            if (user.getBookings() == null) {
                continue;
            }


            for (Users.Booking booking :
                    user.getBookings()) {

                if ("FLIGHT".equalsIgnoreCase(
                        booking.getType()
                )
                        &&
                    flightId.equals(
                            booking.getBookingId()
                    )) {

                    return true;
                }
            }
        }


        return false;
    }
}