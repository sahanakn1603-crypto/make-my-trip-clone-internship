import { useRouter } from "next/router";

import {
  Plane,
  Luggage,
  Clock,
  Calendar,
  MapPin,
  Gift,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Star,
  Info,
  ArrowRight,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  getflight,
  getFlightPrice,
  getFlightPriceHistory,
  handleflightbooking,
  getFlightSeats,
  freezeFlightPrice,
  getActiveFlightPriceFreeze,
} from "@/api";
import { useDispatch, useSelector } from "react-redux";
interface Flight {
  id: string; // Unique identifier for the flight
  flightName: string; // Name of the flight
  from: string; // Departure location
  to: string; // Arrival location
  departureTime: string; // Departure time (ISO 8601 string recommended)
  arrivalTime: string; // Arrival time (ISO 8601 string recommended)
  price: number; // Price of the flight
  availableSeats: number; // Number of available seats
}
interface FlightSeat {
  id: string;
  flightId: string;
  seatNumber: string;
  seatType: "PREMIUM" | "STANDARD";
  price: number;
  status: "AVAILABLE" | "BOOKED";
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Ticket } from "lucide-react";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";
const BookFlightPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [open, setopem] = useState(false);

  // Payment / booking state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  
  const [dynamicPrice, setDynamicPrice] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [peakAdjustment, setPeakAdjustment] = useState<number>(0);
  const [holidayAdjustment, setHolidayAdjustment] = useState<number>(0);
  const [demandAdjustment, setDemandAdjustment] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState<boolean>(true);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [flightSeats, setFlightSeats] = useState<FlightSeat[]>([]);
