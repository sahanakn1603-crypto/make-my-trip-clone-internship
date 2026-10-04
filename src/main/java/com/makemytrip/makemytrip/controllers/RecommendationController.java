package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.RecommendationFeedback;
import com.makemytrip.makemytrip.repositories.RecommendationFeedbackRepository;
import com.makemytrip.makemytrip.services.RecommendationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private RecommendationFeedbackRepository feedbackRepository;


    // =========================================================
    // GET RECOMMENDATIONS BY EMAIL
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>>
    getRecommendations(
            @RequestParam String email
    ) {

        List<Map<String, Object>> recommendations =
                recommendationService
                        .getRecommendationsByEmail(email);

        return ResponseEntity.ok(
                recommendations
        );
    }


    // =========================================================
    // OLD USER-ID ENDPOINT
    // =========================================================
    // Kept for compatibility.

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>>
    getRecommendationsByUserId(
            @PathVariable String userId
    ) {

        List<Map<String, Object>> recommendations =
                recommendationService
                        .getRecommendations(userId);

        return ResponseEntity.ok(
                recommendations
        );
    }


    // =========================================================
    // SAVE FEEDBACK
    // =========================================================

    @PostMapping("/feedback")
    public ResponseEntity<RecommendationFeedback>
    saveFeedback(
            @RequestParam String userId,
            @RequestParam String targetType,
            @RequestParam String targetId,
            @RequestParam String feedback
    ) {

        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException(
                    "User ID is required"
            );
        }

        if (targetType == null ||
                targetType.isBlank()) {

            throw new IllegalArgumentException(
                    "Target type is required"
            );
        }

        if (targetId == null ||
                targetId.isBlank()) {

            throw new IllegalArgumentException(
                    "Target ID is required"
            );
        }


        String normalizedFeedback =
                feedback == null
                        ? ""
                        : feedback.trim().toUpperCase();


        if (!normalizedFeedback.equals(
                "HELPFUL"
        )
                &&
            !normalizedFeedback.equals(
                    "IRRELEVANT"
            )) {

            throw new IllegalArgumentException(
                    "Feedback must be HELPFUL or IRRELEVANT"
            );
        }


        // Check existing feedback.

        List<RecommendationFeedback>
                existingFeedback =
                feedbackRepository
                        .findByUserIdAndTargetTypeAndTargetId(
                                userId,
                                targetType,
                                targetId
                        );


        RecommendationFeedback
                feedbackRecord;


        if (!existingFeedback.isEmpty()) {

            // Update existing feedback.

            feedbackRecord =
                    existingFeedback.get(0);

        } else {

            // Create new feedback.

            feedbackRecord =
                    new RecommendationFeedback();

            feedbackRecord.setUserId(userId);

            feedbackRecord.setTargetType(
                    targetType
                            .trim()
                            .toUpperCase()
            );

            feedbackRecord.setTargetId(
                    targetId
            );
        }


        feedbackRecord.setFeedback(
                normalizedFeedback
        );


        RecommendationFeedback saved =
                feedbackRepository.save(
                        feedbackRecord
                );


        return ResponseEntity.ok(
                saved
        );
    }


    // =========================================================
    // GET USER FEEDBACK
    // =========================================================

    @GetMapping("/feedback/{userId}")
    public ResponseEntity<
            List<RecommendationFeedback>>
    getUserFeedback(
            @PathVariable String userId
    ) {

        return ResponseEntity.ok(
                feedbackRepository
                        .findByUserId(userId)
        );
    }
}