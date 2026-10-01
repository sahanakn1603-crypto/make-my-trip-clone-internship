package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.FlightStatus;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.FlightStatusRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/flight-data")
@CrossOrigin(origins = "*")
public class FlightDataController {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private FlightStatusRepository flightStatusRepository;

    @PostMapping("/generate")
    public ResponseEntity<String> generateFlights(
            @RequestParam String date) {

        LocalDate selectedDate;

        try {
            selectedDate = LocalDate.parse(date);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Invalid date. Use YYYY-MM-DD format.");
        }

        /*
         * Get all existing flights.
         */
        List<Flight> existingFlights = flightRepository.findAll();

        /*
         * Create the complete list of flights that
         * should exist for the selected date.
         */
        List<Flight> requiredFlights = new ArrayList<>();

        // ---------------------------------------------------------
        // 1. Delhi -> Bengaluru
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "Air India AI404",
                "Delhi",
                "Bengaluru",
                selectedDate.atTime(9, 0),
                selectedDate.atTime(11, 45),
                5800,
                110
        ));

        // ---------------------------------------------------------
        // 2. Bengaluru -> Delhi
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E101",
                "Bengaluru",
                "Delhi",
                selectedDate.atTime(10, 0),
                selectedDate.atTime(12, 45),
                5500,
                120
        ));

        // ---------------------------------------------------------
        // 3. Bengaluru -> Mumbai
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E412",
                "Bengaluru",
                "Mumbai",
                selectedDate.atTime(11, 30),
                selectedDate.atTime(13, 20),
                4500,
                90
        ));

        // ---------------------------------------------------------
        // 4. Mumbai -> Delhi
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E750",
                "Mumbai",
                "Delhi",
                selectedDate.atTime(12, 0),
                selectedDate.atTime(14, 5),
                5400,
                90
        ));

        // ---------------------------------------------------------
        // 5. Bengaluru -> Chennai
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "Air India AI505",
                "Bengaluru",
                "Chennai",
                selectedDate.atTime(13, 0),
                selectedDate.atTime(14, 0),
                3200,
                100
        ));

        // ---------------------------------------------------------
        // 6. Delhi -> Mumbai
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "Air India AI202",
                "Delhi",
                "Mumbai",
                selectedDate.atTime(14, 0),
                selectedDate.atTime(16, 15),
                6200,
                100
        ));

        // ---------------------------------------------------------
        // 7. Mumbai -> Hyderabad
        // NEW ROUTE
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E6112",
                "Mumbai",
                "Hyderabad",
                selectedDate.atTime(14, 30),
                selectedDate.atTime(16, 10),
                5200,
                100
        ));

        // ---------------------------------------------------------
        // 8. Delhi -> Chennai
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "Air India AI710",
                "Delhi",
                "Chennai",
                selectedDate.atTime(15, 0),
                selectedDate.atTime(17, 50),
                6500,
                85
        ));

        // ---------------------------------------------------------
        // 9. Hyderabad -> Mumbai
        // NEW ROUTE
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E6113",
                "Hyderabad",
                "Mumbai",
                selectedDate.atTime(16, 30),
                selectedDate.atTime(18, 10),
                5000,
                100
        ));

        // ---------------------------------------------------------
        // 10. Chennai -> Bengaluru
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E620",
                "Chennai",
                "Bengaluru",
                selectedDate.atTime(16, 0),
                selectedDate.atTime(17, 0),
                3100,
                95
        ));

        // ---------------------------------------------------------
        // 11. Hyderabad -> Delhi
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E902",
                "Hyderabad",
                "Delhi",
                selectedDate.atTime(17, 0),
                selectedDate.atTime(19, 15),
                5100,
                100
        ));

        // ---------------------------------------------------------
        // 12. Mumbai -> Bengaluru
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E305",
                "Mumbai",
                "Bengaluru",
                selectedDate.atTime(18, 30),
                selectedDate.atTime(20, 15),
                4800,
                80
        ));

        // ---------------------------------------------------------
        // 13. Chennai -> Delhi
        // ---------------------------------------------------------
        requiredFlights.add(createFlight(
                "IndiGo 6E830",
                "Chennai",
                "Delhi",
                selectedDate.atTime(19, 0),
                selectedDate.atTime(21, 50),
                5900,
                90
        ));

        /*
         * ---------------------------------------------------------
         * ONLY SAVE MISSING FLIGHTS
         * ---------------------------------------------------------
         *
         * This is important.
         *
         * If flights for the date already exist, we don't create
         * duplicates. We only add routes that are missing.
         */

        List<Flight> flightsToSave = new ArrayList<>();

        for (Flight requiredFlight : requiredFlights) {

            boolean alreadyExists = existingFlights.stream()
                    .anyMatch(existingFlight ->
                            existingFlight.getFlightName() != null &&
                            existingFlight.getDepartureTime() != null &&
                            existingFlight.getFlightName()
                                    .equals(requiredFlight.getFlightName()) &&
                            existingFlight.getDepartureTime()
                                    .equals(requiredFlight.getDepartureTime())
                    );

            if (!alreadyExists) {
                flightsToSave.add(requiredFlight);
            }
        }

        /*
         * Save only missing flights.
         */
        List<Flight> savedFlights =
                flightRepository.saveAll(flightsToSave);

        /*
         * ---------------------------------------------------------
         * CREATE LIVE STATUS FOR NEW FLIGHTS
         * ---------------------------------------------------------
         */

        List<FlightStatus> statuses = new ArrayList<>();

        for (Flight flight : savedFlights) {

            FlightStatus status = new FlightStatus();

            status.setFlightId(flight.getId());

            status.setStatus("ON_TIME");

            status.setDelayMinutes(0);

            status.setDelayReason("");

            status.setScheduledDeparture(
                    flight.getDepartureTime()
            );

            status.setEstimatedDeparture(
                    flight.getDepartureTime()
            );

            status.setScheduledArrival(
                    flight.getArrivalTime()
            );

            status.setEstimatedArrival(
                    flight.getArrivalTime()
            );

            statuses.add(status);
        }

        /*
         * Save live status records.
         */
        if (!statuses.isEmpty()) {
            flightStatusRepository.saveAll(statuses);
        }

        /*
         * ---------------------------------------------------------
         * RESPONSE
         * ---------------------------------------------------------
         */

        if (savedFlights.isEmpty()) {

            return ResponseEntity.ok(
                    "All flights already exist for " + date
            );
        }

        return ResponseEntity.ok(
                savedFlights.size()
                        + " missing flights added for "
                        + date
                        + " with live flight status"
        );
    }

    /*
     * ---------------------------------------------------------
     * CREATE FLIGHT
     * ---------------------------------------------------------
     */

    private Flight createFlight(
            String flightName,
            String from,
            String to,
            LocalDateTime departure,
            LocalDateTime arrival,
            double price,
            int seats) {

        Flight flight = new Flight();

        flight.setFlightName(flightName);

        flight.setFrom(from);

        flight.setTo(to);

        flight.setDepartureTime(
                departure.toString()
        );

        flight.setArrivalTime(
                arrival.toString()
        );

        flight.setPrice(price);

        flight.setAvailableSeats(seats);

        return flight;
    }
}