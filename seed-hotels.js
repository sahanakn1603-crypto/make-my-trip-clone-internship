/*
 * ============================================================
 * MAKE MY TRIP - HOTEL SEED SCRIPT
 * ============================================================
 *
 * This script makes sure we have hotel data for:
 *
 * Bengaluru
 * Mumbai
 * Hyderabad
 * Goa
 * Chennai
 * Delhi
 * Kolkata
 * Pune
 * Ahmedabad
 * Jaipur
 *
 * Target:
 * 5 hotels per city
 *
 * Existing hotels are NOT deleted.
 * Existing hotel names are NOT duplicated.
 *
 * Backend must be running on:
 * http://localhost:8080
 * ============================================================
 */

const BACKEND_URL = "http://localhost:8080";

const TARGET_HOTELS_PER_CITY = 5;


/*
 * ============================================================
 * HOTEL DATA
 * ============================================================
 *
 * These are PROJECT/MOCK hotel records for your internship
 * application. They are not claiming to be real hotel
 * inventory.
 * ============================================================
 */

const hotels = [

    // =========================================================
    // BENGALURU
    // =========================================================

    {
        hotelName: "Bengaluru Grand Palace",
        location: "Bengaluru",
        pricePerNight: 4200,
        availableRooms: 35,
        amenities:
            "Free WiFi, Breakfast, Swimming Pool, Gym, Parking, Restaurant"
    },

    {
        hotelName: "Silicon Valley Residency",
        location: "Bengaluru",
        pricePerNight: 3200,
        availableRooms: 40,
        amenities:
            "Free WiFi, Breakfast, Parking, Air Conditioning, Restaurant"
    },

    {
        hotelName: "Garden City Suites",
        location: "Bengaluru",
        pricePerNight: 5600,
        availableRooms: 28,
        amenities:
            "Free WiFi, Pool, Gym, Spa, Breakfast, Parking"
    },

    {
        hotelName: "Royal Bengaluru Hotel",
        location: "Bengaluru",
        pricePerNight: 6800,
        availableRooms: 25,
        amenities:
            "Free WiFi, Swimming Pool, Spa, Gym, Restaurant, Airport Transfer"
    },

    {
        hotelName: "MG Road Comfort Inn",
        location: "Bengaluru",
        pricePerNight: 2900,
        availableRooms: 45,
        amenities:
            "Free WiFi, Breakfast, Parking, Restaurant, Air Conditioning"
    },


    // =========================================================
    // MUMBAI
    // =========================================================

    {
        hotelName: "Mumbai Marine Residency",
        location: "Mumbai",
        pricePerNight: 6200,
        availableRooms: 30,
        amenities:
            "Free WiFi, Breakfast, Restaurant, Gym, Parking"
    },

    {
        hotelName: "Gateway City Hotel",
        location: "Mumbai",
        pricePerNight: 7500,
        availableRooms: 24,
        amenities:
            "Free WiFi, Pool, Spa, Gym, Restaurant, Breakfast"
    },

    {
        hotelName: "Mumbai Central Suites",
        location: "Mumbai",
        pricePerNight: 4800,
        availableRooms: 38,
        amenities:
            "Free WiFi, Breakfast, Parking, Restaurant, Air Conditioning"
    },

    {
        hotelName: "Bandra Executive Stay",
        location: "Mumbai",
        pricePerNight: 5800,
        availableRooms: 32,
        amenities:
            "Free WiFi, Gym, Breakfast, Restaurant, Parking"
    },

    {
        hotelName: "Mumbai Airport Comfort",
        location: "Mumbai",
        pricePerNight: 3900,
        availableRooms: 42,
        amenities:
            "Free WiFi, Airport Transfer, Breakfast, Parking, Restaurant"
    },


    // =========================================================
    // HYDERABAD
    // =========================================================

    {
        hotelName: "Hyderabad Pearl Grand",
        location: "Hyderabad",
        pricePerNight: 3900,
        availableRooms: 36,
        amenities:
            "Free WiFi, Breakfast, Pool, Gym, Parking"
    },

    {
        hotelName: "Charminar Heritage Hotel",
        location: "Hyderabad",
        pricePerNight: 3400,
        availableRooms: 40,
        amenities:
            "Free WiFi, Breakfast, Restaurant, Parking"
    },

    {
        hotelName: "Hitech City Residency",
        location: "Hyderabad",
        pricePerNight: 5200,
        availableRooms: 30,
        amenities:
            "Free WiFi, Gym, Breakfast, Restaurant, Parking"
    },

    {
        hotelName: "Deccan Royal Suites",
        location: "Hyderabad",
        pricePerNight: 6500,
        availableRooms: 26,
        amenities:
            "Free WiFi, Pool, Spa, Gym, Restaurant, Breakfast"
    },

    {
        hotelName: "Hyderabad Business Inn",
        location: "Hyderabad",
        pricePerNight: 3000,
        availableRooms: 48,
        amenities:
            "Free WiFi, Breakfast, Parking, Air Conditioning"
    },


    // =========================================================
    // GOA
    // =========================================================

    {
        hotelName: "Goa Beach Resort",
        location: "Goa",
        pricePerNight: 6500,
        availableRooms: 30,
        amenities:
            "Beach Access, Pool, Free WiFi, Breakfast, Restaurant, Spa"
    },

    {
        hotelName: "Palm Paradise Goa",
        location: "Goa",
        pricePerNight: 5200,
        availableRooms: 35,
        amenities:
            "Swimming Pool, Free WiFi, Breakfast, Parking, Restaurant"
    },

    {
        hotelName: "Sunset Bay Resort",
        location: "Goa",
        pricePerNight: 7800,
        availableRooms: 22,
        amenities:
            "Beach Access, Pool, Spa, Breakfast, Restaurant, Bar"
    },

    {
        hotelName: "Goa Holiday Suites",
        location: "Goa",
        pricePerNight: 4200,
        availableRooms: 40,
        amenities:
            "Free WiFi, Pool, Breakfast, Parking, Restaurant"
    },

    {
        hotelName: "Palm Grove Residency",
        location: "Goa",
        pricePerNight: 3500,
        availableRooms: 45,
        amenities:
            "Free WiFi, Breakfast, Parking, Air Conditioning"
    },


    // =========================================================
    // CHENNAI
    // =========================================================

    {
        hotelName: "Chennai Marina Grand",
        location: "Chennai",
        pricePerNight: 4500,
        availableRooms: 35,
        amenities:
            "Free WiFi, Breakfast, Pool, Gym, Restaurant"
    },

    {
        hotelName: "Chennai Central Residency",
        location: "Chennai",
        pricePerNight: 3200,
        availableRooms: 42,
        amenities:
            "Free WiFi, Breakfast, Parking, Restaurant"
    },

    {
        hotelName: "T Nagar Comfort Suites",
        location: "Chennai",
        pricePerNight: 3900,
        availableRooms: 38,
        amenities:
            "Free WiFi, Breakfast, Gym, Parking"
    },

    {
        hotelName: "Bay View Chennai",
        location: "Chennai",
        pricePerNight: 6200,
        availableRooms: 28,
        amenities:
            "Sea View, Pool, Free WiFi, Breakfast, Restaurant, Spa"
    },

    {
        hotelName: "Chennai Business Hotel",
        location: "Chennai",
        pricePerNight: 2900,
        availableRooms: 50,
        amenities:
            "Free WiFi, Breakfast, Parking, Air Conditioning"
    },


    // =========================================================
    // DELHI
    // =========================================================

    {
        hotelName: "Delhi Capital Grand",
        location: "Delhi",
        pricePerNight: 5200,
        availableRooms: 35,
        amenities:
            "Free WiFi, Breakfast, Pool, Gym, Restaurant"
    },

    {
        hotelName: "New Delhi Central Hotel",
        location: "Delhi",
        pricePerNight: 4500,
        availableRooms: 40,
        amenities:
            "Free WiFi, Breakfast, Parking, Restaurant"
    },

    {
        hotelName: "Connaught Place Residency",
        location: "Delhi",
        pricePerNight: 6200,
        availableRooms: 30,
        amenities:
            "Free WiFi, Gym, Breakfast, Restaurant, Parking"
    },

    {
        hotelName: "Delhi Airport Suites",
        location: "Delhi",
        pricePerNight: 3900,
        availableRooms: 45,
        amenities:
            "Free WiFi, Airport Transfer, Breakfast, Parking"
    },

    {
        hotelName: "Royal Delhi Palace",
        location: "Delhi",
        pricePerNight: 7500,
        availableRooms: 25,
        amenities:
            "Free WiFi, Pool, Spa, Gym, Restaurant, Breakfast"
    },


    // =========================================================
    // KOLKATA
    // =========================================================

    {
        hotelName: "Kolkata Heritage Grand",
        location: "Kolkata",
        pricePerNight: 4200,
        availableRooms: 35,
        amenities:
            "Free WiFi, Breakfast, Restaurant, Pool, Parking"
    },

    {
        hotelName: "City of Joy Residency",
        location: "Kolkata",
        pricePerNight: 3000,
        availableRooms: 45,
        amenities:
            "Free WiFi, Breakfast, Parking, Restaurant"
    },

    {
        hotelName: "Park Street Suites",
        location: "Kolkata",
        pricePerNight: 5200,
        availableRooms: 30,
        amenities:
            "Free WiFi, Gym, Breakfast, Restaurant, Parking"
    },

    {
        hotelName: "Kolkata Royal Stay",
        location: "Kolkata",
        pricePerNight: 6500,
        availableRooms: 25,
        amenities:
            "Free WiFi, Pool, Spa, Gym, Breakfast, Restaurant"
    },

    {
        hotelName: "Howrah Comfort Hotel",
        location: "Kolkata",
        pricePerNight: 2800,
        availableRooms: 50,
        amenities:
            "Free WiFi, Breakfast, Parking, Air Conditioning"
    },


    // =========================================================
    // PUNE
    // =========================================================

    {
        hotelName: "Pune Grand Residency",
        location: "Pune",
        pricePerNight: 3900,
        availableRooms: 38,
        amenities:
            "Free WiFi, Breakfast, Pool, Gym, Parking"
    },

    {
        hotelName: "Pune Central Suites",
        location: "Pune",
        pricePerNight: 3200,
        availableRooms: 45,
        amenities:
            "Free WiFi, Breakfast, Parking, Restaurant"
    },

    {
        hotelName: "Koregaon Park Hotel",
        location: "Pune",
        pricePerNight: 5200,
        availableRooms: 30,
        amenities:
            "Free WiFi, Gym, Breakfast, Restaurant, Parking"
    },

    {
        hotelName: "Pune Business Inn",
        location: "Pune",
        pricePerNight: 2800,
        availableRooms: 50,
        amenities:
            "Free WiFi, Breakfast, Parking, Air Conditioning"
    },

    {
        hotelName: "Royal Pune Suites",
        location: "Pune",
        pricePerNight: 6200,
        availableRooms: 26,
        amenities:
            "Free WiFi, Pool, Spa, Gym, Breakfast, Restaurant"
    },


    // =========================================================
    // AHMEDABAD
    // =========================================================

    {
        hotelName: "Ahmedabad Heritage Hotel",
        location: "Ahmedabad",
        pricePerNight: 3600,
        availableRooms: 40,
        amenities:
            "Free WiFi, Breakfast, Restaurant, Parking"
    },

    {
        hotelName: "Sabarmati Grand Residency",
        location: "Ahmedabad",
        pricePerNight: 4200,
        availableRooms: 35,
        amenities:
            "Free WiFi, Pool, Gym, Breakfast, Parking"
    },

    {
        hotelName: "Ahmedabad City Suites",
        location: "Ahmedabad",
        pricePerNight: 3000,
        availableRooms: 45,
        amenities:
            "Free WiFi, Breakfast, Parking, Restaurant"
    },

    {
        hotelName: "Gujarat Royal Palace",
        location: "Ahmedabad",
        pricePerNight: 5800,
        availableRooms: 28,
        amenities:
            "Free WiFi, Pool, Spa, Gym, Restaurant, Breakfast"
    },

    {
        hotelName: "Ahmedabad Business Inn",
        location: "Ahmedabad",
        pricePerNight: 2700,
        availableRooms: 50,
        amenities:
            "Free WiFi, Breakfast, Parking, Air Conditioning"
    },


    // =========================================================
    // JAIPUR
    // =========================================================

    {
        hotelName: "Jaipur Heritage Palace",
        location: "Jaipur",
        pricePerNight: 4800,
        availableRooms: 35,
        amenities:
            "Free WiFi, Breakfast, Pool, Restaurant, Parking"
    },

    {
        hotelName: "Pink City Residency",
        location: "Jaipur",
        pricePerNight: 3500,
        availableRooms: 42,
        amenities:
            "Free WiFi, Breakfast, Restaurant, Parking"
    },

    {
        hotelName: "Amber Fort Suites",
        location: "Jaipur",
        pricePerNight: 6200,
        availableRooms: 28,
        amenities:
            "Free WiFi, Pool, Spa, Breakfast, Restaurant"
    },

    {
        hotelName: "Royal Rajasthan Hotel",
        location: "Jaipur",
        pricePerNight: 7200,
        availableRooms: 24,
        amenities:
            "Free WiFi, Pool, Spa, Gym, Breakfast, Restaurant"
    },

    {
        hotelName: "Jaipur Central Comfort",
        location: "Jaipur",
        pricePerNight: 2900,
        availableRooms: 48,
        amenities:
            "Free WiFi, Breakfast, Parking, Air Conditioning"
    }
];


