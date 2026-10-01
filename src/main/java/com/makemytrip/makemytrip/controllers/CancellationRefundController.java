package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.CancellationRefund;
import com.makemytrip.makemytrip.services.CancellationRefundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/cancellation")
@CrossOrigin(origins = "*")
public class CancellationRefundController {

    @Autowired
    private CancellationRefundService cancellationRefundService;

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelBooking(
            @RequestParam String userId,
            @RequestParam String bookingId,
            @RequestParam String reason) {

        try {

            CancellationRefund refund =
                    cancellationRefundService.cancelBooking(
                            userId,
                            bookingId,
                            reason
                    );

            return ResponseEntity.ok(refund);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));

        } catch (Exception e) {

            return ResponseEntity
                    .internalServerError()
                    .body(Map.of(
                            "message",
                            "Unable to cancel booking",
                            "error",
                            e.getMessage()
                    ));
        }
    }

    @GetMapping("/refund/{userId}/{bookingId}")
    public ResponseEntity<?> getRefundStatus(
            @PathVariable String userId,
            @PathVariable String bookingId) {

        try {

            Optional<CancellationRefund> refund =
                    cancellationRefundService.getRefundStatus(
                            userId,
                            bookingId
                    );

            if (refund.isEmpty()) {

                return ResponseEntity.ok(
                        Map.of("active", false)
                );
            }

            return ResponseEntity.ok(
                    Map.of(
                            "active", true,
                            "refund", refund.get()
                    )
            );

        } catch (Exception e) {

            return ResponseEntity
                    .internalServerError()
                    .body(Map.of(
                            "message",
                            "Unable to fetch refund status",
                            "error",
                            e.getMessage()
                    ));
        }
    }
}
