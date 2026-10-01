package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.services.PriceHistoryService;
import com.makemytrip.makemytrip.services.PricingService;
import com.makemytrip.makemytrip.services.PricingService.PricingResult;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pricing")
@CrossOrigin(origins = "*")
public class PricingController {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private PricingService pricingService;

    @Autowired
    private PriceHistoryService priceHistoryService;

    @GetMapping("/flight/{flightId}")
    public ResponseEntity<?> getFlightPrice(
            @PathVariable String flightId) {

        Flight flight = flightRepository
                .findById(flightId)
                .orElse(null);

        if (flight == null) {
            return ResponseEntity.notFound().build();
        }

        PricingResult result =
                pricingService.calculatePrice(flight);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/flight/{flightId}/history")
    public ResponseEntity<?> getFlightPriceHistory(
            @PathVariable String flightId) {

        Flight flight = flightRepository
                .findById(flightId)
                .orElse(null);

        if (flight == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                priceHistoryService.getHistory(flightId)
        );
    }
}