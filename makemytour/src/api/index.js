import axios from "axios";

const BACKEND_URL = "http://localhost:8080";

export const login = async (email, password) => {
  try {
    const url = `${BACKEND_URL}/user/login?email=${email}&password=${password}`;
    const res = await axios.post(url);
    const data = res.data;
    return data;
  } catch (error) {
    throw error;
  }
};

export const signup = async (
  firstName,
  lastName,
  email,
  phoneNumber,
  password
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    });

    const data = res.data;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getuserbyemail = async (email) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/user/email?email=${email}`
    );

    const data = res.data;
    return data;
  } catch (error) {
    throw error;
  }
};

export const editprofile = async (
  id,
  firstName,
  lastName,
  email,
  phoneNumber
) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/user/edit?id=${id}`,
      {
        firstName,
        lastName,
        email,
        phoneNumber,
      }
    );

    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error editing profile:", error);
    throw error;
  }
};

export const getflight = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight`);
    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error fetching flights:", error);
    throw error;
  }
};

/* =========================
   DYNAMIC FLIGHT PRICING
   ========================= */

export const getFlightPrice = async (flightId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/pricing/flight/${flightId}`
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching dynamic flight price:", error);
    throw error;
  }
};

export const addflight = async (
  flightName,
  from,
  to,
  departureTime,
  arrivalTime,
  price,
  availableSeats
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/flight`, {
      flightName,
      from,
      to,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
    });

    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error adding flight:", error);
    throw error;
  }
};

export const editflight = async (
  id,
  flightName,
  from,
  to,
  departureTime,
  arrivalTime,
  price,
  availableSeats
) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/admin/flight/${id}`,
      {
        flightName,
        from,
        to,
        departureTime,
        arrivalTime,
        price,
        availableSeats,
      }
    );

    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error editing flight:", error);
    throw error;
  }
};

export const gethotel = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/hotel`);
    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error fetching hotels:", error);
    throw error;
  }
};

export const addhotel = async (
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/hotel`, {
      hotelName,
      location,
      pricePerNight,
      availableRooms,
      amenities,
    });

    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error adding hotel:", error);
    throw error;
  }
};

export const edithotel = async (
  id,
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities
) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/admin/hotel/${id}`,
      {
        hotelName,
        location,
        pricePerNight,
        availableRooms,
        amenities,
      }
    );

    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error editing hotel:", error);
    throw error;
  }
};

export const handleflightbooking = async (
  userId,
  flightId,
  seats,
  price
) => {
  try {
    const url =
      `${BACKEND_URL}/booking/flight` +
      `?userId=${userId}` +
      `&flightId=${flightId}` +
      `&seats=${seats}` +
      `&price=${price}`;

    const res = await axios.post(url);
    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error booking flight:", error);
    throw error;
  }
};

export const handlehotelbooking = async (
  userId,
  hotelId,
  rooms,
  price
) => {
  try {
    const url =
      `${BACKEND_URL}/booking/hotel` +
      `?userId=${userId}` +
      `&hotelId=${hotelId}` +
      `&rooms=${rooms}` +
      `&price=${price}`;

    const res = await axios.post(url);
    const data = res.data;
    return data;
  } catch (error) {
    console.log("Error booking hotel:", error);
    throw error;
  }
};

// Get current live status of a flight
export const getFlightStatus = async (flightId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/flight-status/${flightId}`
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching flight status:", error);
    throw error;
  }
};

// Get flight status history
export const getFlightStatusHistory = async (flightId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/flight-status/history/${flightId}`
    );

    return res.data;
  } catch (error) {
    console.log(
      "Error fetching flight status history:",
      error
    );
    throw error;
  }
};

// Freeze current dynamic flight price
export const freezeFlightPrice = async (userId, flightId) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/pricing/freeze?userId=${encodeURIComponent(
        userId
      )}&flightId=${encodeURIComponent(flightId)}`
    );

    return res.data;
  } catch (error) {
    console.log("Error freezing flight price:", error);
    throw error;
  }
};

// Get active flight price freeze
export const getActiveFlightPriceFreeze = async (
  userId,
  flightId
) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/pricing/freeze/${encodeURIComponent(
        userId
      )}/${encodeURIComponent(flightId)}`
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching price freeze:", error);
    throw error;
  }
};

// Get dynamic price history of a flight
export const getFlightPriceHistory = async (flightId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/pricing/flight/${flightId}/history`
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching flight price history:", error);
    throw error;
  }
};