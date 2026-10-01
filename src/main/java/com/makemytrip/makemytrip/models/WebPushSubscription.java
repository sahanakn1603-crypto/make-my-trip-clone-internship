package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "web_push_subscriptions")
public class WebPushSubscription {

    @Id
    private String id;

    private String endpoint;
    private String p256dh;
    private String auth;

    public WebPushSubscription() {
    }

    public WebPushSubscription(
            String endpoint,
            String p256dh,
            String auth) {

        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getP256dh() {
        return p256dh;
    }

    public void setP256dh(String p256dh) {
        this.p256dh = p256dh;
    }

    public String getAuth() {
        return auth;
    }

    public void setAuth(String auth) {
        this.auth = auth;
    }
}
