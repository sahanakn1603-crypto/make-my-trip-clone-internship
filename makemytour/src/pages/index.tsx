import { getflight, gethotel } from "@/api";
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

  if (loading) {
    return <Loader />;
  }

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
          `http://localhost:8080/flight-data/generate?date=${date}`,
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

  const handlebooknow = (id: any) => {
    if (bookingtype === "flights") {
      router.push(`/book-flight/${id}?travelers=${travelers}`);
    } else {
      router.push(`/book-hotel/${id}`);
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
                  options={cityOptions}
                  placeholder="From"
                  value={from}
                  onChange={setfrom}
                  icon={<MapPin className="text-gray-400" />}
                  subtitle="Enter city or airport"
                />
              </div>
            )}

            {/* TO */}
            <div className="col-span-1">
              <SearchSelect
                options={cityOptions}
                placeholder={
                  bookingtype === "flights" ? "To" : "City"
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