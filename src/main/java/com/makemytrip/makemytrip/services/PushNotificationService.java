package com.makemytrip.makemytrip.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.makemytrip.makemytrip.models.WebPushSubscription;
import com.makemytrip.makemytrip.repositories.WebPushSubscriptionRepository;

import nl.martijndwars.webpush.JdkHttpClientPushService;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PushNotificationService {

    private final WebPushSubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper;

    private final String vapidPublicKey;
    private final String vapidPrivateKey;
    private final String vapidSubject;

    public PushNotificationService(
            WebPushSubscriptionRepository subscriptionRepository,
            ObjectMapper objectMapper,
            @Value("${webpush.vapid.public-key}") String vapidPublicKey,
            @Value("${webpush.vapid.private-key}") String vapidPrivateKey,
            @Value("${webpush.vapid.subject}") String vapidSubject) {

        this.subscriptionRepository = subscriptionRepository;
        this.objectMapper = objectMapper;

        this.vapidPublicKey = vapidPublicKey;
        this.vapidPrivateKey = vapidPrivateKey;
        this.vapidSubject = vapidSubject;
    }

    /**
     * Send push notification to all subscribed browsers.
     */
    public void sendToAll(
            String title,
            String body,
            String url) {

        List<WebPushSubscription> subscriptions =
                subscriptionRepository.findAll();

        if (subscriptions.isEmpty()) {

            System.out.println(
                    "ℹ️ No Web Push subscriptions found."
            );

            return;
        }

        System.out.println(
                "📢 Sending push to "
                        + subscriptions.size()
                        + " subscription(s)."
        );

        for (WebPushSubscription subscription :
                subscriptions) {

            try {

                sendNotification(
                        subscription,
                        title,
                        body,
                        url
                );

            } catch (Exception error) {

                System.err.println(
                        "❌ Failed to send push notification to:"
                );

                System.err.println(
                        subscription.getEndpoint()
                );

                System.err.println(
                        "Reason: "
                                + error.getMessage()
                );
            }
        }
    }

    /**
     * Send notification to one subscription.
     */
    private void sendNotification(
            WebPushSubscription subscription,
            String title,
            String body,
            String url) throws Exception {

        Map<String, Object> payloadMap =
                new HashMap<>();

        payloadMap.put(
                "title",
                title
        );

        payloadMap.put(
                "body",
                body
        );

        payloadMap.put(
                "url",
                url
        );

        String payload =
                objectMapper.writeValueAsString(
                        payloadMap
                );

        Notification notification =
                Notification.builder()
                        .endpoint(
                                subscription.getEndpoint()
                        )
                        .userPublicKey(
                                subscription.getP256dh()
                        )
                        .userAuth(
                                subscription.getAuth()
                        )
                        .payload(
                                payload
                        )
                        .ttl(300)
                        .build();

        PushService pushService =
                new JdkHttpClientPushService.Builder()
                        .withVapidPublicKey(
                                vapidPublicKey
                        )
                        .withVapidPrivateKey(
                                vapidPrivateKey
                        )
                        .withVapidSubject(
                                vapidSubject
                        )
                        .build();

        try {

            var response =
                    pushService.send(
                            notification
                    );

            int status =
                    response.statusCode();

            /*
             * SUCCESS
             */
            if (
                    status >= 200 &&
                    status < 300
            ) {

                System.out.println(
                        "✅ Web Push sent successfully. HTTP status: "
                                + status
                );

            } else {

                System.err.println(
                        "⚠️ Web Push service returned HTTP status: "
                                + status
                );

                /*
                 * 410 = expired/invalid subscription.
                 */
                if (status == 410) {

                    System.err.println(
                            "🗑️ Removing expired push subscription."
                    );

                    subscriptionRepository.delete(
                            subscription
                    );
                }

                /*
                 * 429 = rate limited.
                 */
                else if (status == 429) {

                    System.err.println(
                            "⏳ Push service rate limited the request."
                    );
                }

                /*
                 * 406 = request rejected.
                 */
                else if (status == 406) {

                    System.err.println(
                            "⚠️ Push service rejected the notification."
                    );
                }
            }

        } finally {

            pushService.close();
        }
    }
}