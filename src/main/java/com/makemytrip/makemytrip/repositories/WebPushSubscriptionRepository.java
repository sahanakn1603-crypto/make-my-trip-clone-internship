package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.WebPushSubscription;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface WebPushSubscriptionRepository
        extends MongoRepository<WebPushSubscription, String> {

    Optional<WebPushSubscription> findByEndpoint(String endpoint);
}