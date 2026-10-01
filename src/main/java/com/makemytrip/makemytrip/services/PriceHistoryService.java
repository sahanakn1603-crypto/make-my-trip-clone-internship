package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.PriceHistory;
import com.makemytrip.makemytrip.repositories.PriceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PriceHistoryService {

    @Autowired
    private PriceHistoryRepository priceHistoryRepository;

    @Autowired
    private PricingService pricingService;

    public void recordPrice(Flight flight) {

        PricingService.PricingResult pricing =
                pricingService.calculatePrice(flight);

        PriceHistory history = new PriceHistory(
                flight.getId(),
                pricing.getBasePrice(),
                pricing.getDynamicPrice(),
                pricing.getDemandMultiplier(),
                pricing.getPeakMultiplier(),
                pricing.getHolidayMultiplier(),
                LocalDateTime.now()
        );

        priceHistoryRepository.save(history);
    }

    public List<PriceHistory> getHistory(String flightId) {
        return priceHistoryRepository
                .findByFlightIdOrderByRecordedAtAsc(flightId);
    }
}
