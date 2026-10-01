package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.CancellationRefund;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CancellationRefundRepository
        extends MongoRepository<CancellationRefund, String> {

    Optional<CancellationRefund> findFirstByUserIdAndBookingIdOrderByCancelledAtDesc(
            String userId,
            String bookingId
    );
}
