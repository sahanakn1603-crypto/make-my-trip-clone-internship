package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.FlightSeat;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.FlightSeatRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class FlightSeatService {

    @Autowired
    private FlightSeatRepository flightSeatRepository;

    @Autowired
    private FlightRepository flightRepository;


    /*
     * Return seats for a flight.
     *
     * If the flight does not have a seat map yet,
     * create one automatically.
     */
    public List<FlightSeat> getSeats(String flightId) {

        List<FlightSeat> existing =
                flightSeatRepository
                        .findByFlightIdOrderBySeatNumberAsc(flightId);

        if (!existing.isEmpty()) {
            return existing;
        }

        Optional<Flight> flightOptional =
                flightRepository.findById(flightId);

        if (flightOptional.isEmpty()) {
            throw new RuntimeException("Flight not found");
        }

        Flight flight = flightOptional.get();

        int availableSeats = flight.getAvailableSeats();

        /*
         * Make a minimum 120-seat map.
         * The number is expanded if necessary.
         */
        int capacity = Math.max(
                120,
                ((availableSeats + 3) / 4) * 4
        );

        int alreadyOccupied = capacity - availableSeats;

        if (alreadyOccupied < 0) {
            alreadyOccupied = 0;
        }

        List<FlightSeat> seats = new ArrayList<>();

        String[] columns = {"A", "B", "C", "D"};

        for (int i = 1; i <= capacity / 4; i++) {

            for (String column : columns) {

                FlightSeat seat = new FlightSeat();

                String seatNumber = i + column;

                seat.setFlightId(flightId);
                seat.setSeatNumber(seatNumber);

                /*
                 * First three rows are premium.
                 */
                if (i <= 3) {
                    seat.setSeatType("PREMIUM");
                    seat.setPrice(500);
                } else {
                    seat.setSeatType("STANDARD");
                    seat.setPrice(0);
                }

                /*
                 * Mark some seats occupied so that
                 * the seat map matches the existing
                 * availableSeats count.
                 */
                int seatIndex = ((i - 1) * 4)
                        + java.util.Arrays.asList(columns).indexOf(column);

                if (seatIndex >= capacity - alreadyOccupied) {
                    seat.setStatus("BOOKED");
                } else {
                    seat.setStatus("AVAILABLE");
                }

                seats.add(seat);
            }
        }

        return flightSeatRepository.saveAll(seats);
    }


    /*
     * Validate and book selected seats.
     */
    public double bookSeats(
            String flightId,
            List<String> selectedSeats
    ) {

        if (selectedSeats == null ||
                selectedSeats.isEmpty()) {

            throw new RuntimeException(
                    "Please select at least one seat"
            );
        }

        List<FlightSeat> seats =
                flightSeatRepository
                        .findByFlightIdAndSeatNumberIn(
                                flightId,
                                selectedSeats
                        );

        if (seats.size() != selectedSeats.size()) {
            throw new RuntimeException(
                    "One or more selected seats do not exist"
            );
        }

        double upgradeAmount = 0;

        for (FlightSeat seat : seats) {

            if (!"AVAILABLE".equals(seat.getStatus())) {

                throw new RuntimeException(
                        "Seat " + seat.getSeatNumber()
                                + " is no longer available"
                );
            }

            upgradeAmount += seat.getPrice();
        }

        /*
         * Mark seats as booked.
         */
        for (FlightSeat seat : seats) {
            seat.setStatus("BOOKED");
        }

        flightSeatRepository.saveAll(seats);

        return upgradeAmount;
    }


    /*
     * Release seats when a flight booking is cancelled.
     *
     * This will be used later when we connect
     * Task 3 cancellation with Task 4.
     */
    public void releaseSeats(
            String flightId,
            List<String> selectedSeats
    ) {

        if (selectedSeats == null ||
                selectedSeats.isEmpty()) {
            return;
        }

        List<FlightSeat> seats =
                flightSeatRepository
                        .findByFlightIdAndSeatNumberIn(
                                flightId,
                                selectedSeats
                        );

        for (FlightSeat seat : seats) {
            seat.setStatus("AVAILABLE");
        }

        flightSeatRepository.saveAll(seats);
    }
}
