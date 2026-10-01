package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.FlightStatusHistory;
import com.makemytrip.makemytrip.repositories.FlightStatusHistoryRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/flight-status/history")
@CrossOrigin(origins = "*")
public class FlightStatusHistoryController {

    @Autowired
    private FlightStatusHistoryRepository flightStatusHistoryRepository;


    /*
     * Get history for one flight
     */
    @GetMapping("/{flightId}")
    public ResponseEntity<List<FlightStatusHistory>> getHistory(
            @PathVariable String flightId) {

        List<FlightStatusHistory> history =
                flightStatusHistoryRepository
                        .findByFlightIdOrderByUpdatedAtDesc(
                                flightId
                        );

        return ResponseEntity.ok(history);
    }


    /*
     * TEMPORARY:
     * Clear all old flight status history.
     *
     * We will use this ONCE to remove
     * the incorrect 27 Sep history.
     */
    @DeleteMapping("/clear")
    public ResponseEntity<String> clearHistory() {

        flightStatusHistoryRepository.deleteAll();

        return ResponseEntity.ok(
                "All flight status history cleared successfully."
        );
    }
}