/*
 * ============================================================
 * NORMALIZE CITY NAME
 * ============================================================
 */

function normalizeCity(city) {

    return String(city || "")
        .trim()
        .toLowerCase()
        .replace("bangalore", "bengaluru");
}


/*
 * ============================================================
 * MAIN FUNCTION
 * ============================================================
 */

async function seedHotels() {

    console.log("");
    console.log("==============================================");
    console.log(" MAKE MY TRIP HOTEL DATA SEEDER");
    console.log("==============================================");
    console.log("");


    /*
     * ----------------------------------------------------------
     * GET EXISTING HOTELS
     * ----------------------------------------------------------
     */

    let existingHotels;

    try {

        const response = await fetch(
            `${BACKEND_URL}/hotel`
        );

        if (!response.ok) {

            throw new Error(
                `Backend returned HTTP ${response.status}`
            );
        }

        existingHotels = await response.json();

    } catch (error) {

        console.error("");
        console.error("❌ Could not connect to backend.");
        console.error("");
        console.error(
            "Make sure Spring Boot is running on:"
        );
        console.error(
            "http://localhost:8080"
        );
        console.error("");
        console.error("Error:", error.message);

        process.exit(1);
    }


    console.log(
        `Existing hotels found: ${existingHotels.length}`
    );

    console.log("");


    /*
     * ----------------------------------------------------------
     * COUNT EXISTING HOTELS BY CITY
     * ----------------------------------------------------------
     */

    const existingByCity = {};

    for (const hotel of existingHotels) {

        const city = normalizeCity(
            hotel.location
        );

        if (!existingByCity[city]) {
            existingByCity[city] = [];
        }

        existingByCity[city].push(hotel);
    }


    /*
     * ----------------------------------------------------------
     * PREVENT DUPLICATE HOTEL NAMES
     * ----------------------------------------------------------
     */

    const existingNames = new Set(
        existingHotels
            .map((hotel) =>
                String(hotel.hotelName || "")
                    .trim()
                    .toLowerCase()
            )
    );


    /*
     * ----------------------------------------------------------
     * DETERMINE WHAT NEEDS TO BE ADDED
     * ----------------------------------------------------------
     */

    const hotelsToAdd = [];

    const cities = [
        "Bengaluru",
        "Mumbai",
        "Hyderabad",
        "Goa",
        "Chennai",
        "Delhi",
        "Kolkata",
        "Pune",
        "Ahmedabad",
        "Jaipur"
    ];


    for (const city of cities) {

        const normalizedCity =
            normalizeCity(city);

        const currentHotels =
            existingByCity[normalizedCity] || [];

        const currentCount =
            currentHotels.length;

        const required =
            Math.max(
                0,
                TARGET_HOTELS_PER_CITY - currentCount
            );


        console.log(
            `${city}: ${currentCount} existing → ${required} to add`
        );


        if (required === 0) {
            continue;
        }


        /*
         * Get available hotel records for this city.
         */

        const cityHotels =
            hotels.filter(
                (hotel) =>
                    normalizeCity(
                        hotel.location
                    ) === normalizedCity
            );


        let addedForCity = 0;


        for (const hotel of cityHotels) {

            if (
                addedForCity >= required
            ) {
                break;
            }


            const normalizedName =
                hotel.hotelName
                    .trim()
                    .toLowerCase();


            if (
                existingNames.has(
                    normalizedName
                )
            ) {
                continue;
            }


            hotelsToAdd.push(hotel);

            existingNames.add(
                normalizedName
            );

            addedForCity++;
        }
    }


    /*
     * ----------------------------------------------------------
     * NOTHING TO ADD
     * ----------------------------------------------------------
     */

    if (hotelsToAdd.length === 0) {

        console.log("");
        console.log(
            "✅ All 10 cities already have enough hotel data."
        );
        console.log("");

        return;
    }


    /*
     * ----------------------------------------------------------
     * INSERT HOTELS
     * ----------------------------------------------------------
     *
     * We intentionally send one request at a time.
     * This makes the script easier to debug if one record fails.
     * ----------------------------------------------------------
     */

    console.log("");
    console.log(
        `Adding ${hotelsToAdd.length} hotel records...`
    );
    console.log("");


    let successCount = 0;
    let failedCount = 0;


    for (const hotel of hotelsToAdd) {

        try {

            const response = await fetch(
                `${BACKEND_URL}/admin/hotel`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(hotel)
                }
            );


            if (!response.ok) {

                const errorText =
                    await response.text();

                throw new Error(
                    `HTTP ${response.status}: ${errorText}`
                );
            }


            const savedHotel =
                await response.json();


            console.log(
                `✅ ${hotel.location} → ${hotel.hotelName}`
            );


            successCount++;

        } catch (error) {

            console.error(
                `❌ ${hotel.location} → ${hotel.hotelName}`
            );

            console.error(
                `   ${error.message}`
            );

            failedCount++;
        }
    }


    /*
     * ----------------------------------------------------------
     * FINAL RESULT
     * ----------------------------------------------------------
     */

    console.log("");
    console.log("==============================================");
    console.log(" HOTEL SEEDING COMPLETED");
    console.log("==============================================");
    console.log(
        `Successfully added: ${successCount}`
    );
    console.log(
        `Failed: ${failedCount}`
    );
    console.log("==============================================");
    console.log("");
}


/*
 * ============================================================
 * START
 * ============================================================
 */

seedHotels();