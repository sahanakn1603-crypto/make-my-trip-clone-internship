package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.PriceFreeze;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.PriceFreezeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PriceFreezeService {

    private static final int FREEZE_MINUTES = 30;

    @Autowired
    private PriceFreezeRepository priceFreezeRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private PricingService pricingService;

    public PriceFreeze createOrGetFreeze(String userId, String flightId) {

        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }

        if (flightId == null || flightId.isBlank()) {
            throw new IllegalArgumentException("Flight ID is required");
        }

        Optional<PriceFreeze> existing =
                priceFreezeRepository
                        .findFirstByUserIdAndFlightIdAndStatusOrderByCreatedAtDesc(
                                userId,
                                flightId,
                                "ACTIVE"
                        );

        if (existing.isPresent()) {

            PriceFreeze freeze = existing.get();

            if (freeze.getExpiresAt() != null &&
                    freeze.getExpiresAt().isAfter(LocalDateTime.now())) {

                return freeze;
            }

            freeze.setStatus("EXPIRED");
            priceFreezeRepository.save(freeze);
        }

        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Flight not found"));

        double currentDynamicPrice =
                pricingService.calculatePrice(flight).getDynamicPrice();

        LocalDateTime now = LocalDateTime.now();

        PriceFreeze freeze = new PriceFreeze();

        freeze.setUserId(userId);
        freeze.setFlightId(flightId);
        freeze.setLockedPrice(currentDynamicPrice);
        freeze.setCreatedAt(now);
        freeze.setExpiresAt(now.plusMinutes(FREEZE_MINUTES));
        freeze.setStatus("ACTIVE");

        return priceFreezeRepository.save(freeze);
    }

    public Optional<PriceFreeze> getActiveFreeze(
            String userId,
            String flightId) {

        Optional<PriceFreeze> freeze =
                priceFreezeRepository
                        .findFirstByUserIdAndFlightIdAndStatusOrderByCreatedAtDesc(
                                userId,
                                flightId,
                                "ACTIVE"
                        );

        if (freeze.isEmpty()) {
            return Optional.empty();
        }

        PriceFreeze current = freeze.get();

        if (current.getExpiresAt() == null ||
                !current.getExpiresAt().isAfter(LocalDateTime.now())) {

            current.setStatus("EXPIRED");
            priceFreezeRepository.save(current);

            return Optional.empty();
        }

        return Optional.of(current);
    }
}
