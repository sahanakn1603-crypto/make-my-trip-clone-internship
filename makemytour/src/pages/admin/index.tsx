"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Textarea } from "@/components/ui/textarea";
import FlightList from "@/components/Flights/Flightlist";
import {
  addflight,
  addhotel,
  editflight,
  edithotel,
  getuserbyemail,
} from "@/api";
import HotelList from "@/components/Hotel/Hotel";
const mockFlights = [
  {
    _id: "1",
    flightName: "AirOne 101",
    from: "New York",
    to: "London",
    departureTime: "2023-07-01T08:00",
    arrivalTime: "2023-07-01T20:00",
    price: 500,
    availableSeats: 150,
  },
  {
    _id: "2",
    flightName: "SkyHigh 202",
    from: "Paris",
    to: "Tokyo",
    departureTime: "2023-07-02T10:00",
    arrivalTime: "2023-07-03T06:00",
    price: 800,
    availableSeats: 200,
  },
  {
    _id: "3",
    flightName: "EagleWings 303",
    from: "Los Angeles",
    to: "Sydney",
    departureTime: "2023-07-03T22:00",
    arrivalTime: "2023-07-05T06:00",
    price: 1200,
    availableSeats: 180,
  },
];

const mockHotels = [
  {
    _id: "1",
    hotelName: "Luxury Palace",
    location: "Paris, France",
    pricePerNight: 300,
    availableRooms: 50,
    amenities: "Wi-Fi, Pool, Spa, Restaurant",
  },
  {
    _id: "2",
    hotelName: "Seaside Resort",
    location: "Bali, Indonesia",
    pricePerNight: 200,
    availableRooms: 100,
    amenities: "Beach Access, Wi-Fi, Restaurant, Water Sports",
  },
  {
    _id: "3",
    hotelName: "Mountain Lodge",
    location: "Aspen, Colorado",
    pricePerNight: 250,
    availableRooms: 30,
    amenities: "Ski-in/Ski-out, Fireplace, Hot Tub, Restaurant",
  },
];
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber: string;
}

function UserSearch() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await getuserbyemail(email);
    const mockUser: User = data;
    setUser(mockUser);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="email" className="sr-only">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Search user by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Search</Button>
      </form>
      {user && (
        <div className="border p-4 rounded-md">
          <h3 className="font-bold mb-2">User Details</h3>
          <p>
            <strong>Name:</strong> {user.firstName} {user.lastName}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>Phone:</strong> {user.phoneNumber}
          </p>
        </div>
      )}
    </div>
  );
}

interface Hotel {
  id?: string;
  hotelName: string;
  location: string;
  pricePerNight: number;
  availableRooms: number;
  amenities: string;
}

