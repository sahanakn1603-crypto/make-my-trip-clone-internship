import { useRouter } from "next/router";
import {
  Star,
  MapPin,
  School as Pool,
  UtensilsCrossed,
  Wine,
  Power,
  ChevronRight,
  Camera,
  Image,
  CreditCard,
  Ticket,
  Plane,
  Home,
} from "lucide-react";
import { useEffect, useState } from "react";
import { gethotel, handlehotelbooking } from "@/api";

interface Hotel {
  id: string;
  hotelName: string;
  location: string;
  pricePerNight: number;
  availableRooms: number;
  standardRooms?: number;
  deluxeRooms?: number;
  premiumRooms?: number;
  amenities: string;
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

import { useDispatch, useSelector } from "react-redux";
import SignupDialog from "@/components/SignupDialog";
import ReviewSection from "@/components/ReviewSection";
import Loader from "@/components/Loader";
import { setUser } from "@/store";

const BookHotelPage = () => {
  const [quantity, setQuantity] = useState(1);
  const [selectedRoomType, setSelectedRoomType] = useState("STANDARD");

  const router = useRouter();

  const { id, date: queryDate } = router.query;

  const hotelId = Array.isArray(id) ? id[0] : id;

  const bookingDate = Array.isArray(queryDate)
    ? queryDate[0]
    : queryDate || "";

  const [hotels, sethotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityRefreshing, setAvailabilityRefreshing] = useState(false);

  const [preferredRoom, setPreferredRoom] = useState("");
  const [preferredRoomMessage, setPreferredRoomMessage] = useState("");

  const user = useSelector((state: any) => state.user.user);

  const [open, setopem] = useState(false);

  const dispatch = useDispatch();

  /*
   * =========================================================
   * BOOKING DATE VALIDATION
   * =========================================================
   *
   * The selected hotel date comes from:
   *
   * /book-hotel/{id}?date=YYYY-MM-DD
   *
   * We validate it on the frontend before allowing payment.
   */

  const today = new Date();

  const todayString =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  const isBookingDateValid =
    bookingDate !== "" && bookingDate >= todayString;

  const bookingDateError =
    bookingDate === ""
      ? "Please select a check-in date before booking."
      : bookingDate < todayString
      ? "This date has already passed. Please select an updated date."
      : "";

  useEffect(() => {
    if (!router.isReady || !hotelId) {
      return;
    }

    const fetchhotels = async () => {
      try {
        setLoading(true);

        const data = await gethotel();

        const filteredData = Array.isArray(data)
          ? data.filter(
              (hotel: any) => String(hotel?.id) === String(hotelId)
            )
          : [];

        sethotels(filteredData);
      } catch (error) {
        console.error("Error fetching hotel:", error);
        sethotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchhotels();
  }, [router.isReady, hotelId]);

  /*
   * TASK 4 - SAVE PREFERRED ROOM
   */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userId = user?.id ?? user?._id ?? user?.userId;

    if (!userId) {
      setPreferredRoom("");
      return;
    }

    const savedRoom = localStorage.getItem(
      `preferredHotelRoom_${userId}`
    );

    if (
      savedRoom === "STANDARD" ||
      savedRoom === "DELUXE" ||
      savedRoom === "PREMIUM"
    ) {
      setPreferredRoom(savedRoom);
    } else {
      setPreferredRoom("");
    }
  }, [user?.id, user?._id, user?.userId]);

  /*
   * TASK 4 - REAL-TIME ROOM AVAILABILITY
   */

  useEffect(() => {
    if (!router.isReady || !hotelId) {
      return;
    }

    let cancelled = false;

    const refreshHotelAvailability = async () => {
      try {
        setAvailabilityRefreshing(true);

        const data = await gethotel();

        if (cancelled || !Array.isArray(data)) {
          return;
        }

        const latestHotel = data.find(
          (item: any) => String(item?.id) === String(hotelId)
        );

        if (!latestHotel) {
          return;
        }

        sethotels([latestHotel]);

        const latestAvailability =
          selectedRoomType === "DELUXE"
            ? Number(
                latestHotel?.deluxeRooms ??
                  Math.floor(
                    Number(latestHotel?.availableRooms || 0) * 0.3
                  )
              )
            : selectedRoomType === "PREMIUM"
            ? Number(
                latestHotel?.premiumRooms ??
                  Math.max(
                    0,
                    Number(latestHotel?.availableRooms || 0) -
                      Math.ceil(
                        Number(latestHotel?.availableRooms || 0) * 0.5
                      ) -
                      Math.floor(
                        Number(latestHotel?.availableRooms || 0) * 0.3
                      )
                  )
              )
            : Number(
                latestHotel?.standardRooms ??
                  Math.ceil(
                    Number(latestHotel?.availableRooms || 0) * 0.5
                  )
              );

        if (latestAvailability <= 0) {
          setQuantity(1);
        } else {
          setQuantity((currentQuantity) =>
            Math.max(
              1,
              Math.min(currentQuantity, latestAvailability)
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Real-time hotel availability refresh failed:",
            error
          );
        }
      } finally {
        if (!cancelled) {
          setAvailabilityRefreshing(false);
        }
      }
    };

    const intervalId = window.setInterval(
      refreshHotelAvailability,
      10000
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [router.isReady, hotelId, selectedRoomType]);

  if (!router.isReady || loading) {
    return <Loader />;
  }

  const hotel = hotels[0];

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Hotel not found
          </h1>

          <p className="text-gray-600 mb-5">
            We could not find this hotel. Please go back to the hotel search
            and try again.
          </p>

          <Button onClick={() => router.push("/")}>
            Back to Hotel Search
          </Button>
        </div>
      </div>
    );
  }

  const hotelData = {
    name: "Magnum Resorts- Near Candolim Beach",
    rating: 3,
    maxRating: 5,
    propertyPhotos: 91,
    guestPhotos: 386,
    description:
      "One of the best hotels in North Goa, operating since 2001 catering to international and domestic individual and group travelers.",
    amenities: [
      {
        icon: <Pool className="w-5 h-5" />,
        name: "Swimming Pool",
      },
      {
        icon: <UtensilsCrossed className="w-5 h-5" />,
        name: "Restaurant",
      },
      {
        icon: <Wine className="w-5 h-5" />,
        name: "Bar",
      },
      {
        icon: <Power className="w-5 h-5" />,
        name: "Power Backup",
      },
    ],
    room: {
      type: "Standard Room",
      capacity: "Fits 2 Adults",
      features: [
        "No meals included",
        "10% off on food & beverage services",
        "Complimentary welcome drinks on arrival",
        "Non-Refundable",
      ],
      originalPrice: 8999,
      discountedPrice: 664,
      taxes: 527,
    },
    location: {
      area: "Candolim",
      distance: "7 minutes walk to Candolim Beach",
    },
    reviews: {
      rating: 3.8,
      count: 784,
      text: "Very Good",
    },
  };

  /*
   * TASK 4 - ROOM TYPE SELECTION
   */

  const roomTypes = [
    {
      id: "STANDARD",
      name: "Standard Room",
      capacity: "Fits 2 Adults",
      price: Number(hotel?.pricePerNight || 0),
      upgrade: 0,
      availability: Number(
        hotel?.standardRooms ??
          Math.ceil(Number(hotel?.availableRooms || 0) * 0.5)
      ),
      image:
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80",
      features: [
        "Comfortable room",
        "No meals included",
        "Complimentary welcome drink",
      ],
    },
    {
      id: "DELUXE",
      name: "Deluxe Room",
      capacity: "Fits 3 Adults",
      price: Number(hotel?.pricePerNight || 0) + 1000,
      upgrade: 1000,
      availability: Number(
        hotel?.deluxeRooms ??
          Math.floor(Number(hotel?.availableRooms || 0) * 0.3)
      ),
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
      features: [
        "Larger room",
        "Better view",
        "Complimentary breakfast",
      ],
    },
    {
      id: "PREMIUM",
      name: "Premium Suite",
      capacity: "Fits 4 Adults",
      price: Number(hotel?.pricePerNight || 0) + 2500,
      upgrade: 2500,
      availability: Number(
        hotel?.premiumRooms ??
          Math.max(
            0,
            Number(hotel?.availableRooms || 0) -
              Math.ceil(Number(hotel?.availableRooms || 0) * 0.5) -
              Math.floor(Number(hotel?.availableRooms || 0) * 0.3)
          )
      ),
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
      features: [
        "Premium suite",
        "Separate sitting area",
        "Breakfast included",
      ],
    },
  ];

  const selectedRoom =
    roomTypes.find((room) => room.id === selectedRoomType) ||
    roomTypes[0];

  const selectedRoomAvailability = Math.max(
    0,
    Number(selectedRoom.availability || 0)
  );

  const handleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const value = Number.parseInt(e.target.value, 10);

    setQuantity(
      Number.isNaN(value)
        ? 1
        : Math.max(1, Math.min(value, selectedRoomAvailability))
    );
  };

  const handleRoomTypeChange = (roomTypeId: string) => {
    const room = roomTypes.find((item) => item.id === roomTypeId);

    if (!room) return;

    setSelectedRoomType(roomTypeId);

    const roomAvailability = Math.max(
      0,
      Number(room.availability || 0)
    );

    setQuantity((previous) =>
      roomAvailability > 0
        ? Math.min(previous, roomAvailability)
        : 1
    );
  };

  const savePreferredRoom = () => {
    const userId = user?.id ?? user?._id ?? user?.userId;

    if (!userId) {
      setPreferredRoomMessage(
        "Please log in to save your preferred room."
      );
      return;
    }

    localStorage.setItem(
      `preferredHotelRoom_${userId}`,
      selectedRoomType
    );

    setPreferredRoom(selectedRoomType);

    const roomName =
      selectedRoomType === "DELUXE"
        ? "Deluxe Room"
        : selectedRoomType === "PREMIUM"
        ? "Premium Suite"
        : "Standard Room";

    setPreferredRoomMessage(
      `⭐ ${roomName} saved as your preferred room.`
    );
  };

  const handleUsePreferredRoom = () => {
    if (!preferredRoom) return;

    const room = roomTypes.find(
      (item) => item.id === preferredRoom
    );

    if (!room) return;

    const availability = Number(room.availability || 0);

    if (availability <= 0) {
      setPreferredRoomMessage(
        `${room.name} is currently unavailable.`
      );
      return;
    }

    setSelectedRoomType(preferredRoom);

    setQuantity((previous) =>
      Math.max(1, Math.min(previous, availability))
    );

    setPreferredRoomMessage(
      `⭐ ${room.name} selected from your preferred room.`
    );
  };

  /*
   * HOTEL FARE CALCULATION
   */

  const baseFare =
    Number(hotel?.pricePerNight || 0) * quantity;

  const roomUpgradeAmount =
    selectedRoom.upgrade * quantity;

  const totalTaxes =
    hotelData.room.taxes * quantity;

  const grandTotal =
    baseFare +
    roomUpgradeAmount +
    totalTaxes;

  /*
   * =========================================================
   * HOTEL BOOKING
   * =========================================================
   */

  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();

    /*
     * FRONTEND DATE PROTECTION
     */

    if (!isBookingDateValid) {
      return;
    }

    try {
      const data = await handlehotelbooking(
        user?.id,
        hotel?.id,
        quantity,
        grandTotal,
        selectedRoomType,
        bookingDate
      );

      const updateuser = {
        ...user,
        bookings: [...user.bookings, data],
      };

      dispatch(setUser(updateuser));

      setopem(false);
      setQuantity(1);
      setSelectedRoomType("STANDARD");

      router.push("/profile");
    } catch (error: any) {
      console.log(error);

      /*
       * Backend also protects against old dates.
       * Keep the booking page open if backend rejects it.
       */

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Unable to complete the booking.";

      alert(backendMessage);
    }
  };

