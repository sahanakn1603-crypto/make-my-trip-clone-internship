package com.makemytrip.makemytrip.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.services.UserServices;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserServices userServices;

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public Users login(
            @RequestParam String email,
            @RequestParam String password
    ) {

        return userServices.login(
                email,
                password
        );
    }

    // =========================
    // SIGNUP
    // =========================

    @PostMapping("/signup")
    public ResponseEntity<Users> signup(
            @RequestBody Users user
    ) {

        return ResponseEntity.ok(
                userServices.signup(user)
        );
    }

    // =========================
    // GET USER BY EMAIL
    // =========================

    @GetMapping("/email")
    public ResponseEntity<Users> getuserbyemail(
            @RequestParam String email
    ) {

        Users user =
                userServices.getUserByEmail(email);

        if (user != null) {
            return ResponseEntity.ok(user);
        }

        return ResponseEntity.notFound().build();
    }

    // =========================
    // EDIT PROFILE
    // =========================

    @PostMapping("/edit")
    public Users editprofile(
            @RequestParam String id,
            @RequestBody Users updatedUser
    ) {

        return userServices.editprofile(
                id,
                updatedUser
        );
    }

    // =========================
    // SAVE PREFERRED SEAT
    // =========================

    @PutMapping("/preferred-seat")
    public ResponseEntity<Users> savePreferredSeat(
            @RequestParam String userId,
            @RequestParam String preferredSeat
    ) {

        Users updatedUser =
                userServices.savePreferredSeat(
                        userId,
                        preferredSeat
                );

        return ResponseEntity.ok(updatedUser);
    }
}