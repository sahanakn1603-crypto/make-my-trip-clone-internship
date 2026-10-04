package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.FlightSeat;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FlightSeatRepository
        extends MongoRepository<FlightSeat, String> {

    List<FlightSeat> findByFlightIdOrderBySeatNumberAsc(String flightId);

    Optional<FlightSeat> findByFlightIdAndSeatNumber(
            String flightId,
            String seatNumber
    );

    List<FlightSeat> findByFlightIdAndSeatNumberIn(
            String flightId,
            List<String> seatNumbers
    );
}
