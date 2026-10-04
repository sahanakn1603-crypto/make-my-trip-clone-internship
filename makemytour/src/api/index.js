import axios from "axios";

const BACKEND_URL = "https://make-my-trip-clone-internship.onrender.com";


// =====================================================
// AUTHENTICATION
// =====================================================

export const login = async (email, password) => {
  try {
    const url = `${BACKEND_URL}/user/login?email=${email}&password=${password}`;
    const res = await axios.post(url);
    return res.data;
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

    return res.data;
  } catch (error) {
    throw error;
  }
};


export const getuserbyemail = async (email) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/user/email?email=${email}`
    );

    return res.data;
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

    return res.data;
  } catch (error) {
    console.log("Error editing profile:", error);
    throw error;
  }
};


// =====================================================
// FLIGHTS
// =====================================================

export const getflight = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight`);
    return res.data;
  } catch (error) {
    console.log("Error fetching flights:", error);
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

    return res.data;
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

    return res.data;
  } catch (error) {
    console.log("Error editing flight:", error);
    throw error;
  }
};


// =====================================================
// HOTELS
// =====================================================

export const gethotel = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/hotel`);
    return res.data;
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

    return res.data;
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

    return res.data;
  } catch (error) {
    console.log("Error editing hotel:", error);
    throw error;
  }
};


// =====================================================
// BOOKINGS
// =====================================================

export const handleflightbooking = async (
  userId,
  flightId,
  seats,
  price,
  date = ""
) => {
  try {
    const url =
      `${BACKEND_URL}/booking/flight` +
      `?userId=${encodeURIComponent(userId)}` +
      `&flightId=${encodeURIComponent(flightId)}` +
      `&seats=${encodeURIComponent(seats)}` +
      `&price=${encodeURIComponent(price)}` +
      `&date=${encodeURIComponent(date)}`;

    const res = await axios.post(url);

    return res.data;
  } catch (error) {
    console.log("Error booking flight:", error);
    throw error;
  }
};


export const handlehotelbooking = async (
  userId,
  hotelId,
  rooms,
  price,
  roomType = "STANDARD",
  date = ""
) => {
  try {
    const url =
      `${BACKEND_URL}/booking/hotel` +
      `?userId=${encodeURIComponent(userId)}` +
      `&hotelId=${encodeURIComponent(hotelId)}` +
      `&rooms=${encodeURIComponent(rooms)}` +
      `&price=${encodeURIComponent(price)}` +
      `&roomType=${encodeURIComponent(roomType)}` +
      `&date=${encodeURIComponent(date)}`;

    const res = await axios.post(url);

    return res.data;
  } catch (error) {
    console.log("Error booking hotel:", error);
    throw error;
  }
};


// =====================================================
// FLIGHT SEATS
// =====================================================

// Get flight seat map and current seat availability
export const getFlightSeats = async (flightId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/flight-seats/${flightId}`
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching flight seats:", error);
    throw error;
  }
};


// =====================================================
// FLIGHT STATUS
// =====================================================

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
    console.log("Error fetching flight status history:", error);
    throw error;
  }
};


// =====================================================
// DYNAMIC PRICING
// =====================================================

// Get current dynamic price of a flight
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


// =====================================================
// PRICE FREEZE
// =====================================================

// Freeze the current dynamic flight price
export const freezeFlightPrice = async (userId, flightId) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/pricing/freeze` +
        `?userId=${encodeURIComponent(userId)}` +
        `&flightId=${encodeURIComponent(flightId)}`
    );

    return res.data;
  } catch (error) {
    console.log("Error freezing flight price:", error);
    throw error;
  }
};


// Get active price freeze for a user and flight
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
    console.log("Error fetching active flight price freeze:", error);
    throw error;
  }
};


// =====================================================
// TASK 5 - REVIEW SYSTEM
// =====================================================

// Get reviews for a hotel or flight
export const getReviews = async (
  targetType,
  targetId,
  sort = "newest"
) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/reviews` +
        `?targetType=${encodeURIComponent(targetType)}` +
        `&targetId=${encodeURIComponent(targetId)}` +
        `&sort=${encodeURIComponent(sort)}`
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching reviews:", error);
    throw error;
  }
};


// Create a review
export const createReview = async (
  userId,
  userName,
  targetType,
  targetId,
  rating,
  reviewText,
  photoUrls = []
) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/reviews`,
      {
        userId,
        userName,
        targetType,
        targetId,
        rating,
        reviewText,
        photoUrls,
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error creating review:", error);
    throw error;
  }
};


// Upload a review photo
export const uploadReviewPhoto = async (file) => {
  try {
    const formData = new FormData();

    formData.append("file", file);

    const res = await axios.post(
      `${BACKEND_URL}/reviews/upload-photo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error uploading review photo:", error);
    throw error;
  }
};


// =====================================================
// ADD PHOTOS TO EXISTING REVIEW
// =====================================================

export const addReviewPhotos = async (
  reviewId,
  userId,
  photoUrls = []
) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/reviews/${encodeURIComponent(reviewId)}/photos`,
      {
        userId,
        photoUrls,
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error adding photos to review:", error);
    throw error;
  }
};


// Mark review as helpful
export const markReviewHelpful = async (reviewId) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/reviews/${reviewId}/helpful`
    );

    return res.data;
  } catch (error) {
    console.log("Error marking review helpful:", error);
    throw error;
  }
};


// Reply to review
export const replyToReview = async (
  reviewId,
  userId,
  userName,
  text
) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/reviews/${reviewId}/reply` +
        `?userId=${encodeURIComponent(userId)}` +
        `&userName=${encodeURIComponent(userName || "")}` +
        `&text=${encodeURIComponent(text)}`
    );

    return res.data;
  } catch (error) {
    console.log("Error replying to review:", error);
    throw error;
  }
};


// Flag a review
export const flagReview = async (
  reviewId,
  reason
) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/reviews/${reviewId}/flag` +
        `?reason=${encodeURIComponent(reason || "")}`
    );

    return res.data;
  } catch (error) {
    console.log("Error flagging review:", error);
    throw error;
  }
};


// =====================================================
// TASK 6 - PERSONALIZED RECOMMENDATIONS
// =====================================================

// Get personalized recommendations for the logged-in user
export const getRecommendations = async (email) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/recommendations?email=${encodeURIComponent(email)}`
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching personalized recommendations:", error);
    throw error;
  }
};


// Save recommendation feedback
// feedback must be HELPFUL or IRRELEVANT
export const sendRecommendationFeedback = async (
  userId,
  targetType,
  targetId,
  feedback
) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/recommendations/feedback` +
        `?userId=${encodeURIComponent(userId)}` +
        `&targetType=${encodeURIComponent(targetType)}` +
        `&targetId=${encodeURIComponent(targetId)}` +
        `&feedback=${encodeURIComponent(feedback)}`
    );

    return res.data;
  } catch (error) {
    console.log("Error saving recommendation feedback:", error);
    throw error;
  }
};


// Get recommendation feedback for a user
export const getRecommendationFeedback = async (userId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/recommendations/feedback/${encodeURIComponent(
        userId
      )}`
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching recommendation feedback:", error);
    throw error;
  }
};