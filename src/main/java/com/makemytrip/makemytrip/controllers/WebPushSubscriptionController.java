package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.WebPushSubscription;
import com.makemytrip.makemytrip.repositories.WebPushSubscriptionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/push")
@CrossOrigin(origins = "*")
public class WebPushSubscriptionController {

    @Autowired
    private WebPushSubscriptionRepository subscriptionRepository;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @RequestBody WebPushSubscription subscription) {

        if (subscription.getEndpoint() == null ||
                subscription.getEndpoint().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Push subscription endpoint is required.");
        }

        /*
         * Check whether this browser subscription
         * already exists.
         */
        var existing =
                subscriptionRepository
                        .findByEndpoint(subscription.getEndpoint());

        if (existing.isPresent()) {

            WebPushSubscription saved =
                    existing.get();

            saved.setP256dh(subscription.getP256dh());
            saved.setAuth(subscription.getAuth());

            subscriptionRepository.save(saved);

            return ResponseEntity.ok(saved);
        }

        /*
         * New browser subscription
         */
        WebPushSubscription saved =
                subscriptionRepository.save(subscription);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(
            @RequestParam String endpoint) {

        return subscriptionRepository
                .findByEndpoint(endpoint)
                .map(subscription -> {

                    subscriptionRepository.delete(subscription);

                    return ResponseEntity.ok(
                            "Push subscription removed."
                    );

                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }
}
