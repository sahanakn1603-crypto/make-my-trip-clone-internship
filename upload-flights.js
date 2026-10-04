const BACKEND_URL = "http://localhost:8080";

/* =========================================================
   CURRENT DATE
   ========================================================= */

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================================
   TIME FUNCTIONS
   ========================================================= */

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(":").map(Number);

  let totalMinutes = hours * 60 + mins + minutes;

  // Keep the time within 24 hours
  totalMinutes = totalMinutes % (24 * 60);

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, "0")}:${String(
    newMinutes
  ).padStart(2, "0")}`;
}

function durationToMinutes(duration) {
  const hourMatch = duration.match(/(\d+)\s*hr/);
  const minuteMatch = duration.match(/(\d+)\s*min/);

  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;

  return hours * 60 + minutes;
}

/* =========================================================
   CREATE FLIGHT
   ========================================================= */

function createFlight(
  flightNumber,
  from,
  to,
  departureTime,
  duration,
  price
) {
  const flightDate = getTodayDate();

  const durationMinutes = durationToMinutes(duration);

  const arrivalTime = addMinutes(
    departureTime,
    durationMinutes
  );

  return {
    flightName: `IndiGo 6E${flightNumber}`,

    from: from,

    to: to,

    departureTime: `${flightDate}T${departureTime}`,

    arrivalTime: `${flightDate}T${arrivalTime}`,

    price: price,

    availableSeats: 120
  };
}

/* =========================================================
   FLIGHT DATA
   29 ORIGINAL ROUTES + 29 REVERSE ROUTES = 58 FLIGHTS
   ========================================================= */

const flights = [

  /* =======================================================
     BENGALURU → OTHER CITIES
     ======================================================= */

  createFlight(
    101,
    "Bengaluru",
    "Pune",
    "06:30",
    "1 hr 40 mins",
    4500
  ),

  createFlight(
    102,
    "Bengaluru",
    "Ahmedabad",
    "07:30",
    "2 hr 20 mins",
    5200
  ),

  createFlight(
    103,
    "Bengaluru",
    "Jaipur",
    "08:00",
    "2 hr 35 mins",
    5800
  ),

  createFlight(
    104,
    "Bengaluru",
    "Goa",
    "09:00",
    "1 hr 30 mins",
    3500
  ),

  createFlight(
    105,
    "Bengaluru",
    "Delhi",
    "10:00",
    "2 hr 45 mins",
    5500
  ),

  createFlight(
    106,
    "Bengaluru",
    "Mumbai",
    "11:00",
    "1 hr 45 mins",
    4800
  ),

  createFlight(
    107,
    "Bengaluru",
    "Hyderabad",
    "12:00",
    "10 mins",
    3000
  ),

  createFlight(
    108,
    "Bengaluru",
    "Chennai",
    "14:00",
    "1 hr 15 mins",
    3200
  ),

  createFlight(
    109,
    "Bengaluru",
    "Kolkata",
    "16:00",
    "2 hr 35 mins",
    5600
  ),

  /* =======================================================
     DELHI → OTHER CITIES
     ======================================================= */

  createFlight(
    110,
    "Delhi",
    "Mumbai",
    "06:30",
    "2 hr 30 mins",
    5200
  ),

  createFlight(
    111,
    "Delhi",
    "Hyderabad",
    "07:30",
    "2 hrs 30 mins",
    5000
  ),

  createFlight(
    112,
    "Delhi",
    "Chennai",
    "08:30",
    "2 hrs 40 mins",
    5600
  ),

  createFlight(
    113,
    "Delhi",
    "Kolkata",
    "09:30",
    "2 hr 15 mins",
    4800
  ),

  createFlight(
    114,
    "Delhi",
    "Pune",
    "11:00",
    "2 hrs 15 mins",
    5000
  ),

  createFlight(
    115,
    "Delhi",
    "Ahmedabad",
    "13:00",
    "1 hr 45 mins",
    4300
  ),

  createFlight(
    116,
    "Delhi",
    "Jaipur",
    "15:00",
    "1 hr 10 mins",
    3500
  ),

  createFlight(
    117,
    "Delhi",
    "Goa",
    "17:00",
    "2 hr 40 mins",
    5700
  ),

  /* =======================================================
     MUMBAI → OTHER CITIES
     ======================================================= */

  createFlight(
    118,
    "Mumbai",
    "Hyderabad",
    "06:30",
    "1 hr 40 mins",
    4200
  ),

  createFlight(
    119,
    "Mumbai",
    "Chennai",
    "08:00",
    "1 hr 45 mins",
    4300
  ),

  createFlight(
    120,
    "Mumbai",
    "Kolkata",
    "10:00",
    "2 hr 35 mins",
    5400
  ),

  createFlight(
    121,
    "Mumbai",
    "Ahmedabad",
    "12:00",
    "1 hr 10 mins",
    3200
  ),

  createFlight(
    122,
    "Mumbai",
    "Jaipur",
    "14:00",
    "2 hrs",
    4500
  ),

  createFlight(
    123,
    "Mumbai",
    "Goa",
    "16:00",
    "1 hr 30 mins",
    3500
  ),

  /* =======================================================
     CHENNAI → OTHER CITIES
     ======================================================= */

  createFlight(
    124,
    "Chennai",
    "Hyderabad",
    "06:30",
    "1 hr 25 mins",
    3500
  ),

  createFlight(
    125,
    "Chennai",
    "Kolkata",
    "08:00",
    "2 hr 30 mins",
    5000
  ),

  createFlight(
    126,
    "Chennai",
    "Pune",
    "10:00",
    "1 hr 35 mins",
    4000
  ),

  createFlight(
    127,
    "Chennai",
    "Ahmedabad",
    "12:00",
    "2 hr 15 mins",
    5000
  ),

  createFlight(
    128,
    "Chennai",
    "Jaipur",
    "14:00",
    "2 hr 30 mins",
    5400
  ),

  createFlight(
    129,
    "Chennai",
    "Goa",
    "16:00",
    "1 hr 30 mins",
    3500
  ),

  /* =======================================================
     REVERSE ROUTES
     ======================================================= */

  createFlight(
    130,
    "Pune",
    "Bengaluru",
    "07:00",
    "1 hr 40 mins",
    4500
  ),

  createFlight(
    131,
    "Ahmedabad",
    "Bengaluru",
    "08:00",
    "2 hr 20 mins",
    5200
  ),

  createFlight(
    132,
    "Jaipur",
    "Bengaluru",
    "09:00",
    "2 hr 35 mins",
    5800
  ),

  createFlight(
    133,
    "Goa",
    "Bengaluru",
    "10:00",
    "1 hr 30 mins",
    3500
  ),

  createFlight(
    134,
    "Delhi",
    "Bengaluru",
    "11:00",
    "2 hr 45 mins",
    5500
  ),

  createFlight(
    135,
    "Mumbai",
    "Bengaluru",
    "12:00",
    "1 hr 45 mins",
    4800
  ),

  createFlight(
    136,
    "Hyderabad",
    "Bengaluru",
    "13:00",
    "10 mins",
    3000
  ),

  createFlight(
    137,
    "Chennai",
    "Bengaluru",
    "15:00",
    "1 hr 15 mins",
    3200
  ),

  createFlight(
    138,
    "Kolkata",
    "Bengaluru",
    "17:00",
    "2 hr 35 mins",
    5600
  ),

  /* =======================================================
     REVERSE DELHI ROUTES
     ======================================================= */

  createFlight(
    139,
    "Mumbai",
    "Delhi",
    "07:00",
    "2 hr 30 mins",
    5200
  ),

  createFlight(
    140,
    "Hyderabad",
    "Delhi",
    "08:00",
    "2 hrs 30 mins",
    5000
  ),

  createFlight(
    141,
    "Chennai",
    "Delhi",
    "09:00",
    "2 hrs 40 mins",
    5600
  ),

  createFlight(
    142,
    "Kolkata",
    "Delhi",
    "10:00",
    "2 hr 15 mins",
    4800
  ),

  createFlight(
    143,
    "Pune",
    "Delhi",
    "12:00",
    "2 hrs 15 mins",
    5000
  ),

  createFlight(
    144,
    "Ahmedabad",
    "Delhi",
    "14:00",
    "1 hr 45 mins",
    4300
  ),

  createFlight(
    145,
    "Jaipur",
    "Delhi",
    "16:00",
    "1 hr 10 mins",
    3500
  ),

  createFlight(
    146,
    "Goa",
    "Delhi",
    "18:00",
    "2 hr 40 mins",
    5700
  ),

  /* =======================================================
     REVERSE MUMBAI ROUTES
     ======================================================= */

  createFlight(
    147,
    "Hyderabad",
    "Mumbai",
    "07:00",
    "1 hr 40 mins",
    4200
  ),

  createFlight(
    148,
    "Chennai",
    "Mumbai",
    "08:30",
    "1 hr 45 mins",
    4300
  ),

  createFlight(
    149,
    "Kolkata",
    "Mumbai",
    "10:30",
    "2 hr 35 mins",
    5400
  ),

  createFlight(
    150,
    "Ahmedabad",
    "Mumbai",
    "12:30",
    "1 hr 10 mins",
    3200
  ),

  createFlight(
    151,
    "Jaipur",
    "Mumbai",
    "14:30",
    "2 hrs",
    4500
  ),

  createFlight(
    152,
    "Goa",
    "Mumbai",
    "16:30",
    "1 hr 30 mins",
    3500
  ),

  /* =======================================================
     REVERSE CHENNAI ROUTES
     ======================================================= */

  createFlight(
    153,
    "Hyderabad",
    "Chennai",
    "07:00",
    "1 hr 25 mins",
    3500
  ),

  createFlight(
    154,
    "Kolkata",
    "Chennai",
    "08:30",
    "2 hr 30 mins",
    5000
  ),

  createFlight(
    155,
    "Pune",
    "Chennai",
    "10:30",
    "1 hr 35 mins",
    4000
  ),

  createFlight(
    156,
    "Ahmedabad",
    "Chennai",
    "12:30",
    "2 hr 15 mins",
    5000
  ),

  createFlight(
    157,
    "Jaipur",
    "Chennai",
    "14:30",
    "2 hr 30 mins",
    5400
  ),

  createFlight(
    158,
    "Goa",
    "Chennai",
    "16:30",
    "1 hr 30 mins",
    3500
  )
];

/* =========================================================
   UPLOAD TO BACKEND
   ========================================================= */

async function uploadFlights() {

  console.log("");
  console.log("======================================");
  console.log("       FLIGHT DATA UPLOAD");
  console.log("======================================");

  console.log(`Date: ${getTodayDate()}`);
  console.log(`Total flights: ${flights.length}`);
  console.log("");

  let successCount = 0;
  let failedCount = 0;

  for (const flight of flights) {

    try {

      console.log(
        `Uploading ${flight.flightName}: ${flight.from} → ${flight.to}`
      );

      const response = await fetch(
        `${BACKEND_URL}/admin/flight`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(flight)
        }
      );

      if (!response.ok) {

        const errorText = await response.text();

        console.log(
          `❌ FAILED ${flight.flightName} - HTTP ${response.status}`
        );

        console.log(errorText);

        failedCount++;

        continue;
      }

      await response.json();

      console.log(
        `✅ SUCCESS ${flight.flightName} - ${flight.from} → ${flight.to}`
      );

      successCount++;

    } catch (error) {

      console.log(
        `❌ ERROR ${flight.flightName}: ${error.message}`
      );

      failedCount++;
    }
  }

  console.log("");
  console.log("======================================");
  console.log("           UPLOAD COMPLETE");
  console.log("======================================");

  console.log(`Total flights : ${flights.length}`);
  console.log(`Successful    : ${successCount}`);
  console.log(`Failed        : ${failedCount}`);

  console.log("======================================");
}

uploadFlights();