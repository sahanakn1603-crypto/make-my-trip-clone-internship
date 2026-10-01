package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.FlightStatus;
import com.makemytrip.makemytrip.repositories.FlightStatusRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/flight-status")
@CrossOrigin(origins = "*")
public class FlightStatusController {

    @Autowired
    private FlightStatusRepository flightStatusRepository;

    @PostMapping
    public FlightStatus createStatus(@RequestBody FlightStatus flightStatus) {
        return flightStatusRepository.save(flightStatus);
    }

    @GetMapping("/{flightId}")
    public ResponseEntity<FlightStatus> getStatus(@PathVariable String flightId) {

        return flightStatusRepository.findByFlightId(flightId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{flightId}")
    public ResponseEntity<FlightStatus> updateStatus(
            @PathVariable String flightId,
            @RequestBody FlightStatus updatedStatus) {

        return flightStatusRepository.findByFlightId(flightId)
                .map(existingStatus -> {

                    existingStatus.setStatus(updatedStatus.getStatus());
                    existingStatus.setDelayMinutes(updatedStatus.getDelayMinutes());
                    existingStatus.setDelayReason(updatedStatus.getDelayReason());

                    existingStatus.setScheduledDeparture(
                            updatedStatus.getScheduledDeparture()
                    );

                    existingStatus.setEstimatedDeparture(
                            updatedStatus.getEstimatedDeparture()
                    );

                    existingStatus.setScheduledArrival(
                            updatedStatus.getScheduledArrival()
                    );

                    existingStatus.setEstimatedArrival(
                            updatedStatus.getEstimatedArrival()
                    );

                    FlightStatus savedStatus =
                            flightStatusRepository.save(existingStatus);

                    return ResponseEntity.ok(savedStatus);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}