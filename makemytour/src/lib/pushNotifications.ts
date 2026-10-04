const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://make-my-trip-clone-internship.onrender.com";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return buffer;
}

/**
 * Register the push service worker and WAIT until it is active.
 *
 * The previous version returned immediately after register().
 * That caused:
 *
 * AbortError: Failed to execute 'subscribe' on 'PushManager':
 * Subscription failed - no active Service Worker
 *
 * navigator.serviceWorker.ready guarantees that an active worker
 * controls/owns the registration before pushManager.subscribe().
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (typeof window === "undefined") {
    throw new Error("Service workers are only available in the browser.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported.");
  }

  const registration = await navigator.serviceWorker.register(
    "/sw.js",
    { scope: "/" }
  );

  console.log(
    "Push service worker registered:",
    registration.scope
  );

  // IMPORTANT: wait for the service worker to become active.
  const activeRegistration =
    await navigator.serviceWorker.ready;

  console.log(
    "Push service worker is active:",
    activeRegistration.scope
  );

  return activeRegistration;
}

export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription> {
  if (!vapidPublicKey) {
    throw new Error("VAPID public key is not configured.");
  }

  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    throw new Error(
      "Push notifications are not supported by this browser."
    );
  }

  // Register and WAIT for an active service worker.
  const registration =
    await registerPushServiceWorker();

  let permission = Notification.permission;

  if (permission !== "granted") {
    permission =
      await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToArrayBuffer(vapidPublicKey),
      });
  }

  const json = subscription.toJSON();

  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error(
      "Invalid push subscription."
    );
  }

  const response = await fetch(
    `${BACKEND_URL}/push/subscribe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
        p256dh,
        auth,
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text().catch(() => "");

    throw new Error(
      errorText ||
        "Failed to save push subscription."
    );
  }

  console.log(
    "Push subscription saved successfully."
  );

  return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  const registration =
    await navigator.serviceWorker.getRegistration("/");

  if (!registration) {
    return;
  }

  const subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const endpoint = subscription.endpoint;

  await subscription.unsubscribe();

  await fetch(
    `${BACKEND_URL}/push/unsubscribe?endpoint=${encodeURIComponent(
      endpoint
    )}`,
    {
      method: "DELETE",
    }
  );

  console.log(
    "Push subscription removed."
  );
}
