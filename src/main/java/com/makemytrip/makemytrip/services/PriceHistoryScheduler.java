package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PriceHistoryScheduler {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private PriceHistoryService priceHistoryService;

    @Scheduled(fixedRate = 30000)
    public void recordFlightPrices() {

        for (Flight flight : flightRepository.findAll()) {
            try {
                priceHistoryService.recordPrice(flight);
            } catch (Exception e) {
                System.out.println(
                        "Unable to record price history for flight "
                                + flight.getId()
                );
            }
        }
    }
}
