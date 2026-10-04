package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.FlightStatus;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.FlightStatusRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    /*
     * ============================================================
     * GENERATE FLIGHTS FOR ANY SELECTED FUTURE DATE
     * ============================================================
     *
     * Example:
     * POST
     * http://localhost:8080/flight-data/generate?date=2026-10-15
     *
     * The same flight schedule can be generated for:
     *
     * 2026-10-15
     * 2026-11-20
     * 2027-01-10
     * 2027-06-25
     *
     * etc.
     */

    @PostMapping("/generate")
    public ResponseEntity<String> generateFlights(
            @RequestParam String date) {

        LocalDate selectedDate;

        /*
         * --------------------------------------------------------
         * Validate date format
         * --------------------------------------------------------
         */
        try {
            selectedDate = LocalDate.parse(date);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Invalid date. Use YYYY-MM-DD format.");
        }

        /*
         * --------------------------------------------------------
         * Do not allow past dates
         * --------------------------------------------------------
         */
        if (selectedDate.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Cannot generate flights for a past date: " + date);
        }

        /*
         * --------------------------------------------------------
         * Get all existing flights
         * --------------------------------------------------------
         */
        List<Flight> existingFlights = flightRepository.findAll();

        /*
         * --------------------------------------------------------
         * Required flights for the selected date
         * --------------------------------------------------------
         *
         * Total:
         *
         * Bengaluru routes = 9
         * Delhi routes     = 9
         * Mumbai routes    = 7
         * Chennai routes   = 5
         *
         * Original route list = 29
         * Both directions = 58
         * --------------------------------------------------------
         */
        List<Flight> requiredFlights = new ArrayList<>();


        // ========================================================
        // BENGALURU
        // ========================================================

        // 1. Bengaluru -> Pune
        addFlight(
                requiredFlights,
                "IndiGo 6E201",
                "Bengaluru",
                "Pune",
                selectedDate,
                "06:00",
                "01:40",
                4200,
                120
        );

        // 2. Pune -> Bengaluru
        addFlight(
                requiredFlights,
                "IndiGo 6E202",
                "Pune",
                "Bengaluru",
                selectedDate,
                "08:30",
                "01:40",
                4200,
                120
        );

        // 3. Bengaluru -> Ahmedabad
        addFlight(
                requiredFlights,
                "IndiGo 6E203",
                "Bengaluru",
                "Ahmedabad",
                selectedDate,
                "06:30",
                "02:20",
                5200,
                120
        );

        // 4. Ahmedabad -> Bengaluru
        addFlight(
                requiredFlights,
                "IndiGo 6E204",
                "Ahmedabad",
                "Bengaluru",
                selectedDate,
                "09:30",
                "02:20",
                5200,
                120
        );

        // 5. Bengaluru -> Jaipur
        addFlight(
                requiredFlights,
                "IndiGo 6E205",
                "Bengaluru",
                "Jaipur",
                selectedDate,
                "07:00",
                "02:35",
                5600,
                120
        );

        // 6. Jaipur -> Bengaluru
        addFlight(
                requiredFlights,
                "IndiGo 6E206",
                "Jaipur",
                "Bengaluru",
                selectedDate,
                "10:30",
                "02:35",
                5600,
                120
        );

        // 7. Bengaluru -> Goa
        addFlight(
                requiredFlights,
                "IndiGo 6E207",
                "Bengaluru",
                "Goa",
                selectedDate,
                "07:30",
                "01:30",
                3500,
                120
        );

        // 8. Goa -> Bengaluru
        addFlight(
                requiredFlights,
                "IndiGo 6E208",
                "Goa",
                "Bengaluru",
                selectedDate,
                "10:00",
                "01:30",
                3500,
                120
        );

        // 9. Bengaluru -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E209",
                "Bengaluru",
                "Delhi",
                selectedDate,
                "08:00",
                "02:45",
                5500,
                120
        );

        // 10. Delhi -> Bengaluru
        addFlight(
                requiredFlights,
                "Air India AI410",
                "Delhi",
                "Bengaluru",
                selectedDate,
                "11:00",
                "02:45",
                5800,
                120
        );

        // 11. Bengaluru -> Mumbai
        addFlight(
                requiredFlights,
                "IndiGo 6E211",
                "Bengaluru",
                "Mumbai",
                selectedDate,
                "09:00",
                "01:45",
                4500,
                120
        );

        // 12. Mumbai -> Bengaluru
        addFlight(
                requiredFlights,
                "IndiGo 6E212",
                "Mumbai",
                "Bengaluru",
                selectedDate,
                "12:00",
                "01:45",
                4500,
                120
        );

        // 13. Bengaluru -> Hyderabad
        addFlight(
                requiredFlights,
                "IndiGo 6E213",
                "Bengaluru",
                "Hyderabad",
                selectedDate,
                "10:00",
                "00:10",
                2800,
                120
        );

        // 14. Hyderabad -> Bengaluru
        addFlight(
                requiredFlights,
                "IndiGo 6E214",
                "Hyderabad",
                "Bengaluru",
                selectedDate,
                "12:00",
                "00:10",
                2800,
                120
        );

        // 15. Bengaluru -> Chennai
        addFlight(
                requiredFlights,
                "Air India AI505",
                "Bengaluru",
                "Chennai",
                selectedDate,
                "10:30",
                "01:15",
                3200,
                120
        );

        // 16. Chennai -> Bengaluru
        addFlight(
                requiredFlights,
                "IndiGo 6E620",
                "Chennai",
                "Bengaluru",
                selectedDate,
                "13:00",
                "01:15",
                3200,
                120
        );

        // 17. Bengaluru -> Kolkata
        addFlight(
                requiredFlights,
                "IndiGo 6E217",
                "Bengaluru",
                "Kolkata",
                selectedDate,
                "11:00",
                "02:35",
                5700,
                120
        );

        // 18. Kolkata -> Bengaluru
        addFlight(
                requiredFlights,
                "IndiGo 6E218",
                "Kolkata",
                "Bengaluru",
                selectedDate,
                "15:00",
                "02:35",
                5700,
                120
        );


        // ========================================================
        // DELHI
        // ========================================================

        // 19. Delhi -> Mumbai
        addFlight(
                requiredFlights,
                "Air India AI202",
                "Delhi",
                "Mumbai",
                selectedDate,
                "06:00",
                "02:30",
                6200,
                120
        );

        // 20. Mumbai -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E750",
                "Mumbai",
                "Delhi",
                selectedDate,
                "09:00",
                "02:30",
                5400,
                120
        );

        // 21. Delhi -> Hyderabad
        addFlight(
                requiredFlights,
                "IndiGo 6E902",
                "Delhi",
                "Hyderabad",
                selectedDate,
                "07:00",
                "02:30",
                5100,
                120
        );

        // 22. Hyderabad -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E903",
                "Hyderabad",
                "Delhi",
                selectedDate,
                "11:00",
                "02:30",
                5100,
                120
        );

        // 23. Delhi -> Chennai
        addFlight(
                requiredFlights,
                "Air India AI710",
                "Delhi",
                "Chennai",
                selectedDate,
                "08:00",
                "02:40",
                6500,
                120
        );

        // 24. Chennai -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E830",
                "Chennai",
                "Delhi",
                selectedDate,
                "12:00",
                "02:40",
                5900,
                120
        );

        // 25. Delhi -> Kolkata
        addFlight(
                requiredFlights,
                "IndiGo 6E225",
                "Delhi",
                "Kolkata",
                selectedDate,
                "09:00",
                "02:15",
                4800,
                120
        );

        // 26. Kolkata -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E226",
                "Kolkata",
                "Delhi",
                selectedDate,
                "13:00",
                "02:15",
                4800,
                120
        );

        // 27. Delhi -> Pune
        addFlight(
                requiredFlights,
                "IndiGo 6E227",
                "Delhi",
                "Pune",
                selectedDate,
                "10:00",
                "02:15",
                5200,
                120
        );

        // 28. Pune -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E228",
                "Pune",
                "Delhi",
                selectedDate,
                "14:00",
                "02:15",
                5200,
                120
        );

        // 29. Delhi -> Ahmedabad
        addFlight(
                requiredFlights,
                "IndiGo 6E229",
                "Delhi",
                "Ahmedabad",
                selectedDate,
                "11:00",
                "01:45",
                4500,
                120
        );

        // 30. Ahmedabad -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E230",
                "Ahmedabad",
                "Delhi",
                selectedDate,
                "14:00",
                "01:45",
                4500,
                120
        );

        // 31. Delhi -> Jaipur
        addFlight(
                requiredFlights,
                "IndiGo 6E231",
                "Delhi",
                "Jaipur",
                selectedDate,
                "12:00",
                "01:10",
                3000,
                120
        );

        // 32. Jaipur -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E232",
                "Jaipur",
                "Delhi",
                selectedDate,
                "15:00",
                "01:10",
                3000,
                120
        );

        // 33. Delhi -> Goa
        addFlight(
                requiredFlights,
                "IndiGo 6E233",
                "Delhi",
                "Goa",
                selectedDate,
                "13:00",
                "02:40",
                6000,
                120
        );

        // 34. Goa -> Delhi
        addFlight(
                requiredFlights,
                "IndiGo 6E234",
                "Goa",
                "Delhi",
                selectedDate,
                "17:00",
                "02:40",
                6000,
                120
        );


        // ========================================================
        // MUMBAI
        // ========================================================

        // 35. Mumbai -> Hyderabad
        addFlight(
                requiredFlights,
                "IndiGo 6E6112",
                "Mumbai",
                "Hyderabad",
                selectedDate,
                "06:00",
                "01:40",
                5200,
                120
        );

        // 36. Hyderabad -> Mumbai
        addFlight(
                requiredFlights,
                "IndiGo 6E6113",
                "Hyderabad",
                "Mumbai",
                selectedDate,
                "09:00",
                "01:40",
                5000,
                120
        );

        // 37. Mumbai -> Chennai
        addFlight(
                requiredFlights,
                "IndiGo 6E235",
                "Mumbai",
                "Chennai",
                selectedDate,
                "07:00",
                "01:45",
                4700,
                120
        );

        // 38. Chennai -> Mumbai
        addFlight(
                requiredFlights,
                "IndiGo 6E236",
                "Chennai",
                "Mumbai",
                selectedDate,
                "11:00",
                "01:45",
                4700,
                120
        );

        // 39. Mumbai -> Kolkata
        addFlight(
                requiredFlights,
                "IndiGo 6E237",
                "Mumbai",
                "Kolkata",
                selectedDate,
                "08:00",
                "02:35",
                6000,
                120
        );

        // 40. Kolkata -> Mumbai
        addFlight(
                requiredFlights,
                "IndiGo 6E238",
                "Kolkata",
                "Mumbai",
                selectedDate,
                "12:00",
                "02:35",
                6000,
                120
        );

        // 41. Mumbai -> Ahmedabad
        addFlight(
                requiredFlights,
                "IndiGo 6E239",
                "Mumbai",
                "Ahmedabad",
                selectedDate,
                "09:00",
                "01:10",
                3500,
                120
        );

        // 42. Ahmedabad -> Mumbai
        addFlight(
                requiredFlights,
                "IndiGo 6E240",
                "Ahmedabad",
                "Mumbai",
                selectedDate,
                "12:00",
                "01:10",
                3500,
                120
        );

        // 43. Mumbai -> Jaipur
        addFlight(
                requiredFlights,
                "IndiGo 6E241",
                "Mumbai",
                "Jaipur",
                selectedDate,
                "10:00",
                "02:00",
                5000,
                120
        );

        // 44. Jaipur -> Mumbai
        addFlight(
                requiredFlights,
                "IndiGo 6E242",
                "Jaipur",
                "Mumbai",
                selectedDate,
                "14:00",
                "02:00",
                5000,
                120
        );

        // 45. Mumbai -> Goa
        addFlight(
                requiredFlights,
                "IndiGo 6E243",
                "Mumbai",
                "Goa",
                selectedDate,
                "11:00",
                "01:30",
                3500,
                120
        );

        // 46. Goa -> Mumbai
        addFlight(
                requiredFlights,
                "IndiGo 6E244",
                "Goa",
                "Mumbai",
                selectedDate,
                "14:00",
                "01:30",
                3500,
                120
        );


        // ========================================================
        // CHENNAI
        // ========================================================

        // 47. Chennai -> Hyderabad
        addFlight(
                requiredFlights,
                "IndiGo 6E245",
                "Chennai",
                "Hyderabad",
                selectedDate,
                "06:00",
                "01:25",
                3200,
                120
        );

        // 48. Hyderabad -> Chennai
        addFlight(
                requiredFlights,
                "IndiGo 6E246",
                "Hyderabad",
                "Chennai",
                selectedDate,
                "09:00",
                "01:25",
                3200,
                120
        );

        // 49. Chennai -> Kolkata
        addFlight(
                requiredFlights,
                "IndiGo 6E247",
                "Chennai",
                "Kolkata",
                selectedDate,
                "07:00",
                "02:30",
                5200,
                120
        );

        // 50. Kolkata -> Chennai
        addFlight(
                requiredFlights,
                "IndiGo 6E248",
                "Kolkata",
                "Chennai",
                selectedDate,
                "11:00",
                "02:30",
                5200,
                120
        );

        // 51. Chennai -> Pune
        addFlight(
                requiredFlights,
                "IndiGo 6E249",
                "Chennai",
                "Pune",
                selectedDate,
                "08:00",
                "01:35",
                4000,
                120
        );

        // 52. Pune -> Chennai
        addFlight(
                requiredFlights,
                "IndiGo 6E250",
                "Pune",
                "Chennai",
                selectedDate,
                "11:00",
                "01:35",
                4000,
                120
        );

        // 53. Chennai -> Ahmedabad
        addFlight(
                requiredFlights,
                "IndiGo 6E251",
                "Chennai",
                "Ahmedabad",
                selectedDate,
                "09:00",
                "02:15",
                5500,
                120
        );

        // 54. Ahmedabad -> Chennai
        addFlight(
                requiredFlights,
                "IndiGo 6E252",
                "Ahmedabad",
                "Chennai",
                selectedDate,
                "13:00",
                "02:15",
                5500,
                120
        );

        // 55. Chennai -> Jaipur
        addFlight(
                requiredFlights,
                "IndiGo 6E253",
                "Chennai",
                "Jaipur",
                selectedDate,
                "10:00",
                "02:30",
                5700,
                120
        );

        // 56. Jaipur -> Chennai
        addFlight(
                requiredFlights,
                "IndiGo 6E254",
                "Jaipur",
                "Chennai",
                selectedDate,
                "14:00",
                "02:30",
                5700,
                120
        );

        // 57. Chennai -> Goa
        addFlight(
                requiredFlights,
                "IndiGo 6E255",
                "Chennai",
                "Goa",
                selectedDate,
                "11:00",
                "01:30",
                3800,
                120
        );

        // 58. Goa -> Chennai
        addFlight(
                requiredFlights,
                "IndiGo 6E256",
                "Goa",
                "Chennai",
                selectedDate,
                "15:00",
                "01:30",
                3800,
                120
        );


        // ========================================================
        // SAVE ONLY MISSING FLIGHTS
        // ========================================================

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


        // ========================================================
        // SAVE FLIGHTS
        // ========================================================

        List<Flight> savedFlights =
                flightRepository.saveAll(flightsToSave);


        // ========================================================
        // CREATE LIVE STATUS FOR NEW FLIGHTS
        // ========================================================

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


        if (!statuses.isEmpty()) {
            flightStatusRepository.saveAll(statuses);
        }


        // ========================================================
        // RESPONSE
        // ========================================================

        if (savedFlights.isEmpty()) {

            return ResponseEntity.ok(
                    "All 58 flights already exist for " + date
            );
        }

        return ResponseEntity.ok(
                savedFlights.size()
                        + " flights added for "
                        + date
                        + " with live flight status"
        );
    }


    /*
     * ============================================================
     * HELPER METHOD
     * ============================================================
     *
     * departureTime = HH:mm
     * duration       = HH:mm
     *
     * Example:
     *
     * departure = 10:00
     * duration  = 02:45
     *
     * arrival = 12:45
     */

    private void addFlight(
            List<Flight> flights,
            String flightName,
            String from,
            String to,
            LocalDate date,
            String departureTime,
            String duration,
            double price,
            int seats) {

        LocalTime departure = LocalTime.parse(departureTime);

        Duration flightDuration = parseDuration(duration);

        LocalDateTime departureDateTime =
                LocalDateTime.of(date, departure);

        LocalDateTime arrivalDateTime =
                departureDateTime.plus(flightDuration);

        Flight flight = createFlight(
                flightName,
                from,
                to,
                departureDateTime,
                arrivalDateTime,
                price,
                seats
        );

        flights.add(flight);
    }


    /*
     * ============================================================
     * PARSE FLIGHT DURATION
     * ============================================================
     *
     * "01:40" -> 1 hour 40 minutes
     * "02:45" -> 2 hours 45 minutes
     * "00:10" -> 10 minutes
     */

    private Duration parseDuration(String duration) {

        String[] parts = duration.split(":");

        long hours = Long.parseLong(parts[0]);

        long minutes = Long.parseLong(parts[1]);

        return Duration.ofHours(hours)
                .plusMinutes(minutes);
    }


    /*
     * ============================================================
     * CREATE FLIGHT OBJECT
     * ============================================================
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