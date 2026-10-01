self.addEventListener("push", function (event) {
    let data = {
        title: "MakeMyTrip",
        body: "You have a new flight update.",
        url: "/flight-status"
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            console.error("Push data parsing failed:", error);
        }
    }

    const options = {
        body: data.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: {
            url: data.url || "/flight-status"
        },
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || "MakeMyTrip",
            options
        )
    );
});


self.addEventListener("notificationclick", function (event) {

    event.notification.close();

    const url =
        event.notification.data?.url ||
        "/flight-status";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(function (clientList) {

            for (const client of clientList) {

                if ("focus" in client) {

                    client.navigate(url);

                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});