const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
const [seatLoading, setSeatLoading] = useState(false);
const [seatError, setSeatError] = useState("");

  // Task 4: preferred seat + real-time seat availability
  const [preferredSeat, setPreferredSeat] = useState<string>("");
  const [preferredSeatSaving, setPreferredSeatSaving] = useState(false);
  const [preferredSeatSavingFor, setPreferredSeatSavingFor] = useState("");
  const [preferredSeatMessage, setPreferredSeatMessage] = useState("");
  const [seatRefreshing, setSeatRefreshing] = useState(false);

  // Price Freeze state
  const [priceFreeze, setPriceFreeze] = useState<any>(null);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeError, setFreezeError] = useState("");
  const [freezeSecondsLeft, setFreezeSecondsLeft] = useState(0);
  const freezeCountdownRef = useRef<HTMLSpanElement | null>(null);
  // Prevent repeatedly auto-selecting the preferred seat after the user manually changes it.
  const preferredAutoAppliedRef = useRef(false);

  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        if (parsedUser) {
          const normalizedUser = {
            ...parsedUser,
            id: parsedUser.id ?? parsedUser._id ?? parsedUser.userId,
          };

          setAuthenticatedUser(normalizedUser);
          dispatch(setUser(normalizedUser));
        }
      } else if (user) {
        setAuthenticatedUser(user);
      }
    } catch (error) {
      console.error("Error restoring logged-in user:", error);
      localStorage.removeItem("user");
    } finally {
    }
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setAuthenticatedUser(user);
    }
  }, [user]);

  const currentUser = authenticatedUser || user;
  const backendUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://make-my-trip-clone-internship.onrender.com";

  // Restore the saved preferred seat from the logged-in user.
  useEffect(() => {
    const savedPreferredSeat = currentUser?.preferredSeat;
    setPreferredSeat(
      typeof savedPreferredSeat === "string"
        ? savedPreferredSeat.trim().toUpperCase()
        : ""
    );
  }, [currentUser?.preferredSeat]);

  // Reset the one-time preferred-seat auto selection when opening another flight.
  useEffect(() => {
    preferredAutoAppliedRef.current = false;
  }, [id]);

  // If the user has a saved preferred seat, automatically use it for the next
  // booking when that seat is currently available. This makes the saved
  // preference useful after a page refresh instead of only showing a star.
  useEffect(() => {
    if (preferredAutoAppliedRef.current) return;
    if (!preferredSeat || flightSeats.length === 0 || quantity < 1) return;

    const preferred = flightSeats.find(
      (seat) =>
        seat.seatNumber?.trim().toUpperCase() === preferredSeat &&
        seat.status === "AVAILABLE"
    );

    if (!preferred) return;

    setSelectedSeats((previous) => {
      if (previous.length > 0 || previous.includes(preferredSeat)) {
        return previous;
      }

      return [preferredSeat];
    });

    preferredAutoAppliedRef.current = true;
    setPreferredSeatMessage(
      `⭐ Your preferred seat ${preferredSeat} has been selected automatically.`
    );
  }, [preferredSeat, flightSeats, quantity]);

  // Always reload the latest user record from MongoDB when the page opens.
  // This prevents an older Redux/localStorage user object from overwriting
  // the saved preferred seat after a full browser refresh.
  useEffect(() => {
    const email = currentUser?.email;
    if (!email) return;

    let cancelled = false;

    const loadLatestUser = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/user/email?email=${encodeURIComponent(email)}`
        );

        if (!response.ok) return;

        const latestUser = await response.json();
        if (cancelled || !latestUser) return;

        const normalizedUser = {
          ...currentUser,
          ...latestUser,
          id: latestUser?.id ?? latestUser?._id ?? currentUser.id,
          preferredSeat:
            typeof latestUser?.preferredSeat === "string"
              ? latestUser.preferredSeat.trim().toUpperCase()
              : "",
        };

        setAuthenticatedUser(normalizedUser);
        setPreferredSeat(normalizedUser.preferredSeat);
        dispatch(setUser(normalizedUser));

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(normalizedUser));
        }
      } catch (error) {
        console.error("Error loading latest user profile:", error);
      }
    };

    loadLatestUser();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.email]);

  useEffect(() => {
    if (!router.isReady || !id) return;

    const fetchFlights = async () => {
      setLoading(true);
      setSeatLoading(true);
      setSeatError("");

      try {
        const data = await getflight();

        const flightData: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const requestedId = Array.isArray(id) ? id[0] : id;

        const normalizedFlights: Flight[] = flightData
          .map((item: any) => ({
            ...item,
            id: item.id ?? item._id,
          }))
          .filter((item: Flight) => item.id === requestedId);

        setFlights(normalizedFlights);

        if (normalizedFlights.length === 0) {
          setSeatError("No flight data available for this flight.");
          return;
        }

        const selectedFlight = normalizedFlights[0];

        try {
          const pricing = await getFlightPrice(selectedFlight.id);
          setBasePrice(Number(pricing?.basePrice ?? selectedFlight.price ?? 0));
          setDynamicPrice(Number(pricing?.dynamicPrice ?? selectedFlight.price ?? 0));
          setPeakAdjustment(Number(pricing?.peakAdjustment ?? 0));
          setHolidayAdjustment(Number(pricing?.holidayAdjustment ?? 0));
          setDemandAdjustment(Number(pricing?.demandAdjustment ?? 0));
        } catch (pricingError) {
          console.error("Error loading dynamic flight price:", pricingError);
          setBasePrice(Number(selectedFlight.price ?? 0));
          setDynamicPrice(Number(selectedFlight.price ?? 0));
        } finally {
          setPriceLoading(false);
        }

        try {
          const history = await getFlightPriceHistory(selectedFlight.id);
          setPriceHistory(Array.isArray(history) ? history : []);
        } catch (historyError) {
          console.error("Error loading price history:", historyError);
          setPriceHistory([]);
        } finally {
          setHistoryLoading(false);
        }

        try {
          const seats = await getFlightSeats(selectedFlight.id);
          setFlightSeats(Array.isArray(seats) ? seats : []);
        } catch (seatLoadError) {
          console.error("Error loading flight seats:", seatLoadError);
          setFlightSeats([]);
          setSeatError("Unable to load seat availability.");
        }
      } catch (error) {
        console.error("Error loading flights:", error);
        setFlights([]);
        setSeatError("Unable to load flight details.");
      } finally {
        setLoading(false);
        setSeatLoading(false);
      }
    };

    fetchFlights();
  }, [router.isReady, id]);

  // Task 4: refresh the seat map every 10 seconds so the user sees
  // newly booked seats without refreshing the whole page.
  useEffect(() => {
    if (!router.isReady || flights.length === 0) return;

    const flightId = flights[0]?.id;
    if (!flightId) return;

    let cancelled = false;

    const refreshSeats = async () => {
      try {
        setSeatRefreshing(true);
        const seats = await getFlightSeats(flightId);

        if (cancelled || !Array.isArray(seats)) return;

        setFlightSeats(seats);

        let unavailableSeats: string[] = [];

        setSelectedSeats((previous) => {
          unavailableSeats = previous.filter((seatNumber) => {
            const refreshedSeat = seats.find(
              (seat: FlightSeat) => seat.seatNumber === seatNumber
            );

            return !refreshedSeat || refreshedSeat.status !== "AVAILABLE";
          });

          if (unavailableSeats.length === 0) {
            return previous;
          }

          return previous.filter(
            (seatNumber) => !unavailableSeats.includes(seatNumber)
          );
        });

        if (unavailableSeats.length > 0) {
          setSeatError(
            `${unavailableSeats.join(", ")} ${
              unavailableSeats.length === 1 ? "is" : "are"
            } no longer available. Please select another seat.`
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Real-time seat refresh failed:", error);
        }
      } finally {
        if (!cancelled) {
          setSeatRefreshing(false);
        }
      }
    };

    // Refresh once immediately, then every 10 seconds.
    refreshSeats();
    const intervalId = window.setInterval(refreshSeats, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [router.isReady, id, flights.length]);

useEffect(() => {
  if (selectedSeats.length > quantity) {
    setSelectedSeats((previous) =>
      previous.slice(0, quantity)
    );
  }
}, [quantity, selectedSeats.length]);

// Load an existing active price freeze for the logged-in user.
useEffect(() => {
  if (!currentUser?.id || !flights[0]?.id) {
    setPriceFreeze(null);
    setFreezeSecondsLeft(0);
    return;
  }

  let cancelled = false;

  const loadActiveFreeze = async () => {
    try {
      setFreezeError("");
      const response = await getActiveFlightPriceFreeze(
        currentUser.id,
        flights[0].id
      );

      if (cancelled) return;

      if (response?.active && response?.freeze) {
        setPriceFreeze(response.freeze);
      } else {
        setPriceFreeze(null);
        setFreezeSecondsLeft(0);
      }
    } catch (error) {
      if (!cancelled) {
        console.error("Error loading active price freeze:", error);
      }
    }
  };

  loadActiveFreeze();

  return () => {
    cancelled = true;
  };
}, [currentUser?.id, flights[0]?.id]);

// Keep the price-freeze countdown in sync with the backend expiry time.
// Only the countdown text is updated every second; React state is not updated
// every second, which prevents the large booking page from blinking/repainting.
useEffect(() => {
  if (!priceFreeze?.expiresAt) {
    setFreezeSecondsLeft(0);
    if (freezeCountdownRef.current) {
      freezeCountdownRef.current.textContent = "00:00";
    }
    return;
  }

  const expiresAt = new Date(priceFreeze.expiresAt).getTime();

  const updateCountdown = () => {
    const remaining = Math.max(
      0,
      Math.ceil((expiresAt - Date.now()) / 1000)
    );

    if (freezeCountdownRef.current) {
      freezeCountdownRef.current.textContent = formatFreezeTime(remaining);
    }

    // Set React state only once when the freeze starts and once when it expires.
    if (remaining > 0 && freezeSecondsLeft <= 0) {
      setFreezeSecondsLeft(remaining);
    }

    if (remaining <= 0) {
      setFreezeSecondsLeft(0);
      setPriceFreeze(null);
    }
  };

  updateCountdown();
  const timer = window.setInterval(updateCountdown, 1000);

  return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [priceFreeze?.expiresAt]);

// ADD THIS
useEffect(() => {
  if (!router.isReady) return;

  const travelerParam = router.query.travelers;

  const travelerCount = Array.isArray(travelerParam)
    ? Number.parseInt(travelerParam[0], 10)
    : Number.parseInt(travelerParam || "", 10);

  if (
    Number.isFinite(travelerCount) &&
    travelerCount >= 1
  ) {
    setQuantity(travelerCount);
  }
}, [router.isReady, router.query.travelers]);

if (loading) {
  return <Loader />;
}
  if (flights.length === 0) {
    return <div>No flight data available for this ID.</div>;
  }
  const flight = flights[0];
  const flightDetails = {
    from: "Bengaluru",
    to: "New Delhi",
    date: "Thursday, Jan 16",
    flightNo: "IX 2747",
    aircraft: "Airbus A320",
    airline: "Air India Express",
    departureTime: "17:55",
    arrivalTime: "20:55",
    duration: "3h 0m",
    departureTerminal: "Bengaluru International Airport, Terminal T2",
    arrivalTerminal: "Indira Gandhi International Airport, Terminal T3",
    cabinBaggage: "7 Kgs / Adult",
    checkInBaggage: "15 Kgs (1 piece only) / Adult",
  };

  const fareSummary = {
    baseFare: 6124,
    taxes: 1374,
    otherServices: 249,
    discounts: -250,
    total: 7497,
  };

  const promoOffers = [
    {
      code: "MMTSECURE",
      description:
        "Get an instant discount of ₹299 on your flight booking and Trip Secure with this coupon!",
      amount: 299,
    },
    {
      code: "SPECIALUPI",
      description:
        "Use this code and get ₹362 instant discount on payments via UPI only!",
      amount: 362,
    },
  ];

  const hotels = [
    {
      name: "Hotel Park Tree",
      rating: 4,
      price: 9000,
      image:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800",
      location: "Near Airport, New Delhi",
    },
    {
      name: "Lemon Tree Premier",
      rating: 4,
      price: 43875,
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800",
      location: "Connaught Place, New Delhi",
    },
    {
      name: "Hotel Kian",
      rating: 4,
      price: 1968,
      image:
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800",
      location: "Karol Bagh, New Delhi",
    },
  ];
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    const date = new Date(dateString);
    return date.toLocaleString("en-US", options);
  };

  const handleFreezePrice = async () => {
    if (!currentUser?.id || !flight?.id) {
      setFreezeError("Please log in before freezing the price.");
      return;
    }

    setFreezeLoading(true);
    setFreezeError("");

    try {
      const freeze = await freezeFlightPrice(currentUser.id, flight.id);
      setPriceFreeze(freeze);

    } catch (error: any) {
      console.error("Error freezing flight price:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Unable to freeze the flight price. Please try again.";
      setFreezeError(String(message));
    } finally {
      setFreezeLoading(false);
    }
  };

  function formatFreezeTime(seconds: number): string {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = Number.parseInt(e.target.value);
    setQuantity(
      isNaN(value) ? 1 : Math.max(1, Math.min(value, flight.availableSeats))
    );
  };
 
  const currentDynamicFlightPrice =
    dynamicPrice > 0 ? dynamicPrice : flight?.price || 0;

  const isPriceFrozen =
    Boolean(priceFreeze?.expiresAt) && freezeSecondsLeft > 0;

  const currentFlightPrice = isPriceFrozen
    ? Number(priceFreeze?.lockedPrice ?? currentDynamicFlightPrice)
    : currentDynamicFlightPrice;

  const totalPrice = currentFlightPrice * quantity;
  const seatUpgradeAmount = selectedSeats.reduce(
  (total, seatNumber) => {
    const seat = flightSeats.find(
      (item) => item.seatNumber === seatNumber
    );

    return total + (seat?.price || 0);
  },
  0
);
  const totalTaxes = fareSummary?.taxes * quantity;
  const totalOtherServices = fareSummary?.otherServices * quantity;
  const totalDiscounts = fareSummary?.discounts * quantity;
  // Discounts are stored as negative values (for example -₹750).
  // Therefore they must be ADDED here, not subtracted again.
  // Otherwise a discount incorrectly increases the final amount.
  const grandTotal =
    totalPrice +
    totalTaxes +
    totalOtherServices +
    totalDiscounts +
    seatUpgradeAmount;
const savePreferredSeat = async (seatNumber: string) => {
  if (!currentUser?.id) {
    setPreferredSeatMessage("Please log in again to save a preferred seat.");
    return;
  }

  const normalizedSeat = seatNumber.trim().toUpperCase();
  if (!normalizedSeat) return;

  const seat = flightSeats.find(
    (item) => item.seatNumber.toUpperCase() === normalizedSeat
  );

  if (!seat || seat.status !== "AVAILABLE") {
    setPreferredSeatMessage(
      `${normalizedSeat} is not currently available.`
    );
    return;
  }

  try {
    setPreferredSeatSaving(true);
    setPreferredSeatSavingFor(normalizedSeat);
    setPreferredSeatMessage("");

    const response = await fetch(
  `${backendUrl}/user/preferred-seat?userId=${encodeURIComponent(
    currentUser.id
  )}&preferredSeat=${encodeURIComponent(normalizedSeat)}`,
  { method: "PUT" }
);
    if (!response.ok) {
      let message = "Unable to save preferred seat.";

      try {
        const errorData = await response.json();
        message = errorData?.message || message;
      } catch {
        // Keep the default message when the backend does not return JSON.
      }

      throw new Error(message);
    }

    const updatedUser = await response.json();
    const normalizedUser = {
      ...currentUser,
      ...updatedUser,
      id: updatedUser?.id ?? updatedUser?._id ?? currentUser.id,
      preferredSeat: normalizedSeat,
    };

    setPreferredSeat(normalizedSeat);
    setAuthenticatedUser(normalizedUser);
    dispatch(setUser(normalizedUser));

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    }

    setPreferredSeatMessage(
      `${normalizedSeat} saved as your preferred seat.`
    );
  } catch (error: any) {
    console.error("Saving preferred seat failed:", error);
    setPreferredSeatMessage(
      error?.message ||
        "Unable to save preferred seat. Please try again."
    );
  } finally {
    setPreferredSeatSaving(false);
    setPreferredSeatSavingFor("");
  }
};

const handleUsePreferredSeat = () => {
  if (!preferredSeat) return;

  const seat = flightSeats.find(
    (item) => item.seatNumber.toUpperCase() === preferredSeat
  );

  if (!seat || seat.status !== "AVAILABLE") {
    setPreferredSeatMessage(
      `${preferredSeat} is currently unavailable. Please choose another seat.`
    );
    return;
  }

  if (quantity < 1) return;

  setSeatError("");
  setSelectedSeats((previous) => {
    if (previous.includes(preferredSeat)) {
      return previous;
    }

    if (previous.length >= quantity) {
      if (quantity === 1) {
        return [preferredSeat];
      }

      return previous;
    }

    return [...previous, preferredSeat];
  });
};

const handleSeatClick = (seat: FlightSeat) => {
  if (seat.status !== "AVAILABLE") {
    return;
  }

  setSeatError("");

  setSelectedSeats((previous) => {

    if (previous.includes(seat.seatNumber)) {
      return previous.filter(
        (seatNumber) => seatNumber !== seat.seatNumber
      );
    }

    if (previous.length >= quantity) {
      setSeatError(
        `Please select only ${quantity} seat${
          quantity > 1 ? "s" : ""
        }.`
      );

      return previous;
    }

    return [...previous, seat.seatNumber];
  });

  // Remove a previous "too many seats" message once the selection is valid.
  setTimeout(() => {
    setSelectedSeats((latest) => {
      if (latest.length === quantity) {
        setSeatError("");
      }
      return latest;
    });
  }, 0);
};
  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!currentUser?.id) {
      setBookingError("Your login session could not be found. Please log in again.");
      return;
    }

    if (selectedSeats.length !== quantity) {
      setBookingError(`Please select exactly ${quantity} seat${quantity > 1 ? "s" : ""}.`);
      return;
    }

    setBookingLoading(true);

    try {
      const data = await handleflightbooking(
        currentUser.id,
        flight?.id,
        quantity,
        grandTotal
      );

      const updateuser = {
        ...currentUser,
        bookings: [...(currentUser?.bookings || []), data],
      };

      dispatch(setUser(updateuser));

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updateuser));
      }

      setPaymentOpen(false);
      setopem(false);
      setQuantity(1);
      setSelectedSeats([]);
      router.push("/profile");
    } catch (error: any) {
      console.error("Flight booking failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Booking failed. Please try again.";
      setBookingError(String(message));
    } finally {
      setBookingLoading(false);
    }
  };
  const historyValues = priceHistory
    .map((item) => Number(item.dynamicPrice))
    .filter((value) => Number.isFinite(value));

  const graphMin =
    historyValues.length > 0
      ? Math.min(...historyValues)
      : currentFlightPrice;

  const graphMax =
    historyValues.length > 0
      ? Math.max(...historyValues)
      : currentFlightPrice;

  // Keep the real lowest/highest values for the summary below the graph.
  // When there is only one recorded price, add visual padding so the
  // Y-axis does not show duplicate/near-identical labels.
  const graphDisplayMin =
    priceHistory.length === 1
      ? graphMin - 100
      : graphMin;

  const graphDisplayMax =
    priceHistory.length === 1
      ? graphMax + 100
      : graphMax;

  const graphRange = Math.max(
    graphDisplayMax - graphDisplayMin,
    1
  );

  const graphWidth = 620;
  const graphHeight = 210;
  const graphPaddingLeft = 58;
  const graphPaddingRight = 18;
  const graphPaddingTop = 22;
  const graphPaddingBottom = 42;

  const graphInnerWidth =
    graphWidth - graphPaddingLeft - graphPaddingRight;

  const graphInnerHeight =
    graphHeight - graphPaddingTop - graphPaddingBottom;

  const graphPoints = priceHistory.map((item, index) => {
    const value = Number(item.dynamicPrice);
    const x =
      priceHistory.length === 1
        ? graphPaddingLeft + graphInnerWidth / 2
        : graphPaddingLeft +
          (index / (priceHistory.length - 1)) * graphInnerWidth;

    const y =
      graphPaddingTop +
      ((graphDisplayMax - value) / graphRange) * graphInnerHeight;

    return {
      x,
      y,
      value,
      recordedAt: item.recordedAt,
    };
  });

  const graphPath =
    graphPoints.length > 1
      ? graphPoints
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
          )
          .join(" ")
      : "";

  const formatHistoryTime = (value: string) => {
    try {
      return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const PriceHistoryCard = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h2 className="text-lg font-bold flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Price History
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            See how the dynamic flight price has changed over time.
          </p>
        </div>

        {priceHistory.length > 0 && (
          <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
            {priceHistory.length} price updates
          </span>
        )}
      </div>

      {historyLoading ? (
        <div className="h-56 flex items-center justify-center text-gray-500">
          Loading price history...
        </div>
      ) : priceHistory.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
          Price history will appear as the pricing engine records updates.
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto mt-4">
            <svg
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              className="w-full min-w-[560px] h-56"
              role="img"
              aria-label="Flight price history graph"
            >
              {[0, 0.5, 1].map((position) => {
                const y =
                  graphPaddingTop + position * graphInnerHeight;
                const value =
                  graphDisplayMax - position * graphRange;

                return (
                  <g key={position}>
                    <line
                      x1={graphPaddingLeft}
                      y1={y}
                      x2={graphWidth - graphPaddingRight}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                    <text
                      x={graphPaddingLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="11"
                      fill="#6b7280"
                    >
                      ₹{Math.round(value).toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {graphPath && (
                <path
                  d={graphPath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {graphPoints.map((point, index) => (
                <g key={`${point.recordedAt}-${index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="white"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                  <title>
                    ₹{Math.round(point.value).toLocaleString()} •{" "}
                    {formatHistoryTime(point.recordedAt)}
                  </title>
                </g>
              ))}

              {graphPoints.length > 0 && (
                <>
                  <text
                    x={graphPoints[0].x}
                    y={graphHeight - 15}
                    textAnchor="start"
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {formatHistoryTime(graphPoints[0].recordedAt)}
                  </text>

                  <text
                    x={graphPoints[graphPoints.length - 1].x}
                    y={graphHeight - 15}
                    textAnchor="end"
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {formatHistoryTime(
                      graphPoints[graphPoints.length - 1].recordedAt
                    )}
                  </text>
                </>
              )}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-gray-500">
              Lowest recorded price:{" "}
              <strong className="text-gray-800">
                ₹{Math.round(graphMin).toLocaleString()}
              </strong>
            </span>

            <span className="text-gray-500">
              Highest recorded price:{" "}
              <strong className="text-gray-800">
                ₹{Math.round(graphMax).toLocaleString()}
              </strong>
            </span>
          </div>

          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            Prices are calculated dynamically using demand, peak travel and
            holiday factors. The graph shows recorded prices from the pricing
            engine.
          </div>
        </>
      )}
    </div>
  );

