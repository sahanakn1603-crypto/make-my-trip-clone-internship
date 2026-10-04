package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {

    // Get only ACTIVE reviews for one exact hotel / flight.
    List<Review> findByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(
            String targetType,
            String targetId,
            String status
    );

    // Check whether this user already reviewed this exact hotel / flight.
    Optional<Review> findByUserIdAndTargetTypeAndTargetId(
            String userId,
            String targetType,
            String targetId
    );

    // Get reviews reported by users and still awaiting moderation.
    List<Review> findByFlaggedTrueAndStatusOrderByCreatedAtDesc(
            String status
    );
}