  const renderHotelContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Home className="w-6 h-6 mr-2" />
          Hotel Booking Details
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-6 mt-4">

        {/* =====================================================
            BOOKING DATE
           ===================================================== */}

        <div
          className={`rounded-xl border-2 p-4 ${
            isBookingDateValid
              ? "border-green-200 bg-green-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">
                Check-in Date
              </p>

              {isBookingDateValid ? (
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {bookingDate}
                </p>
              ) : (
                <p className="text-lg font-bold text-red-700 mt-1">
                  Date unavailable
                </p>
              )}
            </div>

            {isBookingDateValid ? (
              <span className="text-sm font-bold text-green-700">
                ✓ Valid date
              </span>
            ) : (
              <span className="text-sm font-bold text-red-700">
                ⚠ Invalid date
              </span>
            )}
          </div>

          {!isBookingDateValid && (
            <p className="text-sm text-red-700 font-medium mt-3">
              ⚠️ {bookingDateError}
            </p>
          )}
        </div>

        {/* =====================================================
            SELECTED ROOM
           ===================================================== */}

        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">
                Selected room
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-1">
                {selectedRoom.name}
              </h3>

              <p className="text-sm text-gray-600 mt-1">
                {selectedRoom.capacity}
              </p>
            </div>

            <span className="text-sm font-bold text-blue-700">
              ✓ Already selected
            </span>
          </div>

          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ₹ {selectedRoom.price.toLocaleString()}
              </span>

              <span className="text-sm text-gray-500">
                {" "}
                / night
              </span>
            </div>

            {selectedRoom.upgrade > 0 && (
              <span className="text-sm font-semibold text-orange-600">
                +₹ {selectedRoom.upgrade.toLocaleString()} upgrade
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Your room choice from the previous page has been carried into this booking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Hotel Name */}

          <div className="space-y-2">
            <Label
              htmlFor="hotelName"
              className="flex items-center"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Hotel Name
            </Label>

            <Input
              id="hotelName"
              value={hotel.hotelName}
              readOnly
            />
          </div>

          {/* Location */}

          <div className="space-y-2">
            <Label
              htmlFor="location"
              className="flex items-center"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </Label>

            <Input
              id="location"
              value={hotel.location}
              readOnly
            />
          </div>

          {/* Price Per Night */}

          <div className="space-y-2">
            <Label
              htmlFor="pricePerNight"
              className="flex items-center"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Price Per Night
            </Label>

            <Input
              id="pricePerNight"
              value={`₹ ${hotel.pricePerNight}`}
              readOnly
            />
          </div>

          {/* Available Rooms */}

          <div className="space-y-2">
            <Label
              htmlFor="availableRooms"
              className="flex items-center"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Available Rooms
            </Label>

            <Input
              id="availableRooms"
              value={`${selectedRoomAvailability} (${selectedRoom.name})`}
              readOnly
            />
          </div>

          {/* Number of Rooms */}

          <div className="space-y-2">
            <Label
              htmlFor="quantity"
              className="flex items-center"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Number of Rooms to Book
            </Label>

            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedRoomAvailability}
              value={quantity}
              onChange={handleQuantityChange}
              disabled={selectedRoomAvailability <= 0}
            />

            <p className="text-xs text-gray-500">
              Maximum {selectedRoomAvailability}{" "}
              {selectedRoom.name.toLowerCase()}
              {selectedRoomAvailability === 1 ? "" : "s"} can be booked.
            </p>
          </div>
        </div>

        {/* =====================================================
            FARE SUMMARY
           ===================================================== */}

        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Fare Summary
          </h3>

          <div className="space-y-2">

            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Room Type
              </span>

              <span className="font-medium text-blue-700">
                {selectedRoom.name}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Base Fare
              </span>

              <span className="font-medium">
                ₹ {baseFare.toLocaleString()}
              </span>
            </div>

            {roomUpgradeAmount > 0 && (
              <div className="flex justify-between items-center text-orange-600">
                <span>Room Upgrade</span>

                <span>
                  + ₹ {roomUpgradeAmount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Taxes and Extracharges
              </span>

              <span className="font-medium">
                ₹ {totalTaxes.toLocaleString()}
              </span>
            </div>

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
      </div>

      {/* =====================================================
          PAYMENT BUTTON
         ===================================================== */}

      <Button
        className="w-full mt-4"
        onClick={handlebooking}
        disabled={!isBookingDateValid || selectedRoomAvailability <= 0}
      >
        {!isBookingDateValid
          ? "Select an Updated Date"
          : "Proceed to Payment"}
      </Button>

      {!isBookingDateValid && (
        <p className="text-center text-sm text-red-600 font-medium mt-2">
          ⚠️ {bookingDateError}
        </p>
      )}

    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm">

            <a href="/" className="text-blue-500">
              Home
            </a>

            <ChevronRight className="w-4 h-4 text-gray-400" />

            <a href="/" className="text-blue-500">
              {hotel?.location}
            </a>

            <ChevronRight className="w-4 h-4 text-gray-400" />

            <span className="text-gray-600">
              {hotel?.hotelName}
            </span>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}

          <div className="lg:col-span-2">

            {/* Hotel Title */}

            <div className="mb-6">

              <h1 className="text-2xl font-bold mb-2">
                {hotel.hotelName}
              </h1>

              <div className="flex items-center space-x-1">

                {[...Array(hotelData.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}

                {[...Array(
                  hotelData.maxRating - hotelData.rating
                )].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-gray-300"
                  />
                ))}

              </div>
            </div>

            {/* Image Gallery */}

            <div className="grid grid-cols-3 gap-4 mb-8">

              <div className="col-span-2 relative group cursor-pointer">

                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800"
                  alt="Hotel Main"
                  className="w-full h-80 object-cover rounded-lg"
                />

                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full flex items-center space-x-1">

                  <Camera className="w-4 h-4" />

                  <span className="text-sm">
                    +{hotelData.propertyPhotos} Property Photos
                  </span>

                </div>

              </div>

              <div className="space-y-4">

                <div className="relative group cursor-pointer">

                  <img
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800"
                    alt="Hotel Room"
                    className="w-full h-[152px] object-cover rounded-lg"
                  />

                </div>

                <div className="relative group cursor-pointer">

                  <img
                    src="https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800"
                    alt="Hotel Amenity"
                    className="w-full h-[152px] object-cover rounded-lg"
                  />

                  <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full flex items-center space-x-1">

                    <Image className="w-4 h-4" />

                    <span className="text-sm">
                      +{hotelData.guestPhotos} Guest Photos
                    </span>

                  </div>

                </div>

              </div>
            </div>

            {/* Description */}

            <p className="text-gray-600 mb-6">
              {hotelData.description}

              <button className="text-blue-500 ml-2">
                Read more
              </button>
            </p>

            {/* Amenities */}

            <div className="mb-8">

              <h2 className="text-xl font-semibold mb-4">
                Amenities
              </h2>

              <div className="flex flex-wrap gap-6">

                {hotelData.amenities.map(
                  (amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-gray-600"
                    >
                      {amenity.icon}

                      <span>
                        {amenity.name}
                      </span>
                    </div>
                  )
                )}

                <button className="text-blue-500">
                  + 31 Amenities
                </button>

              </div>
            </div>

            {/* HOTEL PROPERTY PHOTO GALLERY */}

            <div className="mt-10">

              <div className="mb-4">

                <h2 className="text-2xl font-bold text-gray-900">
                  Hotel Photos
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Explore the property, rooms and facilities before booking.
                </p>

              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {[
                  {
                    src: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
                    title: "Hotel & Property",
                  },
                  {
                    src: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                    title: "Swimming Pool",
                  },
                  {
                    src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
                    title: "Guest Room",
                  },
                  {
                    src: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
                    title: "Hotel Interior",
                  },
                ].map((photo) => (
                  <button
                    key={photo.src}
                    type="button"
                    onClick={() => {
                      window.open(
                        photo.src,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                    className="group relative overflow-hidden rounded-xl h-48 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 text-left">

                      <span className="text-sm font-semibold text-white">
                        {photo.title}
                      </span>

                    </div>

                    <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      View photo
                    </div>

                  </button>
                ))}

              </div>
            </div>

            {/* PROPERTY HIGHLIGHTS */}

            <div className="mt-10">

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Property Highlights
              </h2>

              <p className="text-sm text-gray-500 mb-5">
                Everything you need for a comfortable and convenient stay.
              </p>

              <div className="grid grid-cols-2 gap-4">

                {[
                  {
                    icon: "🏊",
                    title: "Swimming Pool",
                    text: "Relax and unwind at the property pool.",
                  },
                  {
                    icon: "🍽️",
                    title: "Restaurant",
                    text: "On-site dining and food service available.",
                  },
                  {
                    icon: "📶",
                    title: "Free Wi-Fi",
                    text: "Stay connected throughout the property.",
                  },
                  {
                    icon: "🚗",
                    title: "Parking",
                    text: "Convenient parking facilities for guests.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >

                    <div className="text-2xl mb-3">
                      {item.icon}
                    </div>

                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {item.text}
                    </p>

                  </div>
                ))}

              </div>
            </div>

          </div>

          {/* =====================================================
              BOOKING CARD
             ===================================================== */}

          <div className="lg:col-span-1">

            <div className="bg-white rounded-xl shadow-lg p-6">

              <div className="mb-5">

                <h3 className="text-xl font-semibold mb-1">
                  Choose your room
                </h3>

                <p className="text-sm text-gray-500">
                  Compare room types and select an upgrade if you want more
                  space or amenities.
                </p>

              </div>

              {/* ROOM TYPES */}

              <div className="space-y-3 mb-6">

                {roomTypes.map((room) => {

                  const isSelected =
                    selectedRoomType === room.id;

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() =>
                        handleRoomTypeChange(room.id)
                      }
                      className={`w-full text-left rounded-xl border-2 overflow-hidden transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }`}
                    >

                      <div className="flex gap-3 p-3">

                        <img
                          src={room.image}
                          alt={room.name}
                          className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center justify-between gap-2">

                            <h4 className="font-semibold text-gray-900">
                              {room.name}
                            </h4>

                            {isSelected && (
                              <span className="text-xs font-bold text-blue-700">
                                ✓ Selected
                              </span>
                            )}

                          </div>

                          <p className="text-xs text-gray-500 mt-1">
                            {room.capacity}
                          </p>

                          <div className="mt-2">

                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                                room.availability > 0
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {room.availability > 0
                                ? `${room.availability} rooms available`
                                : "Sold out"}
                            </span>

                          </div>

                          <div className="flex items-center justify-between mt-2">

                            <span className="font-bold text-gray-900">

                              ₹ {room.price.toLocaleString()}

                              <span className="text-xs font-normal text-gray-500">
                                {" "}
                                / night
                              </span>

                            </span>

                            {room.upgrade > 0 && (
                              <span className="text-xs text-orange-600 font-medium">
                                +₹ {room.upgrade.toLocaleString()}
                              </span>
                            )}

                          </div>

                        </div>
                      </div>

                    </button>
                  );
                })}

              </div>

              <h3 className="text-lg font-semibold mb-4">
                {selectedRoom.name}
              </h3>

              <p className="text-gray-600 mb-4">
                {hotelData.room.capacity}
              </p>

              <ul className="space-y-3 mb-6">

                {hotelData.room.features.map(
                  (feature, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2"
                    >
                      <span className="text-gray-400">
                        •
                      </span>

                      <span className="text-gray-600">
                        {feature}
                      </span>
                    </li>
                  )
                )}

              </ul>

              <div className="mb-6">

                <div className="flex items-center justify-between mb-2">

                  <span className="text-gray-800 font-semibold">
                    Price Per Night:
                  </span>

                  <span className="text-lg font-medium text-gray-800">
                    ₹ {selectedRoom.price.toLocaleString()}
                  </span>

                </div>

                <div className="flex items-center justify-between mb-4">

                  <span className="text-gray-800 font-semibold">
                    Available Rooms:
                  </span>

                  <span className="text-lg font-medium text-gray-800">
                    {selectedRoomAvailability}
                  </span>

                </div>

                <div className="flex justify-end items-center gap-2 -mt-3 mb-4 text-xs text-gray-500">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      availabilityRefreshing
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />

                  {availabilityRefreshing
                    ? "Updating availability..."
                    : "Live availability"}

                </div>

                <p className="text-sm text-gray-500 -mt-3 mb-4">
                  {selectedRoom.name} availability
                </p>

                {/* PREFERRED ROOM */}

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 mb-6">

                  <div className="flex items-center justify-between gap-3">

                    <div>

                      <p className="font-semibold text-gray-900">
                        ⭐ Preferred Room
                      </p>

                      <p className="text-xs text-gray-600 mt-1">

                        {preferredRoom
                          ? preferredRoom === "DELUXE"
                            ? "Deluxe Room is saved"
                            : preferredRoom === "PREMIUM"
                            ? "Premium Suite is saved"
                            : "Standard Room is saved"
                          : "Save this room type for your next booking"}

                      </p>

                    </div>

                    {preferredRoom === selectedRoomType ? (
                      <span className="text-sm font-semibold text-blue-700 whitespace-nowrap">
                        ✓ Preferred
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={savePreferredRoom}
                        className="whitespace-nowrap"
                      >
                        Save as Preferred
                      </Button>
                    )}

                  </div>

                  {preferredRoom &&
                    preferredRoom !== selectedRoomType && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUsePreferredRoom}
                        className="w-full mt-3"
                      >
                        Use Preferred Room
                      </Button>
                    )}

                  {preferredRoomMessage && (
                    <p className="text-xs text-blue-700 mt-2">
                      {preferredRoomMessage}
                    </p>
                  )}

                </div>

                {/* Amenities */}

                <div>

                  <h4 className="text-gray-800 font-semibold mb-2">
                    Amenities:
                  </h4>

                  <p className="text-gray-600">
                    {hotel.amenities}
                  </p>

                </div>

              </div>

              {/* PRICE */}

              <div className="space-y-2 mb-6">

                <div className="flex items-center justify-between">

                  <span className="text-gray-500 line-through">
                    ₹ {selectedRoom.price.toLocaleString()}
                  </span>

                  <span className="text-gray-500">
                    Per Night:
                  </span>

                </div>

                <div className="flex items-center justify-between text-2xl font-bold">

                  <span>
                    ₹ {grandTotal.toLocaleString()}
                  </span>

                  <span className="text-sm text-gray-500 font-normal">
                    + ₹ {totalTaxes} taxes & fees
                  </span>

                </div>

              </div>

              {/* SELECTED ROOM */}

              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-blue-800 font-medium">
                    Selected room
                  </span>

                  <span className="text-sm font-bold text-blue-800">
                    {selectedRoom.name}
                  </span>

                </div>

                {roomUpgradeAmount > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Room upgrade: +₹{" "}
                    {roomUpgradeAmount.toLocaleString()}
                  </p>
                )}

              </div>

              {/* BOOKING DIALOG */}

              <Dialog
                open={open}
                onOpenChange={setopem}
              >

                <DialogTrigger asChild>

                  <button
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors mb-3"
                  >
                    BOOK THIS NOW
                  </button>

                </DialogTrigger>

                {user ? (
                  renderHotelContent()
                ) : (
                  <DialogContent className="bg-white">

                    <DialogHeader>
                      <DialogTitle>
                        Login Required
                      </DialogTitle>
                    </DialogHeader>

                    <p>
                      Please log in to continue with your booking.
                    </p>

                    <SignupDialog
                      trigger={
                        <Button className="w-full">
                          Log In / Sign Up
                        </Button>
                      }
                    />

                  </DialogContent>
                )}

              </Dialog>

              <button className="w-full text-blue-500 text-center">
                14 More Options
              </button>

            </div>

            {/* REVIEWS */}

            <div className="mt-6">

              <ReviewSection
                targetType="HOTEL"
                targetId={hotel.id}
                user={user}
              />

            </div>

            {/* LOCATION */}

            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">

              <div className="flex items-start justify-between">

                <div>

                  <h3 className="font-semibold text-lg mb-1">
                    {hotel.location}
                  </h3>

                </div>

               <button
  type="button"
  className="text-blue-500 hover:text-blue-700 hover:underline transition-colors"
  onClick={() => {
    const hotelName = hotel?.hotelName || "";
    const location = hotel?.location || "";

    const query = encodeURIComponent(
      `${hotelName}, ${location}, India`
    );

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    window.open(mapUrl, "_blank", "noopener,noreferrer");
  }}
>
  See on Map
</button>

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BookHotelPage;