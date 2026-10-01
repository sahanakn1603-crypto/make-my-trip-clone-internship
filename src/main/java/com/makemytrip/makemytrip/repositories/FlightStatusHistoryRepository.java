package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.FlightStatusHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FlightStatusHistoryRepository
        extends MongoRepository<FlightStatusHistory, String> {

    List<FlightStatusHistory> findByFlightIdOrderByUpdatedAtDesc(String flightId);
}
