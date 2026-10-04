package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "hotels")
public class Hotel {

    @Id
    private String _id;

    private String hotelName;
    private String location;
    private double pricePerNight;

    /*
     * Total room availability.
     * This remains for compatibility with the existing frontend.
     */
    private int availableRooms;

    /*
     * TASK 4 - Room type availability.
     */
    private int standardRooms;
    private int deluxeRooms;
    private int premiumRooms;

    private String amenities;

    // =========================================================
    // ID
    // =========================================================

    public String getId() {
        return _id;
    }

    public void setId(String id) {
        this._id = id;
    }

    // =========================================================
    // HOTEL DETAILS
    // =========================================================

    public String gethotelName() {
        return hotelName;
    }

    public void sethotelName(String hotelName) {
        this.hotelName = hotelName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public double getPricePerNight() {
        return pricePerNight;
    }

    public void setPricePerNight(double pricePerNight) {
        this.pricePerNight = pricePerNight;
    }

    // =========================================================
    // TOTAL AVAILABILITY
    // =========================================================

    public int getAvailableRooms() {
        return availableRooms;
    }

    public void setAvailableRooms(int availableRooms) {
        this.availableRooms = availableRooms;
    }

    // =========================================================
    // ROOM TYPE AVAILABILITY
    // =========================================================

    public int getStandardRooms() {
        initializeRoomTypeAvailabilityIfNeeded();
        return standardRooms;
    }

    public void setStandardRooms(int standardRooms) {
        this.standardRooms = Math.max(0, standardRooms);
    }

    public int getDeluxeRooms() {
        initializeRoomTypeAvailabilityIfNeeded();
        return deluxeRooms;
    }

    public void setDeluxeRooms(int deluxeRooms) {
        this.deluxeRooms = Math.max(0, deluxeRooms);
    }

    public int getPremiumRooms() {
        initializeRoomTypeAvailabilityIfNeeded();
        return premiumRooms;
    }

    public void setPremiumRooms(int premiumRooms) {
        this.premiumRooms = Math.max(0, premiumRooms);
    }

    /*
     * Existing hotels were created before room-type inventory
     * was added. Their MongoDB documents therefore have
     * standardRooms/deluxeRooms/premiumRooms as 0.
     *
     * We split the old total automatically:
     *
     * Standard = 50%
     * Deluxe   = 30%
     * Premium  = remainder
     *
     * Example:
     * 30 total -> 15 Standard, 9 Deluxe, 6 Premium
     *
     * Once initialized, these values are persisted by the
     * booking operation.
     */
    public void initializeRoomTypeAvailabilityIfNeeded() {

        if (availableRooms <= 0) {
            standardRooms = 0;
            deluxeRooms = 0;
            premiumRooms = 0;
            return;
        }

        int roomTypeTotal =
                standardRooms
                        + deluxeRooms
                        + premiumRooms;

        if (roomTypeTotal == 0) {

            standardRooms =
                    (int) Math.ceil(availableRooms * 0.50);

            deluxeRooms =
                    (int) Math.floor(availableRooms * 0.30);

            premiumRooms =
                    availableRooms
                            - standardRooms
                            - deluxeRooms;
        }
    }

    // =========================================================
    // AMENITIES
    // =========================================================

    public void setamenities(String amenities) {
        this.amenities = amenities;
    }

    public String getamenities() {
        return amenities;
    }
}