const BookingContent = () => (
  <>
    <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-white">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold flex items-center">
        <Plane className="w-6 h-6 mr-2" />
        Flight Booking Details
      </DialogTitle>
    </DialogHeader>

    <div className="grid gap-6 mt-4">
      {/* Flight Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="flightName" className="flex items-center">
            <Plane className="w-4 h-4 mr-2" />
            Flight Name
          </Label>
          <Input
            id="flightName"
            value={flight?.flightName}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="from" className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            From
          </Label>
          <Input
            id="from"
            value={flight?.from}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="to" className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            To
          </Label>
          <Input
            id="to"
            value={flight?.to}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="departureTime" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Departure Time
          </Label>
          <Input
            id="departureTime"
            value={new Date(flight.departureTime).toLocaleString()}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="arrivalTime" className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Arrival Time
          </Label>
          <Input
            id="arrivalTime"
            value={new Date(flight.arrivalTime).toLocaleString()}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity" className="flex items-center">
            <Ticket className="w-4 h-4 mr-2" />
            Number of Tickets
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={flight.availableSeats}
            value={quantity}
            onChange={handleQuantityChange}
          />
        </div>
      </div>

      {/* Fare Summary */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Fare Summary
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Base Fare</span>
            <span className="font-medium">
              {priceLoading
                ? "Updating..."
                : `₹ ${basePrice.toLocaleString()}`}
            </span>
          </div>

          {peakAdjustment > 0 && (
            <div className="flex justify-between items-center text-orange-600">
              <span>Peak Travel Adjustment</span>
              <span>
                + ₹ {Math.round(peakAdjustment).toLocaleString()}
              </span>
            </div>
          )}

          {holidayAdjustment > 0 && (
            <div className="flex justify-between items-center text-orange-600">
              <span>Holiday Adjustment</span>
              <span>
                + ₹ {Math.round(holidayAdjustment).toLocaleString()}
              </span>
            </div>
          )}

          {demandAdjustment > 0 && (
            <div className="flex justify-between items-center text-orange-600">
              <span>Demand Adjustment</span>
              <span>
                + ₹ {Math.round(demandAdjustment).toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              {isPriceFrozen ? "Frozen Flight Price" : "Current Flight Price"}
            </span>
            <span className={`font-medium ${isPriceFrozen ? "text-green-700" : ""}`}>
              {priceLoading
                ? "Updating..."
                : `₹ ${currentFlightPrice.toLocaleString()}`}
            </span>
          </div>

          <div
            className={`mt-3 rounded-lg border p-3 ${
              isPriceFrozen
                ? "border-green-200 bg-green-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            {isPriceFrozen ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    🔒 Price Frozen
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    ₹ {Number(priceFreeze.lockedPrice).toLocaleString()} is locked for this booking.
                  </p>
                </div>
                <span className="text-sm font-bold text-green-800 whitespace-nowrap">
                  {formatFreezeTime(freezeSecondsLeft)}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      🔒 Protect this price
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Freeze the current dynamic price for 30 minutes.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleFreezePrice}
                    disabled={freezeLoading || priceLoading || !currentUser?.id}
                    className="whitespace-nowrap border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {freezeLoading ? "Freezing..." : "Freeze Price"}
                  </Button>
                </div>
                {freezeError && (
                  <p className="text-xs text-red-600 mt-2">{freezeError}</p>
                )}
              </>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Taxes and Surcharges
            </span>
            <span className="font-medium">
              ₹ {totalTaxes.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Other Services
            </span>
            <span className="font-medium">
              ₹ {totalOtherServices.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-green-600">
            <span className="font-medium">Discounts</span>
            <span className="font-medium">
              - ₹ {Math.abs(totalDiscounts).toLocaleString()}
            </span>
          </div>

          {/* Seat Upgrade Amount */}
          {seatUpgradeAmount > 0 && (
            <div className="flex justify-between items-center text-blue-600">
              <span className="font-medium">
                Premium Seat Upgrade
              </span>
              <span className="font-medium">
                + ₹ {seatUpgradeAmount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">
                Total Amount
              </span>

              <span className="font-bold text-lg">
                ₹ {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* FLIGHT SEAT SELECTION */}
      {/* ========================= */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center">
              <Plane className="w-5 h-5 mr-2" />
              Select Your Seats
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Select {quantity} seat{quantity > 1 ? "s" : ""} for your
              traveller{quantity > 1 ? "s" : ""}.
            </p>
          </div>

          <div className="text-sm font-medium">
            {selectedSeats.length}/{quantity}
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-800">
                ⭐ Preferred Seat
              </p>
              {preferredSeat ? (
                <p className="text-xs text-blue-700 mt-1">
                  Your saved preference is <strong>{preferredSeat}</strong>.
                  {flightSeats.some(
                    (seat) =>
                      seat.seatNumber.toUpperCase() === preferredSeat &&
                      seat.status === "AVAILABLE"
                  )
                    ? " It is available on this flight."
                    : " It is currently unavailable on this flight."}
                </p>
              ) : (
                <p className="text-xs text-blue-700 mt-1">
                  Select a seat and save it so you can quickly use it on future bookings.
                </p>
              )}
            </div>

            {preferredSeat && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleUsePreferredSeat}
                disabled={
                  !flightSeats.some(
                    (seat) =>
                      seat.seatNumber.toUpperCase() === preferredSeat &&
                      seat.status === "AVAILABLE"
                  )
                }
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Use {preferredSeat}
              </Button>
            )}
          </div>

          {preferredSeatMessage && (
            <p className="text-xs text-blue-700 mt-2">
              {preferredSeatMessage}
            </p>
          )}
        </div>

        {/* Seat Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-5">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded border bg-white mr-2" />
            Available
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-blue-600 mr-2" />
            Selected
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-gray-400 mr-2" />
            Booked
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-400 mr-2" />
            Premium +₹500
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <span>Seat availability updates automatically every 10 seconds.</span>
          <span className={seatRefreshing ? "text-blue-600 font-medium" : "text-green-600 font-medium"}>
            {seatRefreshing ? "Refreshing seats..." : "● Live availability"}
          </span>
        </div>

        {seatLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading available seats...
          </div>
        ) : seatError ? (
          <div className="text-center py-6 text-red-500 text-sm">
            {seatError}
          </div>
        ) : flightSeats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No seat information available.
          </div>
        ) : (
          <>
            {/* Aircraft Front */}
            <div className="text-center text-xs text-gray-500 mb-3">
              ✈ FRONT OF AIRCRAFT
            </div>

            {/* Seat Map */}
            {/* Seat Map */}
<div className="max-h-[320px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
  <div className="space-y-3">

    {Array.from(
      new Set(
        flightSeats
          .map((seat) => seat.seatNumber.match(/^\d+/)?.[0])
          .filter(Boolean)
      )
    ).map((rowNumber) => {

      const rowSeats = flightSeats.filter(
        (seat) =>
          seat.seatNumber.match(/^\d+/)?.[0] === rowNumber
      );

      const leftSeats = rowSeats.filter((seat) =>
        ["A", "B"].includes(seat.seatNumber.slice(-1))
      );

      const rightSeats = rowSeats.filter((seat) =>
        ["C", "D"].includes(seat.seatNumber.slice(-1))
      );

      return (
        <div
          key={rowNumber}
          className="flex items-center justify-center gap-2"
        >

          {/* Row Number */}
          <div className="w-6 text-center text-xs text-gray-400">
            {rowNumber}
          </div>

          {/* Left Side - A B */}
          <div className="flex gap-2">
            {leftSeats.map((seat) => {

              const isSelected =
                selectedSeats.includes(seat.seatNumber);

              const isBooked =
                seat.status === "BOOKED";

              const isPremium =
                seat.seatType === "PREMIUM";

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={isBooked}
                  onClick={() => handleSeatClick(seat)}
                  className={`w-12 h-10 rounded-lg text-xs font-semibold border transition ${
                    isBooked
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : isSelected
                      ? "bg-blue-600 text-white border-blue-700"
                      : isPremium
                      ? "bg-yellow-100 text-yellow-800 border-yellow-400 hover:bg-yellow-200"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                  }`}
                  title={
                    isBooked
                      ? "Seat already booked"
                      : isPremium
                      ? `${seat.seatNumber} - Premium +₹${seat.price}`
                      : `${seat.seatNumber} - Standard`
                  }
                >
                  {preferredSeat === seat.seatNumber.toUpperCase() ? "⭐ " : ""}
                  {seat.seatNumber}
                </button>
              );
            })}
          </div>

          {/* Aisle */}
          <div className="w-6 border-l border-dashed border-gray-300 h-8" />

          {/* Right Side - C D */}
          <div className="flex gap-2">
            {rightSeats.map((seat) => {

              const isSelected =
                selectedSeats.includes(seat.seatNumber);

              const isBooked =
                seat.status === "BOOKED";

              const isPremium =
                seat.seatType === "PREMIUM";

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={isBooked}
                  onClick={() => handleSeatClick(seat)}
                  className={`w-12 h-10 rounded-lg text-xs font-semibold border transition ${
                    isBooked
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : isSelected
                      ? "bg-blue-600 text-white border-blue-700"
                      : isPremium
                      ? "bg-yellow-100 text-yellow-800 border-yellow-400 hover:bg-yellow-200"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                  }`}
                  title={
                    isBooked
                      ? "Seat already booked"
                      : isPremium
                      ? `${seat.seatNumber} - Premium +₹${seat.price}`
                      : `${seat.seatNumber} - Standard`
                  }
                >
                  {preferredSeat === seat.seatNumber.toUpperCase() ? "⭐ " : ""}
                  {seat.seatNumber}
                </button>
              );
            })}
          </div>

        </div>
      );
    })}

  </div>
</div>

            {/* Selected Seats */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">
                  Selected Seats
                </span>

                <span className="font-bold text-blue-700">
                  {selectedSeats.length}/{quantity}
                </span>
              </div>

              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSeats.map((seatNumber) => {
                    const seat = flightSeats.find(
                      (item) =>
                        item.seatNumber === seatNumber
                    );

                    return (
                      <span
                        key={seatNumber}
                        className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold"
                      >
                        {seatNumber}
                        {seat?.seatType === "PREMIUM"
                          ? " • Premium"
                          : ""}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  Please select your seat.
                </p>
              )}

              {selectedSeats.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seatNumber) => {
                      const isPreferred =
                        preferredSeat === seatNumber.toUpperCase();
                      const isSaving =
                        preferredSeatSavingFor === seatNumber.toUpperCase();

                      return (
                        <Button
                          key={`preferred-${seatNumber}`}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => savePreferredSeat(seatNumber)}
                          disabled={preferredSeatSaving || isPreferred}
                          className={
                            isPreferred
                              ? "border-green-300 bg-green-50 text-green-700"
                              : "border-blue-300 text-blue-700 hover:bg-blue-100"
                          }
                        >
                          {isPreferred
                            ? `✓ ${seatNumber} saved as preferred`
                            : isSaving
                            ? `Saving ${seatNumber}...`
                            : `⭐ Save ${seatNumber} as preferred`}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This saves the selected seat to your account for future bookings.
                  </p>
                </div>
              )}

              {seatUpgradeAmount > 0 && (
                <div className="flex justify-between mt-3 pt-3 border-t border-blue-200">
                  <span className="text-sm text-gray-600">
                    Premium seat upgrade
                  </span>

                  <span className="font-semibold text-blue-700">
                    + ₹ {seatUpgradeAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>

    {bookingError && (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {bookingError}
      </div>
    )}

    {/* Proceed to Payment */}
    <Button
      type="button"
      className="w-full mt-4"
      onClick={() => {
        setBookingError("");
        if (selectedSeats.length === quantity) {
          setPaymentOpen(true);
        } else {
          setSeatError(`Please select exactly ${quantity} seat${quantity > 1 ? "s" : ""}.`);
        }
      }}
      disabled={selectedSeats.length !== quantity || bookingLoading}
    >
      {selectedSeats.length !== quantity
        ? `Select ${quantity - selectedSeats.length} more seat${
            quantity - selectedSeats.length === 1 ? "" : "s"
          }`
        : "Proceed to Payment"}
    </Button>

    </DialogContent>

    {/* Payment is a separate Radix dialog so it appears above the
        booking dialog instead of being trapped inside its stacking layer. */}
    <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
      <DialogContent className="z-[200] sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border bg-gray-50 p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Flight</span>
              <span className="font-medium text-gray-900">
                {flight?.flightName}
              </span>
            </div>

            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Selected seats</span>
              <span className="font-medium text-gray-900">
                {selectedSeats.join(", ")}
              </span>
            </div>

            <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t">
              <span>Total Amount</span>
              <span>₹ {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>

            <div className="rounded-xl border-2 border-blue-600 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      UPI / Card
                    </div>
                    <div className="text-sm text-gray-500">
                      Pay securely
                    </div>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {bookingError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {bookingError}
            </div>
          )}

          <Button
            type="button"
            className="w-full h-11 text-base font-semibold"
            onClick={handlebooking}
            disabled={bookingLoading}
          >
            {bookingLoading
              ? "Processing..."
              : `Pay ₹ ${grandTotal.toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
);
  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <div className="flex items-center flex-wrap gap-4 mb-2">
                    <h2 className="text-lg font-bold flex items-center">
                      <span>{flight?.from}</span>
                      <ArrowRight className="w-5 h-5 mx-2" />
                      <span>{flight?.to}</span>
                    </h2>
                    <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-medium">
                      CANCELLATION FEES APPLY
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(flight.departureTime)}</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Non Stop - {flightDetails.duration}</span>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  View Fare Rules
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">{flight.flightName}</div>
                  <div className="text-sm text-gray-600">
                    {flightDetails.flightNo} • {flightDetails.aircraft}
                  </div>
                </div>
                <div className="ml-auto text-sm">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                    Economy
                  </span>
                  <span className="ml-2 text-gray-600">MMTSPECIAL</span>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-6 border-t pt-6">
                <div>
                  <div className="text-2xl font-bold">
                    {formatDate(flight.departureTime)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-start">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                    {flight.from} International Airport, Terminal T2
                  </div>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="text-sm text-gray-600 mb-1">
                    {flightDetails.duration}
                  </div>
                  <div className="w-32 h-0.5 bg-gray-300 relative my-2">
                    <div className="absolute -top-2 right-0 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                      <Plane className="w-3 h-3 text-gray-600" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Non-stop</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatDate(flight.arrivalTime)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-start justify-end">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                    {flight.to} International Airport, Terminal T3
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Luggage className="w-5 h-5 mr-2 text-gray-500" />
                  <span>Cabin Baggage: {flightDetails.cabinBaggage}</span>
                </div>
                <div className="flex items-center">
                  <Luggage className="w-5 h-5 mr-2 text-gray-500" />
                  <span>Check-in Baggage: {flightDetails.checkInBaggage}</span>
                </div>
              </div>
            </div>

            {/* Price History */}
            <PriceHistoryCard />

            {/* Cancellation Policy */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                  Cancellation & Date Change Policy
                </h2>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  View Policy
                </button>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-semibold">BLR-DEL</span>
                  </div>
                  <div className="font-bold text-lg">₹ 4,300</div>
                </div>
                <div className="h-2.5 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"></div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Now</span>
                  <span>16 Jan, 15:55</span>
                  <span>16 Jan, 17:55</span>
                </div>
              </div>
            </div>

            {/* Hotel Offers */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-red-500" />
                  Book a Flight & unlock these offers
                </h2>
                <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full font-medium">
                  Flyer Exclusive Deal
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {hotels.map((hotel, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
                        Best Seller
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {hotel.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-yellow-400">
                          {[...Array(hotel.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            Starting from
                          </div>
                          <div className="font-bold text-lg">
                            ₹ {hotel.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fare Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-6 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                Fare Summary
              </h2>
              <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base Fare</span>
              <span className="font-medium">
                {priceLoading
                  ? "Updating..."
                  : `₹ ${basePrice.toLocaleString()}`}
              </span>
            </div>

            {peakAdjustment > 0 && (
              <div className="flex justify-between items-center text-orange-600">
                <span>Peak Travel Adjustment</span>
                <span>+ ₹ {Math.round(peakAdjustment).toLocaleString()}</span>
              </div>
            )}

            {holidayAdjustment > 0 && (
              <div className="flex justify-between items-center text-orange-600">
                <span>Holiday Adjustment</span>
                <span>+ ₹ {Math.round(holidayAdjustment).toLocaleString()}</span>
              </div>
            )}

            {demandAdjustment > 0 && (
              <div className="flex justify-between items-center text-orange-600">
                <span>Demand Adjustment</span>
                <span>+ ₹ {Math.round(demandAdjustment).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {isPriceFrozen ? "Frozen Flight Price" : "Current Flight Price"}
              </span>
              <span className={`font-medium ${isPriceFrozen ? "text-green-700" : ""}`}>
                {priceLoading
                  ? "Updating..."
                  : `₹ ${currentFlightPrice.toLocaleString()}`}
              </span>
            </div>

            <div
              className={`mt-3 rounded-lg border p-3 ${
                isPriceFrozen
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              {isPriceFrozen ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      🔒 Price Frozen
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      ₹ {Number(priceFreeze.lockedPrice).toLocaleString()} is locked for this booking.
                    </p>
                  </div>
                  <span
                    ref={freezeCountdownRef}
                    className="text-sm font-bold text-green-800 whitespace-nowrap"
                  >
                    {formatFreezeTime(freezeSecondsLeft)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      🔒 Protect this price
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Freeze the current dynamic price for 30 minutes.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleFreezePrice}
                    disabled={freezeLoading || priceLoading || !currentUser?.id}
                    className="whitespace-nowrap border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {freezeLoading ? "Freezing..." : "Freeze Price"}
                  </Button>
                </div>
              )}
              {freezeError && !isPriceFrozen && (
                <p className="text-xs text-red-600 mt-2">{freezeError}</p>
              )}
            </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxes and Surcharges</span>
                  <span className="font-medium">
                    ₹ {totalTaxes.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Other Services</span>
                  <span className="font-medium">
                    ₹ {totalOtherServices.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-medium">Discounts</span>
                  <span className="font-medium">
                    - ₹ {Math.abs(totalDiscounts).toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-lg">
                      ₹ {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <Dialog open={open} onOpenChange={setopem}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-red-600 text-white">
                    Book Now
                  </Button>
                </DialogTrigger>
                {currentUser ? (
                  BookingContent()
                ) : (
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <p>Please log in to continue with your booking.</p>
                    <SignupDialog
                      initialMode="login"
                      onSuccess={(loggedInUser: any) => {
                        const normalizedUser = {
                          ...loggedInUser,
                          id:
                            loggedInUser?.id ??
                            loggedInUser?._id ??
                            loggedInUser?.userId,
                        };

                        dispatch(setUser(normalizedUser));
                        setAuthenticatedUser(normalizedUser);

                        if (typeof window !== "undefined") {
                          localStorage.setItem(
                            "user",
                            JSON.stringify(normalizedUser)
                          );
                        }
                      }}
                      trigger={
                        <Button className="w-full">
                          Log In / Sign Up
                        </Button>
                      }
                    />
                  </DialogContent>
                )}
              </Dialog>
              {/* Promo Codes */}
              <div className="mt-8">
                <div className="bg-[#FFF8E7] p-6 rounded-xl">
                  <h3 className="font-bold mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-yellow-600" />
                    PROMO CODES
                  </h3>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Enter promo code here"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    />
                  </div>
                  {promoOffers.map((offer, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg mb-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="promo"
                          className="mt-1.5 h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <div className="font-semibold text-red-600">
                            {offer.code}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {offer.description}
                          </p>
                          <button className="text-blue-600 text-sm font-medium mt-2 hover:text-blue-700">
                            Terms & Conditions
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookFlightPage;
