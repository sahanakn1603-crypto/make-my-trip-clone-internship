package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Review;
import com.makemytrip.makemytrip.repositories.ReviewRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;


    // =====================================================
    // CREATE REVIEW
    // =====================================================

    public Review createReview(
            String userId,
            String userName,
            String targetType,
            String targetId,
            int rating,
            String reviewText,
            List<String> photoUrls
    ) {

        if (userId == null || userId.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "User ID is required"
            );
        }

        if (targetType == null || targetType.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target type is required"
            );
        }

        if (targetId == null || targetId.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target ID is required"
            );
        }

        if (rating < 1 || rating > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Rating must be between 1 and 5"
            );
        }

        if (reviewText == null || reviewText.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Review text is required"
            );
        }

        String normalizedUserId = userId.trim();

        String normalizedTargetType =
                targetType.trim().toUpperCase(Locale.ROOT);

        String normalizedTargetId = targetId.trim();

        Optional<Review> existingReview =
                reviewRepository.findByUserIdAndTargetTypeAndTargetId(
                        normalizedUserId,
                        normalizedTargetType,
                        normalizedTargetId
                );

        if (existingReview.isPresent()) {

            String itemName =
                    normalizedTargetType.equals("HOTEL")
                            ? "hotel"
                            : "flight";

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already reviewed this "
                            + itemName
                            + ". You can only submit one review."
            );
        }

        Review review = new Review();

        review.setUserId(normalizedUserId);

        review.setUserName(
                userName == null || userName.trim().isEmpty()
                        ? "Guest"
                        : userName.trim()
        );

        review.setTargetType(normalizedTargetType);

        review.setTargetId(normalizedTargetId);

        review.setRating(rating);

        review.setReviewText(reviewText.trim());

        if (photoUrls != null) {
            review.setPhotoUrls(new ArrayList<>(photoUrls));
        } else {
            review.setPhotoUrls(new ArrayList<>());
        }

        review.setHelpfulCount(0);

        review.setFlagged(false);

        review.setFlagReason(null);

        review.setStatus("ACTIVE");

        review.setCreatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }


    // =====================================================
    // ADD PHOTOS TO EXISTING REVIEW
    // =====================================================

    public Review addReviewPhotos(
            String reviewId,
            String userId,
            List<String> photoUrls
    ) {

        // Validate review ID
        if (reviewId == null || reviewId.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Review ID is required"
            );
        }

        // Validate user ID
        if (userId == null || userId.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "User ID is required"
            );
        }

        // Validate photos
        if (photoUrls == null || photoUrls.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one photo is required"
            );
        }

        String normalizedReviewId = reviewId.trim();
        String normalizedUserId = userId.trim();

        // Find existing review
        Review review =
                reviewRepository.findById(normalizedReviewId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Review not found"
                                )
                        );

        // Make sure the review belongs to this user
        if (review.getUserId() == null ||
                !normalizedUserId.equals(review.getUserId().trim())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only add photos to your own review"
            );
        }

        // Get existing photos
        List<String> existingPhotos = review.getPhotoUrls();

        if (existingPhotos == null) {
            existingPhotos = new ArrayList<>();
        } else {
            existingPhotos = new ArrayList<>(existingPhotos);
        }

        // Maximum 5 photos per review
        int MAX_PHOTOS = 5;

        if (existingPhotos.size() + photoUrls.size() > MAX_PHOTOS) {

            int remainingSlots =
                    MAX_PHOTOS - existingPhotos.size();

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You can add only "
                            + remainingSlots
                            + " more photo(s). Maximum "
                            + MAX_PHOTOS
                            + " photos are allowed per review."
            );
        }

        // Add only valid photo URLs
        for (String photoUrl : photoUrls) {

            if (photoUrl != null &&
                    !photoUrl.trim().isEmpty()) {

                existingPhotos.add(photoUrl.trim());
            }
        }

        // Make sure at least one valid photo was added
        if (existingPhotos.size() == review.getPhotoUrls().size()
                && !photoUrls.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No valid photo URL was provided"
            );
        }

        // Save updated photos
        review.setPhotoUrls(existingPhotos);

        return reviewRepository.save(review);
    }


    // =====================================================
    // GET REVIEWS FOR ONE HOTEL / FLIGHT
    // =====================================================

    public List<Review> getReviews(
            String targetType,
            String targetId,
            String sort
    ) {

        if (targetType == null || targetType.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target type is required"
            );
        }

        if (targetId == null || targetId.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target ID is required"
            );
        }

        String normalizedTargetType =
                targetType.trim().toUpperCase(Locale.ROOT);

        String normalizedTargetId =
                targetId.trim();

        List<Review> reviews =
                reviewRepository
                        .findByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(
                                normalizedTargetType,
                                normalizedTargetId,
                                "ACTIVE"
                        );

        // Extra safety check.
        reviews.removeIf(review ->
                review == null ||
                review.getTargetType() == null ||
                review.getTargetId() == null ||
                !normalizedTargetType.equals(
                        review.getTargetType()
                                .trim()
                                .toUpperCase(Locale.ROOT)
                ) ||
                !normalizedTargetId.equals(
                        review.getTargetId().trim()
                )
        );

        if (sort != null) {

            String normalizedSort =
                    sort.trim().toLowerCase(Locale.ROOT);

            if (normalizedSort.equals("helpful")) {

                reviews.sort(
                        Comparator.comparingInt(
                                Review::getHelpfulCount
                        ).reversed()
                );

            } else if (
                    normalizedSort.equals("highest") ||
                    normalizedSort.equals("highest-rated")
            ) {

                reviews.sort(
                        Comparator.comparingInt(
                                Review::getRating
                        ).reversed()
                );

            } else if (
                    normalizedSort.equals("lowest") ||
                    normalizedSort.equals("lowest-rated")
            ) {

                reviews.sort(
                        Comparator.comparingInt(
                                Review::getRating
                        )
                );

            } else {

                reviews.sort(
                        Comparator.comparing(
                                Review::getCreatedAt,
                                Comparator.nullsLast(
                                        Comparator.naturalOrder()
                                )
                        ).reversed()
                );
            }
        }

        return reviews;
    }


    // =====================================================
    // MARK REVIEW AS HELPFUL
    // =====================================================

    public Review markHelpful(String reviewId) {

        Review review =
                reviewRepository.findById(reviewId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Review not found"
                                )
                        );

        review.setHelpfulCount(
                review.getHelpfulCount() + 1
        );

        return reviewRepository.save(review);
    }


    // =====================================================
    // REPLY TO REVIEW
    // =====================================================

    public Review addReply(
            String reviewId,
            String userId,
            String userName,
            String text
    ) {

        if (text == null || text.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reply text is required"
            );
        }

        Review review =
                reviewRepository.findById(reviewId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Review not found"
                                )
                        );

        Review.Reply reply =
                new Review.Reply(
                        userId,
                        userName == null ||
                        userName.trim().isEmpty()
                                ? "Guest"
                                : userName.trim(),
                        text.trim()
                );

        if (review.getReplies() == null) {
            review.setReplies(new ArrayList<>());
        }

        review.getReplies().add(reply);

        return reviewRepository.save(review);
    }


    // =====================================================
    // FLAG / REPORT REVIEW
    // =====================================================

    public Review flagReview(
            String reviewId,
            String reason
    ) {

        Review review =
                reviewRepository.findById(reviewId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Review not found"
                                )
                        );

        review.setFlagged(true);

        review.setFlagReason(
                reason == null || reason.trim().isEmpty()
                        ? "No reason provided"
                        : reason.trim()
        );

        // Keep the review visible until moderator decides.
        review.setStatus("ACTIVE");

        return reviewRepository.save(review);
    }


    // =====================================================
    // MODERATION - GET FLAGGED REVIEWS
    // =====================================================

    public List<Review> getFlaggedReviews() {

        return reviewRepository
                .findByFlaggedTrueAndStatusOrderByCreatedAtDesc(
                        "ACTIVE"
                );
    }


    // =====================================================
    // MODERATION - KEEP / APPROVE REVIEW
    // =====================================================

    public Review approveReview(
            String reviewId
    ) {

        Review review =
                reviewRepository.findById(reviewId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Review not found"
                                )
                        );

        review.setFlagged(false);

        review.setFlagReason(null);

        review.setStatus("ACTIVE");

        return reviewRepository.save(review);
    }


    // =====================================================
    // MODERATION - REMOVE REVIEW
    // =====================================================

    public Review removeReview(
            String reviewId
    ) {

        Review review =
                reviewRepository.findById(reviewId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Review not found"
                                )
                        );

        // Soft delete: keep the review in MongoDB,
        // but it will no longer appear in normal reviews.
        review.setStatus("REMOVED");

        review.setFlagged(false);

        return reviewRepository.save(review);
    }
}