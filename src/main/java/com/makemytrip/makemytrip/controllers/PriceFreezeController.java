package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.PriceFreeze;
import com.makemytrip.makemytrip.services.PriceFreezeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/pricing")
@CrossOrigin(origins = "*")
public class PriceFreezeController {

    @Autowired
    private PriceFreezeService priceFreezeService;

    @PostMapping("/freeze")
    public ResponseEntity<?> freezePrice(
            @RequestParam String userId,
            @RequestParam String flightId) {

        try {

            PriceFreeze freeze =
                    priceFreezeService.createOrGetFreeze(
                            userId,
                            flightId
                    );

            return ResponseEntity.ok(freeze);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest()
                    .body(e.getMessage());
        }
    }

    @GetMapping("/freeze/{userId}/{flightId}")
    public ResponseEntity<?> getActiveFreeze(
            @PathVariable String userId,
            @PathVariable String flightId) {

        Optional<PriceFreeze> freeze =
                priceFreezeService.getActiveFreeze(
                        userId,
                        flightId
                );

        if (freeze.isEmpty()) {

            return ResponseEntity.ok(
                    Map.of(
                            "active", false,
                            "message", "No active price freeze"
                    )
            );
        }

        Map<String, Object> response = new HashMap<>();

        response.put("active", true);
        response.put("freeze", freeze.get());

        return ResponseEntity.ok(response);
    }
}
