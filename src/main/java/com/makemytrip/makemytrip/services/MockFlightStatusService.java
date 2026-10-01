package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.FlightStatus;
import com.makemytrip.makemytrip.models.FlightStatusHistory;
import com.makemytrip.makemytrip.repositories.FlightStatusRepository;
import com.makemytrip.makemytrip.repositories.FlightStatusHistoryRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class MockFlightStatusService {

    @Autowired
    private FlightStatusRepository flightStatusRepository;

    @Autowired
    private FlightStatusHistoryRepository flightStatusHistoryRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    /*
     * =========================================================
     * DEMO CONFIGURATION
     * =========================================================
     */

    private static final int MAX_DEMO_FLIGHTS = 3;

    /*
     * Every 30 real seconds:
     * 15 simulated minutes pass.
     */
    private static final int SIMULATION_MINUTES_PER_TICK = 15;

    /*
     * Initial delay.
     */
    private static final int INITIAL_DELAY_MINUTES = 60;

    /*
     * Later the delay increases to demonstrate
     * a delay-update notification.
     */
    private static final int UPDATED_DELAY_MINUTES = 75;

    private static final String INITIAL_DELAY_REASON =
            "Weather conditions";

    private static final String UPDATED_DELAY_REASON =
            "Weather conditions and air traffic";

    /*
     * =========================================================
     * SIMULATION STATE
     * =========================================================
     */

    private LocalDateTime simulatedTime = null;

    /*
     * Keep the same flights during this backend run.
     */
    private final Set<String> activeFlightIds =
            new HashSet<>();

    /*
     * Stores the last state that was processed for
     * each flight.
     *
     * This prevents duplicate notifications.
     */
    private final Map<String, FlightSnapshot> lastSnapshots =
            new HashMap<>();

    /*
     * =========================================================
     * MAIN SIMULATOR
     * =========================================================
     */

    @Scheduled(fixedRate = 30000)
    public void simulateFlightStatus() {

        List<FlightStatus> allFlights =
                flightStatusRepository.findAll();

        if (allFlights.isEmpty()) {

            System.out.println(
                    "ℹ️ No flight statuses found."
            );

            return;
        }

        List<FlightStatus> demoFlights =
                getDemoFlights(allFlights);

        if (demoFlights.isEmpty()) {
            return;
        }

        /*
         * -----------------------------------------------------
         * INITIALIZE SIMULATED TIME
         * -----------------------------------------------------
         */

        if (simulatedTime == null) {

            Optional<LocalDateTime> earliestDeparture =
                    demoFlights.stream()
                            .map(FlightStatus::getScheduledDeparture)
                            .filter(value ->
                                    value != null &&
                                    !value.isBlank()
                            )
                            .map(this::parseDateTime)
                            .filter(value -> value != null)
                            .min(Comparator.naturalOrder());

            if (earliestDeparture.isEmpty()) {

                System.out.println(
                        "⚠️ No valid scheduled departure found."
                );

                return;
            }

            /*
             * Start one hour before earliest flight.
             */
            simulatedTime =
                    earliestDeparture
                            .get()
                            .minusHours(1);

            System.out.println(
                    "\n========================================"
            );

            System.out.println(
                    "✈️ MOCK FLIGHT SIMULATION STARTED"
            );

            System.out.println(
                    "🕐 Simulation start: "
                            + simulatedTime
            );

            System.out.println(
                    "✈️ Active demo flights: "
                            + demoFlights.size()
            );

            for (FlightStatus flight :
                    demoFlights) {

                System.out.println(
                        "   • "
                                + flight.getFlightId()
                                + " | "
                                + flight.getScheduledDeparture()
                );
            }

            System.out.println(
                    "========================================\n"
            );
        }

        /*
         * -----------------------------------------------------
         * MOVE SIMULATED CLOCK
         * -----------------------------------------------------
         */

        simulatedTime =
                simulatedTime.plusMinutes(
                        SIMULATION_MINUTES_PER_TICK
                );

        System.out.println(
                "\n⏱️ SIMULATED TIME: "
                        + simulatedTime
        );

        /*
         * -----------------------------------------------------
         * PROCESS DEMO FLIGHTS
         * -----------------------------------------------------
         */

        for (FlightStatus flightStatus :
                demoFlights) {

            updateFlightStatus(
                    flightStatus
            );
        }
    }

    /*
     * =========================================================
     * SELECT MAXIMUM 3 DEMO FLIGHTS
     * =========================================================
     */

    private List<FlightStatus> getDemoFlights(
            List<FlightStatus> allFlights
    ) {

        /*
         * Keep the same flights during this backend run.
         */
        if (!activeFlightIds.isEmpty()) {

            List<FlightStatus> activeFlights =
                    allFlights.stream()
                            .filter(flight ->
                                    activeFlightIds.contains(
                                            flight.getFlightId()
                                    )
                            )
                            .limit(MAX_DEMO_FLIGHTS)
                            .toList();

            if (!activeFlights.isEmpty()) {

                return activeFlights;
            }

            activeFlightIds.clear();
        }

        /*
         * Find flights closest to current date/time.
         */
        LocalDateTime now =
                LocalDateTime.now();

        List<FlightStatus> selectedFlights =
                allFlights.stream()

                        .filter(flight ->
                                flight.getFlightId() != null
                        )

                        .filter(flight ->
                                flight.getScheduledDeparture() != null
                        )

                        .filter(flight ->
                                !flight
                                        .getScheduledDeparture()
                                        .isBlank()
                        )

                        .sorted(
                                Comparator.comparingLong(
                                        flight -> {

                                            LocalDateTime departure =
                                                    parseDateTime(
                                                            flight.getScheduledDeparture()
                                                    );

                                            if (departure == null) {

                                                return Long.MAX_VALUE;
                                            }

                                            return Math.abs(
                                                    Duration
                                                            .between(
                                                                    now,
                                                                    departure
                                                            )
                                                            .toMinutes()
                                            );
                                        }
                                )
                        )

                        .limit(MAX_DEMO_FLIGHTS)

                        .toList();

        /*
         * Remember selected flights.
         */
        for (FlightStatus flight :
                selectedFlights) {

            activeFlightIds.add(
                    flight.getFlightId()
            );
        }

        return selectedFlights;
    }

    /*
     * =========================================================
     * UPDATE ONE FLIGHT
     * =========================================================
     */

    private void updateFlightStatus(
            FlightStatus flightStatus
    ) {

        String flightId =
                flightStatus.getFlightId();

        LocalDateTime scheduledDeparture =
                parseDateTime(
                        flightStatus.getScheduledDeparture()
                );

        LocalDateTime scheduledArrival =
                parseDateTime(
                        flightStatus.getScheduledArrival()
                );

        if (
                scheduledDeparture == null ||
                scheduledArrival == null
        ) {

            System.out.println(
                    "⚠️ Invalid schedule for flight "
                            + flightId
            );

            return;
        }

        /*
         * -----------------------------------------------------
         * DETERMINE CURRENT DELAY
         * -----------------------------------------------------
         *
         * Before scheduled departure:
         *
         * 60 minute delay
         *
         * At/after scheduled departure:
         *
         * 75 minute delay
         *
         * This creates a delay-only update while the flight
         * remains DELAYED.
         */

        int currentDelay;

        String currentDelayReason;

        if (
                simulatedTime.isBefore(
                        scheduledDeparture
                )
        ) {

            currentDelay =
                    INITIAL_DELAY_MINUTES;

            currentDelayReason =
                    INITIAL_DELAY_REASON;

        } else {

            currentDelay =
                    UPDATED_DELAY_MINUTES;

            currentDelayReason =
                    UPDATED_DELAY_REASON;
        }

        /*
         * Revised departure.
         */
        LocalDateTime estimatedDeparture =
                scheduledDeparture.plusMinutes(
                        currentDelay
                );

        /*
         * Revised arrival.
         */
        LocalDateTime estimatedArrival =
                scheduledArrival.plusMinutes(
                        currentDelay
                );

        /*
         * -----------------------------------------------------
         * DETERMINE STATUS
         * -----------------------------------------------------
         */

        String newStatus;

        /*
         * ON_TIME
         */
        if (
                simulatedTime.isBefore(
                        scheduledDeparture.minusMinutes(30)
                )
        ) {

            newStatus = "ON_TIME";
        }

        /*
         * BOARDING
         */
        else if (
                !simulatedTime.isBefore(
                        scheduledDeparture.minusMinutes(30)
                )
                &&
                simulatedTime.isBefore(
                        scheduledDeparture.minusMinutes(15)
                )
        ) {

            newStatus = "BOARDING";
        }

        /*
         * DELAYED
         */
        else if (
                !simulatedTime.isBefore(
                        scheduledDeparture.minusMinutes(15)
                )
                &&
                simulatedTime.isBefore(
                        estimatedDeparture
                )
        ) {

            newStatus = "DELAYED";
        }

        /*
         * DEPARTED
         */
        else if (
                !simulatedTime.isBefore(
                        estimatedDeparture
                )
                &&
                simulatedTime.isBefore(
                        estimatedDeparture.plusMinutes(30)
                )
        ) {

            newStatus = "DEPARTED";
        }

        /*
         * IN FLIGHT
         */
        else if (
                !simulatedTime.isBefore(
                        estimatedDeparture.plusMinutes(30)
                )
                &&
                simulatedTime.isBefore(
                        estimatedArrival
                )
        ) {

            newStatus = "IN_FLIGHT";
        }

        /*
         * LANDED
         */
        else {

            newStatus = "LANDED";
        }

        /*
         * -----------------------------------------------------
         * SIMULATE ETA CHANGE WHILE IN FLIGHT
         * -----------------------------------------------------
         *
         * After 45 simulated minutes in flight,
         * estimated arrival moves by another 15 minutes.
         *
         * Status remains IN_FLIGHT.
         *
         * This tests ETA-only notifications.
         */

        LocalDateTime finalEstimatedArrival =
                estimatedArrival;

        LocalDateTime inFlightStart =
                estimatedDeparture.plusMinutes(30);

        if (
                newStatus.equals("IN_FLIGHT")
                &&
                !simulatedTime.isBefore(
                        inFlightStart.plusMinutes(45)
                )
        ) {

            finalEstimatedArrival =
                    estimatedArrival.plusMinutes(15);
        }

        /*
         * -----------------------------------------------------
         * CREATE CURRENT SNAPSHOT
         * -----------------------------------------------------
         */

        FlightSnapshot currentSnapshot =
                new FlightSnapshot(
                        newStatus,
                        currentDelay,
                        currentDelayReason,
                        estimatedDeparture.toString(),
                        finalEstimatedArrival.toString()
                );

        /*
         * -----------------------------------------------------
         * PREVIOUS SNAPSHOT
         * -----------------------------------------------------
         */

        FlightSnapshot previousSnapshot =
                lastSnapshots.get(
                        flightId
                );

        /*
         * First observation.
         */
        boolean firstObservation =
                previousSnapshot == null;

        /*
         * -----------------------------------------------------
         * DETECT CHANGES
         * -----------------------------------------------------
         */

        boolean statusChanged =
                firstObservation
                        ||
                !previousSnapshot.status.equals(
                        currentSnapshot.status
                );

        boolean delayChanged =
                firstObservation
                        ||
                previousSnapshot.delayMinutes
                        != currentSnapshot.delayMinutes;

        boolean delayReasonChanged =
                firstObservation
                        ||
                !previousSnapshot.delayReason.equals(
                        currentSnapshot.delayReason
                );

        boolean departureChanged =
                firstObservation
                        ||
                !previousSnapshot.estimatedDeparture.equals(
                        currentSnapshot.estimatedDeparture
                );

        boolean arrivalChanged =
                firstObservation
                        ||
                !previousSnapshot.estimatedArrival.equals(
                        currentSnapshot.estimatedArrival
                );

        /*
         * ANY important flight information changed.
         */
        boolean importantChange =
                statusChanged
                        ||
                delayChanged
                        ||
                delayReasonChanged
                        ||
                departureChanged
                        ||
                arrivalChanged;

        /*
         * -----------------------------------------------------
         * UPDATE DATABASE
         * -----------------------------------------------------
         */

        flightStatus.setStatus(
                newStatus
        );

        flightStatus.setDelayMinutes(
                currentDelay
        );

        flightStatus.setDelayReason(
                currentDelayReason
        );

        flightStatus.setEstimatedDeparture(
                estimatedDeparture.toString()
        );

        flightStatus.setEstimatedArrival(
                finalEstimatedArrival.toString()
        );

        flightStatusRepository.save(
                flightStatus
        );

        /*
         * -----------------------------------------------------
         * FIRST OBSERVATION
         * -----------------------------------------------------
         */

        if (firstObservation) {

            saveHistory(
                    flightId,
                    currentSnapshot
            );

            lastSnapshots.put(
                    flightId,
                    currentSnapshot
            );

            System.out.println(
                    "🟢 Initial status saved WITHOUT notification: "
                            + flightId
                            + " → "
                            + newStatus
            );

            System.out.println(
                    "✈️ Flight "
                            + flightId
                            + " → "
                            + newStatus
                            + " | Baseline established"
                            + " | Simulated time: "
                            + simulatedTime
            );

            return;
        }

        /*
         * -----------------------------------------------------
         * IMPORTANT CHANGE
         * -----------------------------------------------------
         */

        if (importantChange) {

            saveHistory(
                    flightId,
                    currentSnapshot
            );

            /*
             * Notification title.
             */
            String notificationTitle =
                    "✈️ Flight Update";

            /*
             * Notification body.
             */
            StringBuilder notificationBody =
                    new StringBuilder();

            notificationBody.append(
                    "Flight "
            );

            notificationBody.append(
                    flightId
            );

            notificationBody.append(
                    " has an update. "
            );

            /*
             * STATUS CHANGE
             */
            if (statusChanged) {

                notificationBody.append(
                        "Status: "
                );

                notificationBody.append(
                        previousSnapshot.status
                );

                notificationBody.append(
                        " → "
                );

                notificationBody.append(
                        currentSnapshot.status
                );

                notificationBody.append(
                        ". "
                );
            }

            /*
             * DELAY CHANGE
             */
            if (delayChanged) {

                notificationBody.append(
                        "Delay: "
                );

                notificationBody.append(
                        currentSnapshot.delayMinutes
                );

                notificationBody.append(
                        " minutes. "
                );
            }

            /*
             * DELAY REASON CHANGE
             */
            if (delayReasonChanged) {

                notificationBody.append(
                        "Reason: "
                );

                notificationBody.append(
                        currentSnapshot.delayReason
                );

                notificationBody.append(
                        ". "
                );
            }

            /*
             * ESTIMATED DEPARTURE CHANGE
             */
            if (departureChanged) {

                notificationBody.append(
                        "Estimated departure: "
                );

                notificationBody.append(
                        currentSnapshot.estimatedDeparture
                );

                notificationBody.append(
                        ". "
                );
            }

            /*
             * ESTIMATED ARRIVAL CHANGE
             */
            if (arrivalChanged) {

                notificationBody.append(
                        "Estimated arrival: "
                );

                notificationBody.append(
                        currentSnapshot.estimatedArrival
                );

                notificationBody.append(
                        "."
                );
            }

            /*
             * Open exact flight when notification is clicked.
             */
            String notificationUrl =
                    "/flight-status?flightId="
                            + flightId;

            try {

                pushNotificationService.sendToAll(
                        notificationTitle,
                        notificationBody.toString(),
                        notificationUrl
                );

                System.out.println(
                        "🔔 PUSH SENT FOR FLIGHT UPDATE: "
                                + flightId
                );

                System.out.println(
                        "   Status changed: "
                                + statusChanged
                );

                System.out.println(
                        "   Delay changed: "
                                + delayChanged
                );

                System.out.println(
                        "   Departure changed: "
                                + departureChanged
                );

                System.out.println(
                        "   Arrival changed: "
                                + arrivalChanged
                );

            } catch (Exception error) {

                System.err.println(
                        "❌ Failed to send Web Push for flight "
                                + flightId
                );

                System.err.println(
                        "Reason: "
                                + error.getMessage()
                );
            }

            System.out.println(
                    "✈️ Flight "
                            + flightId
                            + " → "
                            + newStatus
                            + " | History saved"
                            + " | Simulated time: "
                            + simulatedTime
            );

        } else {

            /*
             * Nothing changed.
             */
            System.out.println(
                    "✈️ Flight "
                            + flightId
                            + " → "
                            + newStatus
                            + " | No important change"
                            + " | No notification"
            );
        }

        /*
         * Save current snapshot for next cycle.
         */
        lastSnapshots.put(
                flightId,
                currentSnapshot
        );
    }

    /*
     * =========================================================
     * SAVE HISTORY
     * =========================================================
     */

    private void saveHistory(
            String flightId,
            FlightSnapshot snapshot
    ) {

        FlightStatusHistory history =
                new FlightStatusHistory();

        history.setFlightId(
                flightId
        );

        history.setStatus(
                snapshot.status
        );

        history.setDelayMinutes(
                snapshot.delayMinutes
        );

        history.setDelayReason(
                snapshot.delayReason
        );

        history.setEstimatedDeparture(
                snapshot.estimatedDeparture
        );

        history.setEstimatedArrival(
                snapshot.estimatedArrival
        );

        history.setUpdatedAt(
                simulatedTime.toString()
        );

        flightStatusHistoryRepository.save(
                history
        );
    }

    /*
     * =========================================================
     * DATE/TIME PARSER
     * =========================================================
     */

    private LocalDateTime parseDateTime(
            String dateTime
    ) {

        try {

            return LocalDateTime.parse(
                    dateTime
            );

        } catch (Exception error) {

            System.out.println(
                    "⚠️ Could not parse date/time: "
                            + dateTime
            );

            return null;
        }
    }

    /*
     * =========================================================
     * FLIGHT SNAPSHOT
     * =========================================================
     */

    private static class FlightSnapshot {

        private final String status;

        private final int delayMinutes;

        private final String delayReason;

        private final String estimatedDeparture;

        private final String estimatedArrival;

        private FlightSnapshot(
                String status,
                int delayMinutes,
                String delayReason,
                String estimatedDeparture,
                String estimatedArrival
        ) {

            this.status =
                    status;

            this.delayMinutes =
                    delayMinutes;

            this.delayReason =
                    delayReason;

            this.estimatedDeparture =
                    estimatedDeparture;

            this.estimatedArrival =
                    estimatedArrival;
        }
    }
}