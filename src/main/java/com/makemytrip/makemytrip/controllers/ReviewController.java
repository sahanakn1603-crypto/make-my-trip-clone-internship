package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Review;
import com.makemytrip.makemytrip.services.ReviewService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;


    // =====================================================
    // CREATE REVIEW
    // =====================================================

    @PostMapping
    public ResponseEntity<Review> createReview(
            @RequestBody ReviewRequest request
    ) {

        Review review =
                reviewService.createReview(
                        request.getUserId(),
                        request.getUserName(),
                        request.getTargetType(),
                        request.getTargetId(),
                        request.getRating(),
                        request.getReviewText(),
                        request.getPhotoUrls()
                );

        return ResponseEntity.ok(review);
    }


    // =====================================================
    // GET REVIEWS
    // =====================================================

    @GetMapping
    public ResponseEntity<List<Review>> getReviews(
            @RequestParam String targetType,
            @RequestParam String targetId,
            @RequestParam(defaultValue = "newest") String sort
    ) {

        return ResponseEntity.ok(
                reviewService.getReviews(
                        targetType,
                        targetId,
                        sort
                )
        );
    }


    // =====================================================
    // UPLOAD REVIEW PHOTO
    // =====================================================

    @PostMapping("/upload-photo")
    public ResponseEntity<String> uploadReviewPhoto(
            @RequestParam("file") MultipartFile file
    ) {

        try {

            if (file == null || file.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body("No file selected");
            }

            String originalName =
                    file.getOriginalFilename();

            String extension = "";

            if (originalName != null &&
                    originalName.contains(".")) {

                extension =
                        originalName.substring(
                                originalName.lastIndexOf(".")
                        );
            }

            String fileName =
                    UUID.randomUUID() + extension;

            Path uploadDirectory =
                    Paths.get("uploads/reviews");

            Files.createDirectories(
                    uploadDirectory
            );

            Path filePath =
                    uploadDirectory.resolve(fileName);

            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return ResponseEntity.ok(
                    "/reviews/photo/" + fileName
            );

        } catch (IOException e) {

            return ResponseEntity
                    .internalServerError()
                    .body(
                            "Unable to upload review photo"
                    );
        }
    }


    // =====================================================
    // SERVE REVIEW PHOTO
    // =====================================================

    @GetMapping("/photo/{fileName}")
    public ResponseEntity<byte[]> getReviewPhoto(
            @PathVariable String fileName
    ) {

        try {

            Path filePath =
                    Paths.get("uploads/reviews")
                            .resolve(fileName)
                            .normalize();

            if (!Files.exists(filePath)) {
                return ResponseEntity
                        .notFound()
                        .build();
            }

            byte[] image =
                    Files.readAllBytes(filePath);

            String contentType =
                    Files.probeContentType(filePath);

            if (contentType == null) {
                contentType =
                        "application/octet-stream";
            }

            return ResponseEntity
                    .ok()
                    .header(
                            "Content-Type",
                            contentType
                    )
                    .body(image);

        } catch (IOException e) {

            return ResponseEntity
                    .internalServerError()
                    .build();
        }
    }


    // =====================================================
    // ADD PHOTOS TO EXISTING REVIEW
    // =====================================================

    @PutMapping("/{reviewId}/photos")
    public ResponseEntity<Review> addReviewPhotos(
            @PathVariable String reviewId,
            @RequestBody AddReviewPhotosRequest request
    ) {

        Review review =
                reviewService.addReviewPhotos(
                        reviewId,
                        request.getUserId(),
                        request.getPhotoUrls()
                );

        return ResponseEntity.ok(review);
    }


    // =====================================================
    // HELPFUL
    // =====================================================

    @PutMapping("/{reviewId}/helpful")
    public ResponseEntity<Review> markHelpful(
            @PathVariable String reviewId
    ) {

        return ResponseEntity.ok(
                reviewService.markHelpful(reviewId)
        );
    }


    // =====================================================
    // REPLY
    // =====================================================

    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<Review> addReply(
            @PathVariable String reviewId,
            @RequestParam String userId,
            @RequestParam(required = false) String userName,
            @RequestParam String text
    ) {

        return ResponseEntity.ok(
                reviewService.addReply(
                        reviewId,
                        userId,
                        userName,
                        text
                )
        );
    }


    // =====================================================
    // REPORT / FLAG
    // =====================================================

    @PutMapping("/{reviewId}/flag")
    public ResponseEntity<Review> flagReview(
            @PathVariable String reviewId,
            @RequestParam(required = false) String reason
    ) {

        return ResponseEntity.ok(
                reviewService.flagReview(
                        reviewId,
                        reason
                )
        );
    }


    // =====================================================
    // MODERATION - FLAGGED REVIEWS
    // =====================================================

    @GetMapping("/moderation/flagged")
    public ResponseEntity<List<Review>> getFlaggedReviews() {

        return ResponseEntity.ok(
                reviewService.getFlaggedReviews()
        );
    }


    // =====================================================
    // MODERATION - KEEP / APPROVE
    // =====================================================

    @PutMapping("/moderation/{reviewId}/approve")
    public ResponseEntity<Review> approveReview(
            @PathVariable String reviewId
    ) {

        return ResponseEntity.ok(
                reviewService.approveReview(reviewId)
        );
    }


    // =====================================================
    // MODERATION - REMOVE
    // =====================================================

    @DeleteMapping("/moderation/{reviewId}")
    public ResponseEntity<Review> removeReview(
            @PathVariable String reviewId
    ) {

        return ResponseEntity.ok(
                reviewService.removeReview(reviewId)
        );
    }


    // =====================================================
    // CREATE REVIEW REQUEST BODY
    // =====================================================

    public static class ReviewRequest {

        private String userId;
        private String userName;
        private String targetType;
        private String targetId;
        private int rating;
        private String reviewText;
        private List<String> photoUrls;


        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }


        public String getUserName() {
            return userName;
        }

        public void setUserName(String userName) {
            this.userName = userName;
        }


        public String getTargetType() {
            return targetType;
        }

        public void setTargetType(String targetType) {
            this.targetType = targetType;
        }


        public String getTargetId() {
            return targetId;
        }

        public void setTargetId(String targetId) {
            this.targetId = targetId;
        }


        public int getRating() {
            return rating;
        }

        public void setRating(int rating) {
            this.rating = rating;
        }


        public String getReviewText() {
            return reviewText;
        }

        public void setReviewText(String reviewText) {
            this.reviewText = reviewText;
        }


        public List<String> getPhotoUrls() {
            return photoUrls;
        }

        public void setPhotoUrls(List<String> photoUrls) {
            this.photoUrls = photoUrls;
        }
    }


    // =====================================================
    // ADD PHOTOS REQUEST BODY
    // =====================================================

    public static class AddReviewPhotosRequest {

        private String userId;

        private List<String> photoUrls;


        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }


        public List<String> getPhotoUrls() {
            return photoUrls;
        }

        public void setPhotoUrls(List<String> photoUrls) {
            this.photoUrls = photoUrls;
        }
    }
}