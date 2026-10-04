package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.repositories.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserServices {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // =========================
    // LOGIN
    // =========================

    public Users login(String email, String password) {

        Users user = userRepository.findByEmail(email);

        if (user != null &&
                passwordEncoder.matches(password, user.getPassword())) {

            return user;
        }

        return null;
    }

    // =========================
    // SIGNUP
    // =========================

    public Users signup(Users user) {

        if (userRepository.findByEmail(user.getEmail()) != null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        if (user.getRole() == null) {
            user.setRole("USER");
        }

        return userRepository.save(user);
    }

    // =========================
    // GET USER BY EMAIL
    // =========================

    public Users getUserByEmail(String email) {

        return userRepository.findByEmail(email);
    }

    // =========================
    // EDIT PROFILE
    // =========================

    public Users editprofile(
            String id,
            Users updatedUser
    ) {

        Users user = userRepository
                .findById(id)
                .orElse(null);

        if (user != null) {

            user.setFirstName(
                    updatedUser.getFirstName()
            );

            user.setLastName(
                    updatedUser.getLastName()
            );

            user.setPhoneNumber(
                    updatedUser.getPhoneNumber()
            );

            return userRepository.save(user);
        }

        return null;
    }

    // =========================
    // SAVE PREFERRED SEAT
    // =========================

    public Users savePreferredSeat(
            String userId,
            String preferredSeat
    ) {

        Users user = userRepository
                .findById(userId)
                .orElse(null);

        if (user == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found"
            );
        }

        if (preferredSeat == null ||
                preferredSeat.trim().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Preferred seat cannot be empty"
            );
        }

        user.setPreferredSeat(
                preferredSeat.trim().toUpperCase()
        );

        return userRepository.save(user);
    }
}
