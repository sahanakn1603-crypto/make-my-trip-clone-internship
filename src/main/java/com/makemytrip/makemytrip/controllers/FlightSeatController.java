package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.FlightSeat;
import com.makemytrip.makemytrip.services.FlightSeatService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/flight-seats")
@CrossOrigin(origins = "*")
public class FlightSeatController {

    @Autowired
    private FlightSeatService flightSeatService;


    @GetMapping("/{flightId}")
    public List<FlightSeat> getSeats(
            @PathVariable String flightId
    ) {

        return flightSeatService.getSeats(flightId);
    }
}