package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.services.BookingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/booking")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping("/flight")
    public Users.Booking bookFlight(
            @RequestParam String userId,
            @RequestParam String flightId,
            @RequestParam int seats,
            @RequestParam double price,
            @RequestParam(required = false, defaultValue = "") String date) {

        return bookingService.bookFlight(
                userId,
                flightId,
                seats,
                price,
                date
        );
    }

    @PostMapping("/hotel")
    public Users.Booking bookhotel(
            @RequestParam String userId,
            @RequestParam String hotelId,
            @RequestParam int rooms,
            @RequestParam double price,
            @RequestParam(defaultValue = "STANDARD") String roomType,
            @RequestParam(required = false) String date) {

        return bookingService.bookhotel(
                userId,
                hotelId,
                rooms,
                price,
                roomType,
                date
        );
    }
}