function AddEditHotel({ hotel }: { hotel: Hotel | null }) {
  const [formData, setFormData] = useState<Hotel>({
    hotelName: "",
    location: "",
    pricePerNight: 0,
    availableRooms: 0,
    amenities: "",
  });

  useEffect(() => {
    if (hotel) {
      setFormData(hotel);
    } else {
      setFormData({
        hotelName: "",
        location: "",
        pricePerNight: 0,
        availableRooms: 0,
        amenities: "",
      });
    }
  }, [hotel]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hotel) {
      await edithotel(
        hotel.id,
        formData.hotelName,
        formData.location,
        formData.pricePerNight,
        formData.availableRooms,
        formData.amenities
      );
      return;
    }
    await addhotel(
      formData.hotelName,
      formData.location,
      formData.pricePerNight,
      formData.availableRooms,
      formData.amenities
    );
    if (!hotel) {
      setFormData({
        hotelName: "",
        location: "",
        pricePerNight: 0,
        availableRooms: 0,
        amenities: "",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">
        {hotel ? "Edit Hotel" : "Add New Hotel"}
      </h3>
      <div>
        <Label htmlFor="hotelName">Hotel Name</Label>
        <Input
          id="hotelName"
          name="hotelName"
          value={formData.hotelName}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="pricePerNight">Price Per Night</Label>
        <Input
          id="pricePerNight"
          name="pricePerNight"
          type="number"
          value={formData.pricePerNight}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="availableRooms">Available Rooms</Label>
        <Input
          id="availableRooms"
          name="availableRooms"
          type="number"
          value={formData.availableRooms}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="amenities">Amenities</Label>
        <Textarea
          id="amenities"
          name="amenities"
          value={formData.amenities}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit">{hotel ? "Update Hotel" : "Add Hotel"}</Button>
    </form>
  );
}

interface Flight {
  id?: string;
  flightName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
}

function AddEditFlight({ flight }: { flight: Flight | null }) {
  const [formData, setFormData] = useState<Flight>({
    flightName: "",
    from: "",
    to: "",
    departureTime: "",
    arrivalTime: "",
    price: 0,
    availableSeats: 0,
  });

  useEffect(() => {
    if (flight) {
      setFormData(flight);
    } else {
      setFormData({
        flightName: "",
        from: "",
        to: "",
        departureTime: "",
        arrivalTime: "",
        price: 0,
        availableSeats: 0,
      });
    }
  }, [flight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send this data to your backend
    console.log("Submitting flight data:", formData);
    if (flight) {
      await editflight(
        flight?.id,
        formData.flightName,
        formData.from,
        formData.to,
        formData.departureTime,
        formData.arrivalTime,
        formData.price,
        formData.availableSeats
      );
      return;
    }
    await addflight(
      formData.flightName,
      formData.from,
      formData.to,
      formData.departureTime,
      formData.arrivalTime,
      formData.price,
      formData.availableSeats
    );
    if (!flight) {
      setFormData({
        flightName: "",
        from: "",
        to: "",
        departureTime: "",
        arrivalTime: "",
        price: 0,
        availableSeats: 0,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">
        {flight ? "Edit Flight" : "Add New Flight"}
      </h3>
      <div>
        <Label htmlFor="flightName">Flight Name</Label>
        <Input
          id="flightName"
          name="flightName"
          value={formData.flightName}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="from">From</Label>
        <Input
          id="from"
          name="from"
          value={formData.from}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          name="to"
          value={formData.to}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="departureTime">Departure Time</Label>
        <Input
          id="departureTime"
          name="departureTime"
          type="datetime-local"
          value={formData.departureTime}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="arrivalTime">Arrival Time</Label>
        <Input
          id="arrivalTime"
          name="arrivalTime"
          type="datetime-local"
          value={formData.arrivalTime}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="availableSeats">Available Seats</Label>
        <Input
          id="availableSeats"
          name="availableSeats"
          type="number"
          value={formData.availableSeats}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit">{flight ? "Update Flight" : "Add Flight"}</Button>
    </form>
  );
}


interface ModerationReview {
  id: string;
  userId: string;
  userName: string;
  targetType: string;
  targetId: string;
  rating: number;
  reviewText: string;
  photoUrls?: string[];
  helpfulCount?: number;
  flagReason?: string;
  flagged?: boolean;
  status?: string;
  createdAt?: string;
}

function ReviewModeration() {
  const [reviews, setReviews] = useState<ModerationReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const loadFlaggedReviews = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${backendUrl}/reviews/moderation/flagged`
      );

      if (!response.ok) {
        throw new Error("Unable to load flagged reviews.");
      }

      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Loading flagged reviews failed:", error);
      setMessage(
        error?.message || "Unable to load flagged reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlaggedReviews();
  }, []);

  const approveReview = async (reviewId: string) => {
    try {
      setActionId(reviewId);
      setMessage("");

      const response = await fetch(
        `${backendUrl}/reviews/moderation/${reviewId}/approve`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to keep the review.");
      }

      setReviews((previous) =>
        previous.filter((review) => review.id !== reviewId)
      );
      setMessage("Review kept successfully.");
    } catch (error: any) {
      console.error("Approving review failed:", error);
      setMessage(
        error?.message || "Unable to keep the review."
      );
    } finally {
      setActionId(null);
    }
  };

  const removeReview = async (reviewId: string) => {
    try {
      setActionId(reviewId);
      setMessage("");

      const response = await fetch(
        `${backendUrl}/reviews/moderation/${reviewId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to remove the review.");
      }

      setReviews((previous) =>
        previous.filter((review) => review.id !== reviewId)
      );
      setMessage("Review removed successfully.");
    } catch (error: any) {
      console.error("Removing review failed:", error);
      setMessage(
        error?.message || "Unable to remove the review."
      );
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">
            Review Moderation
          </h3>
          <p className="text-sm text-gray-500">
            Review reports and decide whether to keep or remove
            reported reviews.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={loadFlaggedReviews}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {message && (
        <div className="rounded-md border bg-gray-50 p-3 text-sm">
          {message}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h4 className="font-semibold text-lg">
            No reported reviews
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            There are currently no reviews waiting for moderation.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    {review.userName || "Unknown User"}
                  </CardTitle>
                  <CardDescription>
                    {review.targetType === "HOTEL"
                      ? "Hotel Review"
                      : "Flight Review"}{" "}
                    • ID: {review.targetId}
                  </CardDescription>
                </div>

                <div className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 w-fit">
                  Reported
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Rating</p>
                  <p className="font-semibold">
                    {"⭐".repeat(Math.max(0, Math.min(5, review.rating)))}{" "}
                    <span className="text-gray-600">
                      ({review.rating}/5)
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="font-medium break-all">
                    {review.userId || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Reported Reason</p>
                  <p className="font-medium">
                    {review.flagReason || "No reason provided"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 border p-4">
                <p className="text-xs text-gray-500 mb-1">
                  Review
                </p>
                <p className="whitespace-pre-wrap">
                  {review.reviewText || "No review text"}
                </p>
              </div>

              {review.photoUrls && review.photoUrls.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Photos: {review.photoUrls.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {review.photoUrls.map((photo, index) => {
                      const cleanBackendUrl = backendUrl.endsWith("/")
                        ? backendUrl.slice(0, -1)
                        : backendUrl;

                      const photoUrl =
                        photo.startsWith("http://") ||
                        photo.startsWith("https://")
                          ? photo
                          : `${cleanBackendUrl}${
                              photo.startsWith("/") ? "" : "/"
                            }${photo}`;

                      return (
                        <a
                          key={`${photo}-${index}`}
                          href={photoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={photoUrl}
                            alt={`Review photo ${index + 1}`}
                            className="h-24 w-24 rounded-lg object-cover border"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                {review.createdAt
                  ? `Created: ${formatDate(review.createdAt)}`
                  : ""}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => approveReview(review.id)}
                  disabled={actionId === review.id}
                >
                  {actionId === review.id
                    ? "Processing..."
                    : "✓ Keep Review"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeReview(review.id)}
                  disabled={actionId === review.id}
                >
                  {actionId === review.id
                    ? "Processing..."
                    : "Remove Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("flights");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  return (
    <div className="container mx-auto p-4 bg-white max-w-full">
      <h1 className="text-3xl font-bold mb-6 ">Admin Dashboard</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 text-black">
          <TabsTrigger value="flights">Flights</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="flights">
          <Card>
            <CardHeader>
              <CardTitle>Manage Flights</CardTitle>
              <CardDescription>
                Add, edit, or remove flights from the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <FlightList onSelect={setSelectedFlight} />
                <AddEditFlight flight={selectedFlight} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hotels">
          <Card>
            <CardHeader>
              <CardTitle>Manage Hotels</CardTitle>
              <CardDescription>
                Add, edit, or remove hotels from the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <HotelList onSelect={setSelectedHotel} />
                <AddEditHotel hotel={selectedHotel} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search for users by email.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserSearch />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Review Moderation</CardTitle>
              <CardDescription>
                Manage reviews reported by users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewModeration />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
