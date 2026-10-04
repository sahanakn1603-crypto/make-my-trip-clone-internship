import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  getFlightStatus,
  getFlightStatusHistory,
  getflight,
} from "@/api";

import {
  subscribeToPush,
  unsubscribeFromPush,
} from "../../lib/pushNotifications";

type Flight = {
  id: string;
  flightName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
};

type FlightStatus = {
  flightId: string;
  status: string;
  delayMinutes: number;
  delayReason: string;
  scheduledDeparture: string;
  estimatedDeparture: string;
  scheduledArrival: string;
  estimatedArrival: string;
};

type HistoryItem = {
  id: string;
  flightId: string;
  status: string;
  delayMinutes: number;
  delayReason: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  updatedAt: string;
};

export default function FlightStatusPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState("");
  const [status, setStatus] = useState<FlightStatus | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Flights saved by the user for simultaneous tracking.
  const [trackedFlights, setTrackedFlights] = useState<string[]>([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // Stores the last known status/ETA so we only notify when something changes.
  const previousFlightData = useRef<Record<string, {
    status: string;
    delayMinutes: number;
    estimatedDeparture: string;
    estimatedArrival: string;
  }>>({});

  const router = useRouter();

  /*
   * ---------------------------------------------------------
   * MULTI-FLIGHT TRACKING + NOTIFICATIONS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    try {
      const saved = localStorage.getItem("trackedFlights");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setTrackedFlights(parsed);
        }
      }
    } catch (error) {
      console.log("Could not load tracked flights:", error);
    }

    try {
      const savedNotifications =
        localStorage.getItem("flightNotificationsEnabled");

      setNotificationEnabled(
        savedNotifications === "true" &&
        "Notification" in window &&
        Notification.permission === "granted"
      );
    } catch (error) {
      console.log(
        "Could not load notification preference:",
        error
      );
    }
  }, []);

  const saveTrackedFlights = (flightIds: string[]) => {
    setTrackedFlights(flightIds);
    localStorage.setItem(
      "trackedFlights",
      JSON.stringify(flightIds)
    );
  };

  const addTrackedFlight = (flightId: string) => {
    if (!flightId) return;

    if (!trackedFlights.includes(flightId)) {
      saveTrackedFlights([
        ...trackedFlights,
        flightId,
      ]);
    }
  };

  const removeTrackedFlight = (flightId: string) => {
    saveTrackedFlights(
      trackedFlights.filter((id) => id !== flightId)
    );

    if (selectedFlight === flightId) {
      setSelectedFlight("");
      setStatus(null);
      setHistory([]);
    }
  };

 const toggleNotifications = async () => {
  // Disable Web Push notifications
  if (notificationEnabled) {
    try {
      await unsubscribeFromPush();

      setNotificationEnabled(false);

      localStorage.setItem(
        "flightNotificationsEnabled",
        "false"
      );

      console.log(
        "🔕 Web Push notifications disabled."
      );
    } catch (error) {
      console.error(
        "Failed to disable Web Push notifications:",
        error
      );

      alert(
        "Unable to disable notifications. Please try again."
      );
    }

    return;
  }

  // Check browser notification support
  if (!("Notification" in window)) {
    alert(
      "This browser does not support notifications."
    );
    return;
  }

  try {
    // Get VAPID public key from .env.local
    const vapidPublicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      throw new Error(
        "VAPID public key is not configured."
      );
    }

    // Register service worker + request permission
    // + create Web Push subscription
    // + save subscription in backend
    await subscribeToPush(vapidPublicKey);

    setNotificationEnabled(true);

    localStorage.setItem(
      "flightNotificationsEnabled",
      "true"
    );

    console.log(
      "✅ Web Push notifications enabled."
    );
  } catch (error) {
    console.error(
      "❌ Failed to enable Web Push notifications:",
      error
    );

    setNotificationEnabled(false);

    localStorage.setItem(
      "flightNotificationsEnabled",
      "false"
    );

    alert(
      "Unable to enable notifications. Please allow browser notifications and try again."
    );
  }
};

  const sendFlightNotification = (
  flight: Flight,
  currentStatus: FlightStatus,
  previous: {
    status: string;
    delayMinutes: number;
    estimatedDeparture: string;
    estimatedArrival: string;
  }
) => {
  if (
    !notificationEnabled ||
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  let message = "";

  if (
    previous.status !== currentStatus.status
  ) {
    message =
      `${flight.flightName}: status changed to ` +
      `${getStatusText(currentStatus.status)}.`;
  } else if (
    previous.delayMinutes !==
    currentStatus.delayMinutes
  ) {
    message =
      `${flight.flightName}: delay updated to ` +
      `${currentStatus.delayMinutes} minutes.`;
  } else if (
    previous.estimatedDeparture !==
    currentStatus.estimatedDeparture
  ) {
    message =
      `${flight.flightName}: departure time changed to ` +
      `${formatDateTime(
        currentStatus.estimatedDeparture
      )}.`;
  } else if (
    previous.estimatedArrival !==
    currentStatus.estimatedArrival
  ) {
    message =
      `${flight.flightName}: estimated arrival changed to ` +
      `${formatDateTime(
        currentStatus.estimatedArrival
      )}.`;
  }

  if (!message) {
    return;
  }

  try {
    try {
  const notification = new Notification(
    `✈️ ${flight.flightName} — ${flight.from} → ${flight.to}`,
    {
      body: message,
    }
  );

  notification.onclick = () => {
    window.focus();

    router.push(
      `/flight-status?flightId=${flight.id}`
    );
  };
} catch (error) {
  console.error(
    "Failed to show browser notification:",
    error
  );
}
  } catch (error) {
    console.error(
      "Failed to show browser notification:",
      error
    );
  }
};
  /*
   * ---------------------------------------------------------
   * LOAD FLIGHTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!router.isReady) return;

    loadFlights();
  }, [router.isReady]);

  const loadFlights = async () => {
    try {
      const data = await getflight();
      setFlights(data || []);
    } catch (error) {
      console.log("Error loading flights:", error);
    }
  };

  /*
   * ---------------------------------------------------------
   * AUTO SELECT FLIGHT FROM HOME PAGE
   * ---------------------------------------------------------
   *
   * When Home page sends:
   * /flight-status?flightId=XXXX
   *
   * automatically load that exact flight.
   */

  useEffect(() => {
    if (!router.isReady || flights.length === 0) return;

    const queryFlightId = router.query.flightId;

    if (typeof queryFlightId !== "string") return;

    const flightExists = flights.some(
      (flight) => flight.id === queryFlightId
    );

    if (!flightExists) return;

    setSelectedFlight(queryFlightId);
    addTrackedFlight(queryFlightId);
    setLoading(true);

    const loadSelectedFlight = async () => {
      try {
        const currentStatus = await getFlightStatus(queryFlightId);
        const statusHistory =
          await getFlightStatusHistory(queryFlightId);

        setStatus(currentStatus);
        setHistory(statusHistory || []);

        previousFlightData.current[queryFlightId] = {
          status: currentStatus.status,
          delayMinutes: currentStatus.delayMinutes,
          estimatedDeparture:
            currentStatus.estimatedDeparture,
          estimatedArrival:
            currentStatus.estimatedArrival,
        };
      } catch (error) {
        console.log(
          "Error loading selected flight status:",
          error
        );

        setStatus(null);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadSelectedFlight();
  }, [router.isReady, router.query.flightId, flights]);

  /*
   * ---------------------------------------------------------
   * TRACK SELECTED FLIGHT
   * ---------------------------------------------------------
   */

  const trackFlight = async (
    flightId: string,
    addToTracked: boolean = true,
    showNotification: boolean = true
  ) => {
    if (!flightId) {
      setSelectedFlight("");
      setStatus(null);
      setHistory([]);
      return;
    }

    const selected = flights.find(
      (flight) => flight.id === flightId
    );

    setSelectedFlight(flightId);

    if (addToTracked) {
      addTrackedFlight(flightId);
    }

    setLoading(true);

    try {
      const currentStatus =
        await getFlightStatus(flightId);

      const statusHistory =
        await getFlightStatusHistory(flightId);

      setStatus(currentStatus);
      setHistory(statusHistory || []);

      const previous =
        previousFlightData.current[flightId];

      if (previous && showNotification && selected) {
        sendFlightNotification(
          selected,
          currentStatus,
          previous
        );
      }

      previousFlightData.current[flightId] = {
        status: currentStatus.status,
        delayMinutes:
          currentStatus.delayMinutes,
        estimatedDeparture:
          currentStatus.estimatedDeparture,
        estimatedArrival:
          currentStatus.estimatedArrival,
      };
    } catch (error) {
      console.log(
        "Error loading flight status:",
        error
      );

      setStatus(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * AUTO REFRESH EVERY 30 SECONDS
   * ---------------------------------------------------------
   */

  /*
   * ---------------------------------------------------------
   * REFRESH ALL TRACKED FLIGHTS EVERY 30 SECONDS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (trackedFlights.length === 0) return;

    const refreshTrackedFlights = async () => {
      for (const flightId of trackedFlights) {
        const flight = flights.find(
          (item) => item.id === flightId
        );

        if (!flight) continue;

        try {
          const currentStatus =
            await getFlightStatus(flightId);

          const previous =
            previousFlightData.current[flightId];

          if (previous) {
            sendFlightNotification(
              flight,
              currentStatus,
              previous
            );
          }

          previousFlightData.current[flightId] = {
            status: currentStatus.status,
            delayMinutes:
              currentStatus.delayMinutes,
            estimatedDeparture:
              currentStatus.estimatedDeparture,
            estimatedArrival:
              currentStatus.estimatedArrival,
          };

          // Keep the currently selected flight's screen live.
          if (selectedFlight === flightId) {
            const statusHistory =
              await getFlightStatusHistory(
                flightId
              );

            setStatus(currentStatus);
            setHistory(statusHistory || []);
          }
        } catch (error) {
          console.log(
            "Error refreshing tracked flight:",
            flightId,
            error
          );
        }
      }
    };

    const interval = setInterval(
      refreshTrackedFlights,
      30000
    );

    return () => clearInterval(interval);
  }, [
    trackedFlights,
    flights,
    selectedFlight,
    notificationEnabled,
  ]);

  /*
   * ---------------------------------------------------------
   * STATUS HELPERS
   * ---------------------------------------------------------
   */

  const getStatusColor = (flightStatus: string) => {
    switch (flightStatus) {
      case "ON_TIME":
        return "#16a34a";

      case "BOARDING":
        return "#d97706";

      case "DELAYED":
        return "#dc2626";

      case "DEPARTED":
        return "#4f46e5";

      case "IN_FLIGHT":
        return "#2563eb";

      case "LANDED":
        return "#059669";

      case "CANCELLED":
        return "#991b1b";

      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (flightStatus: string) => {
    switch (flightStatus) {
      case "ON_TIME":
        return "🟢";

      case "BOARDING":
        return "🟡";

      case "DELAYED":
        return "🔴";

      case "DEPARTED":
        return "✈️";

      case "IN_FLIGHT":
        return "🔵";

      case "LANDED":
        return "🟢";

      case "CANCELLED":
        return "⛔";

      default:
        return "⚪";
    }
  };

  const getStatusText = (flightStatus: string) => {
    return flightStatus.replace("_", " ");
  };

  /*
   * ---------------------------------------------------------
   * DATE FORMATTERS
   * ---------------------------------------------------------
   */

  const formatDate = (dateTime: string) => {
    if (!dateTime) return "-";

    return new Date(dateTime).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateTime: string) => {
    if (!dateTime) return "-";

    return new Date(dateTime).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return "-";

    return new Date(dateTime).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /*
   * ---------------------------------------------------------
   * SELECTED FLIGHT
   * ---------------------------------------------------------
   */

  const selectedFlightData = flights.find(
    (flight) => flight.id === selectedFlight
  );

  /*
   * ---------------------------------------------------------
   * JOURNEY STAGES
   * ---------------------------------------------------------
   */

  const journeyStages = [
    {
      status: "ON_TIME",
      title: "Scheduled",
      description: "Flight is scheduled to operate.",
    },
    {
      status: "BOARDING",
      title: "Boarding",
      description: "Passengers are boarding the aircraft.",
    },
    {
      status: "DELAYED",
      title: "Delayed",
      description: "Departure has been delayed.",
    },
    {
      status: "DEPARTED",
      title: "Departed",
      description: "Aircraft has departed from the airport.",
    },
    {
      status: "IN_FLIGHT",
      title: "In Flight",
      description: "Aircraft is currently in the air.",
    },
    {
      status: "LANDED",
      title: "Landed",
      description: "Aircraft has reached the destination.",
    },
  ];

  /*
   * ---------------------------------------------------------
   * ACTUAL FLIGHT JOURNEY
   * ---------------------------------------------------------
   *
   * Only show events that actually happened for the selected
   * flight. Future stages are not shown as "Awaiting update".
   *
   * We also defensively filter history by the selected flight
   * ID so old records cannot appear under another flight.
   */

  const selectedHistory = history
    .filter(
      (item) =>
        item.flightId === selectedFlight
    )
    .sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() -
        new Date(b.updatedAt).getTime()
    );

  const stageOrder: Record<string, number> = {
    ON_TIME: 1,
    BOARDING: 2,
    DELAYED: 3,
    DEPARTED: 4,
    IN_FLIGHT: 5,
    LANDED: 6,
    CANCELLED: 7,
  };

  // Keep only the latest record for each status.
  const latestHistoryByStatus =
    selectedHistory.reduce(
      (acc, item) => {
        acc[item.status] = item;
        return acc;
      },
      {} as Record<string, HistoryItem>
    );

  const actualJourneyHistory = Object.values(
    latestHistoryByStatus
  ).sort(
    (a, b) =>
      (stageOrder[a.status] || 99) -
      (stageOrder[b.status] || 99)
  );

  // If the current status has not yet been written to history,
  // add it as the latest live event.
  if (
    status &&
    status.flightId === selectedFlight &&
    !latestHistoryByStatus[status.status]
  ) {
    actualJourneyHistory.push({
      id: `current-${selectedFlight}-${status.status}`,
      flightId: selectedFlight,
      status: status.status,
      delayMinutes: status.delayMinutes,
      delayReason: status.delayReason,
      estimatedDeparture:
        status.estimatedDeparture,
      estimatedArrival:
        status.estimatedArrival,
      updatedAt:
        status.status === "LANDED"
          ? status.estimatedArrival
          : status.status === "DEPARTED" ||
            status.status === "IN_FLIGHT"
          ? status.estimatedDeparture
          : status.scheduledDeparture,
    });
  }

  actualJourneyHistory.sort(
    (a, b) =>
      (stageOrder[a.status] || 99) -
      (stageOrder[b.status] || 99)
  );

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "40px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          style={{
            position: "relative",
            marginBottom: "30px",
          }}
        >
          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={() => {
              const {
                from,
                to,
                date,
                travelers,
              } = router.query;

              // Return to the home page with the user's current
              // search values so they do not have to enter them again.
              router.push({
                pathname: "/",
                query: {
                  ...(typeof from === "string" && from
                    ? { from }
                    : {}),
                  ...(typeof to === "string" && to
                    ? { to }
                    : {}),
                  ...(typeof date === "string" && date
                    ? { date }
                    : {}),
                  ...(typeof travelers === "string" &&
                  travelers
                    ? { travelers }
                    : {}),
                },
              });
            }}
            title="Close flight status"
            aria-label="Close flight status"
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border: "1px solid #d1d5db",
              background: "white",
              color: "#111827",
              fontSize: "24px",
              lineHeight: "1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            ×
          </button>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              margin: 0,
              paddingRight: "55px",
              color: "#111827",
            }}
          >
            ✈️ Live Flight Status
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: "8px",
              paddingRight: "55px",
              fontSize: "16px",
            }}
          >
            Track your flight, departure updates, delays and
            estimated arrival time.
          </p>
        </div>


        {/* =====================================================
            FLIGHT SEARCH
        ===================================================== */}

        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "14px",
            marginBottom: "24px",
            boxShadow: "0 3px 14px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Track Your Flight
            </label>

            <span
              style={{
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              Select a flight to see live updates
            </span>
          </div>

          <select
            value={selectedFlight}
            onChange={(e) => trackFlight(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "9px",
              fontSize: "16px",
              background: "white",
              color: "#111827",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">
              Choose a flight...
            </option>

            {flights.map((flight) => (
              <option
                key={flight.id}
                value={flight.id}
              >
                {flight.flightName} — {flight.from} → {flight.to}
              </option>
            ))}
          </select>
        </div>


        {/* =====================================================
            MY TRACKED FLIGHTS
        ===================================================== */}

        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "14px",
            marginBottom: "24px",
            boxShadow: "0 3px 14px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#111827",
                }}
              >
                ✈️ My Tracked Flights
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Track multiple flights and receive important
                status updates.
              </p>
            </div>

            <button
              onClick={toggleNotifications}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: notificationEnabled
                  ? "#ecfdf5"
                  : "white",
                color: notificationEnabled
                  ? "#047857"
                  : "#111827",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {notificationEnabled
                ? "🔔 Notifications On"
                : "🔕 Notifications Off"}
            </button>
          </div>

          {trackedFlights.length === 0 ? (
            <div
              style={{
                padding: "18px",
                borderRadius: "10px",
                background: "#f8fafc",
                color: "#64748b",
              }}
            >
              No flights are being tracked yet.
              Select a flight above and it will be added here.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px",
              }}
            >
              {trackedFlights.map((flightId) => {
                const flight = flights.find(
                  (item) => item.id === flightId
                );

                if (!flight) return null;

                return (
                  <div
                    key={flight.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "16px",
                      background:
                        selectedFlight === flight.id
                          ? "#eff6ff"
                          : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {flight.flightName}
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            color: "#6b7280",
                            fontSize: "14px",
                          }}
                        >
                          {flight.from} → {flight.to}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          removeTrackedFlight(
                            flight.id
                          )
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: "18px",
                        }}
                        title="Stop tracking"
                      >
                        ×
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "14px",
                      }}
                    >
                      <button
                        onClick={() =>
                          trackFlight(
                            flight.id,
                            false,
                            false
                          )
                        }
                        style={{
                          flex: 1,
                          padding: "9px",
                          borderRadius: "7px",
                          border: "1px solid #2563eb",
                          background: "#2563eb",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        View Status
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "14px",
              marginBottom: "24px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            ✈️ Loading latest flight information...
          </div>
        )}


        {/* =====================================================
            FLIGHT INFORMATION
        ===================================================== */}

        {status && !loading && selectedFlightData && (
          <>
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                marginBottom: "24px",
                overflow: "hidden",
                boxShadow: "0 3px 14px rgba(0,0,0,0.07)",
              }}
            >

              {/* TOP FLIGHT HEADER */}

              <div
                style={{
                  padding: "26px 30px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "20px",
                  }}
                >

                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        marginBottom: "5px",
                      }}
                    >
                      Flight
                    </div>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: "26px",
                        color: "#111827",
                      }}
                    >
                      {selectedFlightData.flightName}
                    </h2>

                    <div
                      style={{
                        marginTop: "8px",
                        color: "#4b5563",
                        fontSize: "16px",
                      }}
                    >
                      {selectedFlightData.from}
                      {" → "}
                      {selectedFlightData.to}
                    </div>
                  </div>


                  {/* CURRENT STATUS */}

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginBottom: "5px",
                      }}
                    >
                      Current Status
                    </div>

                    <div
                      style={{
                        color: getStatusColor(status.status),
                        fontSize: "21px",
                        fontWeight: 700,
                      }}
                    >
                      {getStatusIcon(status.status)}{" "}
                      {getStatusText(status.status)}
                    </div>
                  </div>
                </div>


                {/* DELAY ALERT */}

                {status.delayMinutes > 0 && (
                  <div
                    style={{
                      marginTop: "22px",
                      padding: "16px",
                      borderRadius: "10px",
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                    }}
                  >
                    <div
                      style={{
                        color: "#be123c",
                        fontWeight: 700,
                        fontSize: "16px",
                      }}
                    >
                      🔴 Delayed by {status.delayMinutes} minutes
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        color: "#881337",
                      }}
                    >
                      Reason:{" "}
                      {status.delayReason || "Not specified"}
                    </div>
                  </div>
                )}
              </div>


              {/* =================================================
                  DEPARTURE / ARRIVAL TIMES
              ================================================= */}

              <div
                style={{
                  padding: "28px 30px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "18px",
                  }}
                >

                  {/* SCHEDULED DEPARTURE */}

                  <div
                    style={{
                      padding: "18px",
                      background: "#f9fafb",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                        marginBottom: "7px",
                      }}
                    >
                      Scheduled Departure
                    </div>

                    <strong
                      style={{
                        fontSize: "19px",
                        color: "#111827",
                      }}
                    >
                      {formatTime(status.scheduledDeparture)}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      {formatDate(status.scheduledDeparture)}
                    </div>
                  </div>


                  {/* ESTIMATED DEPARTURE */}

                  <div
                    style={{
                      padding: "18px",
                      background:
                        status.delayMinutes > 0
                          ? "#fff7ed"
                          : "#f0fdf4",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                        marginBottom: "7px",
                      }}
                    >
                      Estimated Departure
                    </div>

                    <strong
                      style={{
                        fontSize: "19px",
                        color:
                          status.delayMinutes > 0
                            ? "#c2410c"
                            : "#15803d",
                      }}
                    >
                      {formatTime(status.estimatedDeparture)}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      {formatDate(status.estimatedDeparture)}
                    </div>
                  </div>


                  {/* SCHEDULED ARRIVAL */}

                  <div
                    style={{
                      padding: "18px",
                      background: "#f9fafb",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                        marginBottom: "7px",
                      }}
                    >
                      Scheduled Arrival
                    </div>

                    <strong
                      style={{
                        fontSize: "19px",
                        color: "#111827",
                      }}
                    >
                      {formatTime(status.scheduledArrival)}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      {formatDate(status.scheduledArrival)}
                    </div>
                  </div>


                  {/* ESTIMATED ARRIVAL */}

                  <div
                    style={{
                      padding: "18px",
                      background:
                        status.delayMinutes > 0
                          ? "#fff7ed"
                          : "#f0fdf4",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                        marginBottom: "7px",
                      }}
                    >
                      Estimated Arrival
                    </div>

                    <strong
                      style={{
                        fontSize: "19px",
                        color:
                          status.delayMinutes > 0
                            ? "#c2410c"
                            : "#15803d",
                      }}
                    >
                      {formatTime(status.estimatedArrival)}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      {formatDate(status.estimatedArrival)}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* =================================================
                FLIGHT JOURNEY
            ================================================= */}

            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "16px",
                boxShadow: "0 3px 14px rgba(0,0,0,0.07)",
              }}
            >

              <div
                style={{
                  marginBottom: "28px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "23px",
                    color: "#111827",
                  }}
                >
                  ✈️ Flight Journey
                </h2>

                <p
                  style={{
                    marginTop: "7px",
                    marginBottom: 0,
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Follow the latest updates for your flight
                </p>
              </div>


              {/* JOURNEY TIMELINE */}

              <div
                style={{
                  position: "relative",
                }}
              >

                {actualJourneyHistory.length === 0 ? (
                  <div
                    style={{
                      padding: "18px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      color: "#64748b",
                    }}
                  >
                    No journey updates have been recorded yet.
                  </div>
                ) : (
                  actualJourneyHistory.map(
                    (item, index) => {
                      const isCurrent =
                        status?.status === item.status;

                      const isLast =
                        index ===
                        actualJourneyHistory.length - 1;

                      const title =
                        item.status === "ON_TIME"
                          ? "Scheduled"
                          : item.status
                              .replace("_", " ")
                              .replace(
                                /^./,
                                (letter) =>
                                  letter.toUpperCase()
                              );

                      return (
                        <div
                          key={`${item.id}-${item.status}`}
                          style={{
                            display: "flex",
                            position: "relative",
                            minHeight: isLast
                              ? "80px"
                              : "105px",
                          }}
                        >
                          {!isLast && (
                            <div
                              style={{
                                position: "absolute",
                                left: "13px",
                                top: "28px",
                                bottom: 0,
                                width: "2px",
                                background:
                                  getStatusColor(
                                    item.status
                                  ),
                              }}
                            />
                          )}

                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background:
                                getStatusColor(
                                  item.status
                                ),
                              color: "white",
                              fontSize: "13px",
                              zIndex: 2,
                              boxShadow: isCurrent
                                ? `0 0 0 5px ${getStatusColor(
                                    item.status
                                  )}20`
                                : "none",
                            }}
                          >
                            ✓
                          </div>

                          <div
                            style={{
                              marginLeft: "18px",
                              paddingBottom: isLast
                                ? 0
                                : "22px",
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "flex-start",
                                gap: "15px",
                                flexWrap: "wrap",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: "17px",
                                    fontWeight: 700,
                                    color:
                                      getStatusColor(
                                        item.status
                                      ),
                                  }}
                                >
                                  {getStatusIcon(
                                    item.status
                                  )}{" "}
                                  {title}
                                  {isCurrent && (
                                    <span
                                      style={{
                                        marginLeft:
                                          "8px",
                                        fontSize:
                                          "11px",
                                        padding:
                                          "3px 7px",
                                        borderRadius:
                                          "999px",
                                        background:
                                          "#eff6ff",
                                        color:
                                          "#2563eb",
                                      }}
                                    >
                                      CURRENT
                                    </span>
                                  )}
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "5px",
                                    color:
                                      "#4b5563",
                                    fontSize:
                                      "14px",
                                  }}
                                >
                                  {item.delayMinutes >
                                  0
                                    ? `Delayed by ${item.delayMinutes} minutes`
                                    : item.status ===
                                      "ON_TIME"
                                    ? "Flight is scheduled to operate."
                                    : item.status ===
                                      "BOARDING"
                                    ? "Passengers are boarding the aircraft."
                                    : item.status ===
                                      "DEPARTED"
                                    ? "Aircraft has departed from the airport."
                                    : item.status ===
                                      "IN_FLIGHT"
                                    ? "Aircraft is currently in the air."
                                    : item.status ===
                                      "LANDED"
                                    ? "Aircraft has reached the destination."
                                    : "Flight status updated."}
                                </div>

                                {item.delayReason && (
                                  <div
                                    style={{
                                      marginTop:
                                        "4px",
                                      color:
                                        "#6b7280",
                                      fontSize:
                                        "13px",
                                    }}
                                  >
                                    Reason:{" "}
                                    {
                                      item.delayReason
                                    }
                                  </div>
                                )}
                              </div>

                              <div
                                style={{
                                  color:
                                    "#374151",
                                  fontSize:
                                    "13px",
                                  textAlign:
                                    "right",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {formatDateTime(
                                  item.updatedAt
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )
                )}              </div>


              {/* =================================================
                  LIVE UPDATE MESSAGE
              ================================================= */}

              <div
                style={{
                  marginTop: "25px",
                  padding: "14px 16px",
                  background: "#f8fafc",
                  borderRadius: "9px",
                  color: "#64748b",
                  fontSize: "13px",
                  border: "1px solid #e2e8f0",
                }}
              >
                🔄 Flight status automatically refreshes every
                30 seconds.
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}