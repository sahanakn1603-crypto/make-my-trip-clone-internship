import {
  getflight,
  gethotel,
  getRecommendations,
  sendRecommendationFeedback,
  getRecommendationFeedback,
  getuserbyemail,
} from "@/api";

import Loader from "@/components/Loader";
import { SearchSelect } from "@/components/SearchSelect";
import { Button } from "@/components/ui/button";

import {
  Bus,
  Calendar,
  Car,
  CreditCard,
  HomeIcon,
  Hotel,
  MapPin,
  Plane,
  QrCode,
  Shield,
  Train,
  Umbrella,
  Users,
} from "lucide-react";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

function Home() {
  const [bookingtype, setbookingtype] = useState("flights");
  const [from, setfrom] = useState("");
  const [to, setto] = useState("");
  const [date, setdate] = useState("");
  const [today, settoday] = useState("");
  const [travelers, settravelers] = useState(1);
  const [searchresults, setsearchresult] = useState<any[]>([]);
  const [hotel, sethotel] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  const [flight, setflight] = useState<any[]>([]);

  // TASK 6 - Personalized recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<
    Record<string, "HELPFUL" | "IRRELEVANT">
  >({});

  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  const offers = [
    {
      title: "Domestic Flights",
      description: "Get up to 20% off on domestic flights",
      imageUrl:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800",
    },
    {
      title: "International Hotels",
      description: "Book luxury hotels worldwide",
      imageUrl:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
    },
    {
      title: "Holiday Packages",
      description: "Exclusive deals on holiday packages",
      imageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800",
    },
  ];

  const collections = [
    {
      title: "Stays in & Around Delhi",
      imageUrl:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800",
      tag: "TOP 8",
    },
    {
      title: "Stays in & Around Mumbai",
      imageUrl:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800",
      tag: "TOP 8",
    },
    {
      title: "Stays in & Around Bangalore",
      imageUrl:
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800",
      tag: "TOP 9",
    },
    {
      title: "Beach Destinations",
      imageUrl:
        "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?auto=format&fit=crop&w=800",
      tag: "TOP 11",
    },
  ];

  const wonders = [
    {
      title: "Shimla's Best Kept Secret",
      imageUrl:
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800",
    },
    {
      title: "Tamil Nadu's Charming Hill Town",
      imageUrl:
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800",
    },
    {
      title: "Quaint Little Hill Station in Gujarat",
      imageUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800",
    },
    {
      title: "A pleasant summer retreat",
      imageUrl:
        "https://images.unsplash.com/photo-1593181629936-11c609b8db9b?auto=format&fit=crop&w=800",
    },
  ];

  useEffect(() => {
    const currentDate = new Date();

    const localToday =
      currentDate.getFullYear() +
      "-" +
      String(currentDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(currentDate.getDate()).padStart(2, "0");

    settoday(localToday);

    const fetchdata = async () => {
      try {
        const data = await gethotel();
        sethotel(data);

        const flightdata = await getflight();
        setflight(flightdata);
      } catch (error) {
        console.error(error);
      } finally {
        setloading(false);
      }
    };

    fetchdata();

    const fetchRecommendations = async () => {
      if (!user?.email) {
        setRecommendations([]);
        setRecommendationLoading(false);
        return;
      }

      try {
        setRecommendationLoading(true);

        const recommendationData =
          await getRecommendations(user.email);

        setRecommendations(
          Array.isArray(recommendationData)
            ? recommendationData
            : []
        );

        // Restore the user's saved feedback so the correct
        // button remains selected after page refresh.
        const fullUser = await getuserbyemail(user.email);

        const userId =
          fullUser?.id ||
          fullUser?._id;

        if (userId) {
          const savedFeedback =
            await getRecommendationFeedback(userId);

          const feedbackMap: Record<
            string,
            "HELPFUL" | "IRRELEVANT"
          > = {};

          if (Array.isArray(savedFeedback)) {
            savedFeedback.forEach((item: any) => {
              if (
                item?.targetType &&
                item?.targetId &&
                item?.feedback
              ) {
                feedbackMap[
                  `${item.targetType}:${item.targetId}`
                ] = item.feedback;
              }
            });
          }

          setFeedbackStatus(feedbackMap);
        }
      } catch (error) {
        console.error("Recommendation fetch error:", error);
        setRecommendations([]);
      } finally {
        setRecommendationLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  const cityOptions = useMemo(() => {
    const cities = new Set<string>();

    flight.forEach((flight) => {
      cities.add(flight.from);
      cities.add(flight.to);
    });

    hotel.forEach((hotel) => {
      if (hotel.location) {
        cities.add(hotel.location);
      }
    });

    return Array.from(cities).map((city) => ({
      value: city,
      label: city,
    }));
  }, [flight, hotel]);

  /*
   * ONLY THESE FLIGHT ROUTES ARE AVAILABLE.
   *
   * These are exactly the routes provided by you.
   * Reverse routes are also included.
   */
  const allowedFlightRoutes: Record<string, string[]> = {
    Bengaluru: [
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Goa",
      "Delhi",
      "Mumbai",
      "Hyderabad",
      "Chennai",
      "Kolkata",
    ],

    Pune: [
      "Bengaluru",
      "Delhi",
      "Chennai",
    ],

    Ahmedabad: [
      "Bengaluru",
      "Delhi",
      "Mumbai",
      "Chennai",
    ],

    Jaipur: [
      "Bengaluru",
      "Delhi",
      "Mumbai",
      "Chennai",
    ],

    Goa: [
      "Bengaluru",
      "Delhi",
      "Mumbai",
      "Chennai",
    ],

    Delhi: [
      "Bengaluru",
      "Mumbai",
      "Hyderabad",
      "Chennai",
      "Kolkata",
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Goa",
    ],

    Mumbai: [
      "Bengaluru",
      "Delhi",
      "Hyderabad",
      "Chennai",
      "Kolkata",
      "Ahmedabad",
      "Jaipur",
      "Goa",
    ],

    Hyderabad: [
      "Bengaluru",
      "Delhi",
      "Mumbai",
      "Chennai",
    ],

    Chennai: [
      "Bengaluru",
      "Delhi",
      "Mumbai",
      "Hyderabad",
      "Kolkata",
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Goa",
    ],

    Kolkata: [
      "Bengaluru",
      "Delhi",
      "Mumbai",
      "Chennai",
    ],
  };

  const flightFromOptions = Object.keys(
    allowedFlightRoutes
  ).map((city) => ({
    value: city,
    label: city,
  }));

  const flightToOptions = (
    allowedFlightRoutes[from] || []
  ).map((city) => ({
    value: city,
    label: city,
  }));

  const handleFromChange = (value: string) => {
    setfrom(value);
    setto("");
  };

  if (loading) {
    return <Loader />;
  }

  // Save recommendation feedback.
  const handleRecommendationFeedback = async (
    recommendation: any,
    feedback: "HELPFUL" | "IRRELEVANT"
  ) => {
    if (!user?.email) {
      alert("Please log in to give recommendation feedback.");
      return;
    }

    const targetId = recommendation?.targetId;
    const targetType = recommendation?.targetType;

    if (!targetId || !targetType) {
      alert("Recommendation information is missing.");
      return;
    }

    const recommendationKey =
      `${targetType}:${targetId}`;

    try {
      setFeedbackLoading(
        `${recommendationKey}:${feedback}`
      );

      // Always resolve the latest user from the backend.
      // This guarantees that the MongoDB user ID is used.
      const fullUser = await getuserbyemail(user.email);

      const userId =
        fullUser?.id ||
        fullUser?._id;

      if (!userId) {
        throw new Error(
          "User ID was not returned by the backend."
        );
      }

      console.log(
        "Saving recommendation feedback:",
        {
          userId,
          targetType,
          targetId,
          feedback,
        }
      );

      await sendRecommendationFeedback(
        userId,
        targetType,
        targetId,
        feedback
      );

      console.log(
        "Recommendation feedback saved successfully."
      );

      setFeedbackStatus((current) => ({
        ...current,
        [recommendationKey]: feedback,
      }));

      if (feedback === "IRRELEVANT") {
        // Immediately remove an irrelevant recommendation.
        setRecommendations((current) =>
          current.filter(
            (item) =>
              !(
                item.targetType === targetType &&
                item.targetId === targetId
              )
          )
        );
      } else {
        // Immediately show the helpful feedback on the card.
        setRecommendations((current) =>
          current.map((item) => {
            if (
              item.targetType !== targetType ||
              item.targetId !== targetId
            ) {
              return item;
            }

            const existingReasons = Array.isArray(
              item.reasons
            )
              ? item.reasons
              : item.reason
              ? [item.reason]
              : [];

            const helpfulReason =
              "You previously found this recommendation helpful";

            return {
              ...item,
              score: Number(item.score || 0) + 15,
              reason: helpfulReason,
              reasons: existingReasons.includes(helpfulReason)
                ? existingReasons
                : [...existingReasons, helpfulReason],
            };
          })
        );
      }
    } catch (error: any) {
      console.error(
        "Recommendation feedback error:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Unable to save your feedback.";

      alert(`Feedback failed: ${message}`);
    } finally {
      setFeedbackLoading(null);
    }
  };

  const handlesearch = async () => {
    if (bookingtype === "flights") {
      if (!from || !to) {
        alert("Please select From and To cities.");
        return;
      }

      if (!date) {
        alert("Please select a travel date.");
        return;
      }

      try {
        const generateResponse = await fetch(
        `https://make-my-trip-clone-internship.onrender.com/flight-data/generate?date=${date}`,
        {
            method: "POST",
          }
        );

        if (!generateResponse.ok) {
          throw new Error(
            "Could not generate flights for the selected date."
          );
        }

        const response = await getflight();

        setflight(response);

        const normalizeCity = (city: string) =>
          city
            .trim()
            .toLowerCase()
            .replace("bangalore", "bengaluru");

        const results = response.filter(
          (FLIGHT: any, index: number, allFlights: any[]) => {
            const routeMatches =
              normalizeCity(FLIGHT.from) === normalizeCity(from) &&
              normalizeCity(FLIGHT.to) === normalizeCity(to);

            if (!routeMatches) {
              return false;
            }

            const dateMatches =
              FLIGHT.departureTime?.slice(0, 10) === date;

            if (!dateMatches) {
              return false;
            }

            const duplicateIndex = allFlights.findIndex(
              (otherFlight: any) =>
                normalizeCity(otherFlight.from) ===
                  normalizeCity(FLIGHT.from) &&
                normalizeCity(otherFlight.to) ===
                  normalizeCity(FLIGHT.to) &&
                otherFlight.flightName === FLIGHT.flightName &&
                otherFlight.departureTime === FLIGHT.departureTime
            );

            return index === duplicateIndex;
          }
        );

        setsearchresult(results);
      } catch (error) {
        console.error("Flight search error:", error);

        alert("Unable to search flights. Please try again.");
      }
    } else if (bookingtype === "hotels") {
      const results = hotel.filter(
        (hotel) =>
          hotel.location?.toLowerCase() === to.toLowerCase()
      );

      setsearchresult(results);
    }
  };

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

  const handlebooknow = (
    id: any,
    bookingDate?: string
  ) => {
    const selectedBookingDate =
      bookingDate || date;

    if (!selectedBookingDate) {
      alert("Please select a booking date first.");
      return;
    }

    if (bookingtype === "flights") {
      router.push(
        `/book-flight/${id}?travelers=${travelers}&date=${encodeURIComponent(
          selectedBookingDate
        )}`
      );
    } else {
      router.push(
        `/book-hotel/${id}?date=${encodeURIComponent(
          selectedBookingDate
        )}`
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=2940&q=80")',
      }}
    >
      <main className="container mx-auto px-4 py-6">

        {/* NAVIGATION */}
        <nav className="bg-white rounded-xl shadow-lg mx-auto max-w-5xl mb-6 p-4 overflow-x-auto">
          <div className="flex justify-between items-center min-w-max space-x-8">

            <NavItem
              icon={<Plane />}
              text="Flights"
              active={bookingtype === "flights"}
              onClick={() => setbookingtype("flights")}
            />

            <NavItem
              icon={<Hotel />}
              text="Hotels"
              active={bookingtype === "hotels"}
              onClick={() => setbookingtype("hotels")}
            />

            <NavItem
              icon={<HomeIcon />}
              text="Homestays"
            />

            <NavItem
              icon={<Umbrella />}
              text="Holiday"
            />

            <NavItem
              icon={<Train />}
              text="Trains"
            />

            <NavItem
              icon={<Bus />}
              text="Buses"
            />

            <NavItem
              icon={<Car />}
              text="Cabs"
            />

            <NavItem
              icon={<CreditCard />}
              text="Forex"
            />

            <NavItem
              icon={<Shield />}
              text="Insurance"
            />

          </div>
        </nav>

        {/* SEARCH BOX */}
        <div className="bg-white rounded-xl shadow-lg mx-auto max-w-5xl p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* FROM */}
            {bookingtype === "flights" && (
              <div className="col-span-1">
                <SearchSelect
                  options={flightFromOptions}
                  placeholder="From"
                  value={from}
                  onChange={handleFromChange}
                  icon={<MapPin className="text-gray-400" />}
                  subtitle="Enter city or airport"
                />
              </div>
            )}

            {/* TO */}
            <div className="col-span-1">
              <SearchSelect
                options={
                  bookingtype === "flights"
                    ? flightToOptions
                    : cityOptions
                }
                placeholder={
                  bookingtype === "flights"
                    ? "To"
                    : "City"
                }
                value={to}
                onChange={setto}
                icon={<MapPin className="text-gray-400" />}
                subtitle={
                  bookingtype === "flights"
                    ? "Enter city or airport"
                    : "Enter city"
                }
              />
            </div>

            {/* DATE */}
            <div className="col-span-1">
              <SearchInput
                icon={<Calendar className="text-gray-400" />}
                placeholder="Date"
                value={date}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>
                ) => setdate(e.target.value)}
                subtitle="Select a date"
                type="date"
                min={today || undefined}
              />
            </div>

            {/* TRAVELERS */}
            <div className="col-span-1">
              <SearchInput
                icon={<Users className="text-gray-400" />}
                placeholder="Travelers"
                value={travelers.toString()}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>
                ) =>
                  settravelers(
                    parseInt(e.target.value) || 1
                  )
                }
                subtitle="Number of travelers"
                type="number"
              />
            </div>

            {/* SEARCH BUTTON */}
            <Button
              className="col-span-1 h-full"
              onClick={handlesearch}
            >
              SEARCH
            </Button>

          </div>

          {/* SEARCH RESULTS */}
          <div className="mt-6">

            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Search Results
            </h2>

            {searchresults.length > 0 ? (

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {searchresults.map((result) => (

                  <div
                    key={result.id}
                    className="bg-white rounded-lg shadow p-4 border border-gray-200"
                  >

                    {bookingtype === "flights" ? (
                      <>
                        <p className="font-semibold text-lg">
                          Flight Name: {result.flightName}
                        </p>

                        <h3 className="font-semibold text-lg">
                          {result.from} to {result.to}
                        </h3>

                        <p className="text-gray-600">
                          Departure Time:{" "}
                          {formatDate(result.departureTime)}
                        </p>

                        <p className="text-gray-600">
                          Arrival Time:{" "}
                          {formatDate(result.arrivalTime)}
                        </p>

                        <p className="text-lg font-bold mt-2">
                          ₹{result.price}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">

                          <Button
                            className="w-full"
                            onClick={() =>
                              handlebooknow(result.id)
                            }
                          >
                            Book Now
                          </Button>

                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/flight-status?flightId=${result.id}`
                              )
                            }
                          >
                            ✈️ Track Flight
                          </Button>

                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-lg">
                          {result.hotelName}
                        </h3>

                        <p className="text-gray-600">
                          City: {result.location}
                        </p>

                        <p className="text-lg font-bold mt-2">
                          ₹{result.pricePerNight} per night
                        </p>

                        <Button
                          className="w-full mt-4"
                          onClick={() =>
                            handlebooknow(result.id)
                          }
                        >
                          Book Now
                        </Button>
                      </>
                    )}

                  </div>

                ))}

              </div>

            ) : (

              <p className="text-gray-600">
                No {bookingtype} available for the selected criteria.
              </p>

            )}

          </div>
        </div>

        {/* OTHER SECTIONS */}
        <div className="max-w-7xl mx-auto px-4">

          {/* PERSONALIZED RECOMMENDATIONS */}
          <section className="my-16">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-white">
                Personalized For You
              </h2>

              <p className="text-white/80 mt-1">
                Recommendations based on your travel history and preferences
              </p>

            </div>

            {recommendationLoading ? (

              <div className="bg-white rounded-xl shadow-lg p-8 text-center">

                <p className="text-gray-600">
                  Finding recommendations for you...
                </p>

              </div>

            ) : recommendations.length > 0 ? (

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {recommendations.map((recommendation) => {

                  const isFlight =
                    recommendation.targetType === "FLIGHT";

                  const recommendationKey =
                    `${recommendation.targetType}:${recommendation.targetId}`;

                  const helpfulKey =
                    `${recommendationKey}:HELPFUL`;

                  const irrelevantKey =
                    `${recommendationKey}:IRRELEVANT`;

                  const currentFeedback =
                    feedbackStatus[recommendationKey];

                  const whyReasons = Array.isArray(
                    recommendation.reasons
                  )
                    ? recommendation.reasons
                    : recommendation.reason
                    ? [recommendation.reason]
                    : [];

                  return (
                    <div
                      key={recommendationKey}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    >

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <span
                              className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                                isFlight
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {isFlight ? "✈️ FLIGHT" : "🏨 HOTEL"}
                            </span>

                            <h3 className="text-lg font-bold text-gray-900 mt-3">
                              {recommendation.title}
                            </h3>

                          </div>

                          <div className="text-sm font-bold text-blue-600">
                            {Math.round(
                              Number(recommendation.score || 0)
                            )}{" "}
                            match
                          </div>

                        </div>

                        {isFlight ? (
                          <>
                            <p className="text-gray-700 mt-3">
                              {recommendation.from} →{" "}
                              {recommendation.to}
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                              Departure:{" "}
                              {formatDate(
                                recommendation.departureTime
                              )}
                            </p>

                            <p className="text-xl font-bold text-gray-900 mt-3">
                              ₹{recommendation.price}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-700 mt-3">
                              📍 {recommendation.location}
                            </p>

                            <p className="text-xl font-bold text-gray-900 mt-3">
                              ₹{recommendation.price}{" "}
                              <span className="text-sm font-normal text-gray-500">
                                / night
                              </span>
                            </p>
                          </>
                        )}

                        {/* WHY THIS RECOMMENDATION */}
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">

                          <p className="font-semibold text-blue-800 text-sm">
                            💡 Why this recommendation?
                          </p>

                          <div className="mt-2 space-y-1">

                            {whyReasons.map(
                              (reason: string, index: number) => (
                                <p
                                  key={`${recommendationKey}-reason-${index}`}
                                  className="text-sm text-blue-700"
                                >
                                  • {reason}
                                </p>
                              )
                            )}

                          </div>

                        </div>

                        <Button
                          className="w-full mt-4"
                          onClick={() =>
                            handlebooknow(
                              recommendation.targetId,
                              isFlight
                                ? recommendation.departureTime?.slice(0, 10) || date
                                : date
                            )
                          }
                        >
                          {isFlight
                            ? "View & Book Flight"
                            : "View & Book Hotel"}
                        </Button>

                        {/* FEEDBACK LOOP */}
                        <div className="mt-4">

                          <p className="text-xs text-gray-500 mb-2">
                            Help us improve your recommendations
                          </p>

                          <div className="grid grid-cols-2 gap-2">

                            <Button
                              variant={
                                currentFeedback === "HELPFUL"
                                  ? "default"
                                  : "outline"
                              }
                              className="w-full text-sm"
                              disabled={feedbackLoading !== null}
                              onClick={() =>
                                handleRecommendationFeedback(
                                  recommendation,
                                  "HELPFUL"
                                )
                              }
                            >
                              {feedbackLoading === helpfulKey
                                ? "Saving..."
                                : currentFeedback === "HELPFUL"
                                ? "✓ Helpful"
                                : "👍 Helpful"}
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full text-sm"
                              disabled={feedbackLoading !== null}
                              onClick={() =>
                                handleRecommendationFeedback(
                                  recommendation,
                                  "IRRELEVANT"
                                )
                              }
                            >
                              {feedbackLoading === irrelevantKey
                                ? "Removing..."
                                : "👎 Not relevant"}
                            </Button>

                          </div>

                          {currentFeedback === "HELPFUL" && (
                            <p className="text-xs text-green-600 mt-2">
                              ✓ Your feedback was saved and will improve
                              future recommendations.
                            </p>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

            ) : (

              <div className="bg-white rounded-xl shadow-lg p-8 text-center">

                <p className="text-gray-700 font-medium">
                  No personalized recommendations available yet.
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Book a flight or hotel and interact with recommendations
                  to get more personalized suggestions.
                </p>

              </div>

            )}

          </section>

          {/* OFFERS */}
          <section className="my-16">

            <h2 className="text-2xl font-bold mb-8 text-white">
              Best Offers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {offers.map((offer, index) => (
                <OfferCard
                  key={index}
                  {...offer}
                />
              ))}

            </div>

          </section>

          {/* COLLECTIONS */}
          <section className="my-16">

            <h2 className="text-2xl font-bold text-white mb-8">
              Handpicked Collections for You
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {collections.map((collection, index) => (
                <CollectionCard
                  key={index}
                  {...collection}
                />
              ))}

            </div>

          </section>

          {/* WONDERS */}
          <section className="my-16">

            <h2 className="text-2xl font-bold text-white mb-8">
              Unlock Lesser-Known Wonders of India
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {wonders.map((wonder, index) => (
                <WonderCard
                  key={index}
                  {...wonder}
                />
              ))}

            </div>

          </section>

          {/* DOWNLOAD APP */}
          <DownloadApp />

        </div>

      </main>
    </div>
  );
}

/* OFFER CARD */

const OfferCard = ({
  title,
  description,
  imageUrl,
}: any) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">

      <img
        src={imageUrl}
        alt={title}
        className="w-full h-48 object-cover"
      />

      <div className="p-4">

        <h3 className="font-semibold text-lg mb-2">
          {title}
        </h3>

        <p className="text-gray-600 text-sm">
          {description}
        </p>

        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Book Now
        </button>

      </div>

    </div>
  );
};

/* COLLECTION CARD */

const CollectionCard = ({
  title,
  imageUrl,
  tag,
}: any) => {
  return (
    <div className="relative group cursor-pointer overflow-hidden rounded-lg">

      <img
        src={imageUrl}
        alt={title}
        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70">

        <div className="absolute top-4 left-4">

          <span className="bg-white text-black text-sm font-semibold px-2 py-1 rounded">
            {tag}
          </span>

        </div>

        <div className="absolute bottom-4 left-4 right-4">

          <h3 className="text-white text-lg font-semibold">
            {title}
          </h3>

        </div>

      </div>

    </div>
  );
};

/* DOWNLOAD APP */

const DownloadApp = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto my-12">

      <div className="flex flex-col md:flex-row items-center justify-between">

        <div className="mb-6 md:mb-0">

          <h3 className="text-xl font-bold mb-2">
            Download App Now!
          </h3>

          <p className="text-gray-600 mb-4">
            Get India's #1 travel super app with best deals on flights
          </p>

          <div className="flex space-x-4">

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
              alt="App Store"
              className="h-10"
            />

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
              alt="Play Store"
              className="h-10"
            />

          </div>

        </div>

        <div className="flex items-center space-x-4">

          <QrCode className="w-24 h-24" />

          <p className="text-sm text-gray-600">
            Scan QR code to download the app
          </p>

        </div>

      </div>

    </div>
  );
};

/* WONDER CARD */

const WonderCard = ({
  title,
  imageUrl,
}: any) => {
  return (
    <div className="relative group cursor-pointer overflow-hidden rounded-lg">

      <img
        src={imageUrl}
        alt={title}
        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70">

        <div className="absolute bottom-4 left-4 right-4">

          <h3 className="text-white text-lg font-semibold">
            {title}
          </h3>

        </div>

      </div>

    </div>
  );
};

/* NAV ITEM */

function NavItem({
  icon,
  text,
  active = false,
  onClick,
}: any) {
  return (
    <button
      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
        active
          ? "text-blue-500"
          : "text-gray-600 hover:text-blue-500"
      }`}
      onClick={onClick}
    >
      {icon}

      <span className="text-sm mt-1 whitespace-nowrap">
        {text}
      </span>

    </button>
  );
}

/* SEARCH INPUT */

function SearchInput({
  icon,
  placeholder,
  value,
  onChange,
  subtitle,
  type = "text",
  min,
}: any) {
  return (
    <div className="border rounded-lg p-3 hover:border-blue-500 cursor-pointer h-full">

      <div className="flex items-center space-x-2">

        {icon}

        <div className="flex-1 min-w-0">

          <div className="text-sm text-gray-500 truncate">
            {placeholder}
          </div>

          <input
            type={type}
            value={value}
            min={min}
            onChange={onChange}
            className="font-semibold w-full bg-transparent outline-none"
            placeholder={placeholder}
          />

          <div className="text-xs text-gray-400 truncate">
            {subtitle}
          </div>

        </div>

      </div>

    </div>
  );
}

export default Home;