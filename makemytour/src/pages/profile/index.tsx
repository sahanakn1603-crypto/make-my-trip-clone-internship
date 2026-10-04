import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Edit2,
  MapPin,
  Calendar,
  CreditCard,
  X,
  Check,
  LogOut,
  Plane,
  Building2,
  AlertTriangle,
  RefreshCw,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { clearUser, setUser } from "@/store";
import { editprofile, getuserbyemail } from "@/api";

const BACKEND_URL = "http://localhost:8080";

const CANCELLATION_REASONS = [
  "Change of plans",
  "Found a better option",
  "Travel dates changed",
  "Price is too high",
  "Emergency / personal reason",
  "Flight or hotel schedule issue",
  "Other",
];

const index = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: user?.firstName ? user.firstName : "",
    lastName: user?.lastName ? user.lastName : "",
    email: user?.email ? user.email : "",
    phoneNumber: user?.phoneNumber ? user.phoneNumber : "",
    bookings: [],
  });

  const [editForm, setEditForm] = useState({ ...userData });

  const [cancelBooking, setCancelBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [refundResult, setRefundResult] = useState<any>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundStatuses, setRefundStatuses] = useState<Record<string, any>>({});
  const [mounted, setMounted] = useState(false);

  const normalizeUser = (data: any) => {
    if (!data) return null;

    return {
      ...data,
      id: data.id ?? data._id ?? data.userId,
      bookings: Array.isArray(data.bookings) ? data.bookings : [],
    };
  };

  // Restore the logged-in user from localStorage, then refresh the complete
  // user record from the backend so My Bookings is not lost after refresh.
  useEffect(() => {
    let cancelled = false;

    const restoreUser = async () => {
      if (typeof window === "undefined") return;

      try {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
          setMounted(true);
          return;
        }

        const saved = normalizeUser(JSON.parse(savedUser));

        if (saved && !cancelled) {
          dispatch(setUser(saved));
          setUserData((previous) => ({
            ...previous,
            firstName: saved.firstName || "",
            lastName: saved.lastName || "",
            email: saved.email || "",
            phoneNumber: saved.phoneNumber || "",
            bookings: saved.bookings || [],
          }));
        }

        // Login/signup responses may not contain the latest embedded bookings.
        // Fetch the full user record using the logged-in email.
        if (saved?.email) {
          try {
            const freshData = normalizeUser(await getuserbyemail(saved.email));

            if (freshData && !cancelled) {
              const mergedUser = {
                ...saved,
                ...freshData,
                id: freshData.id ?? freshData._id ?? saved.id,
                bookings: Array.isArray(freshData.bookings)
                  ? freshData.bookings
                  : saved.bookings || [],
              };

              dispatch(setUser(mergedUser));
              localStorage.setItem("user", JSON.stringify(mergedUser));

              setUserData((previous) => ({
                ...previous,
                firstName: mergedUser.firstName || "",
                lastName: mergedUser.lastName || "",
                email: mergedUser.email || "",
                phoneNumber: mergedUser.phoneNumber || "",
                bookings: mergedUser.bookings || [],
              }));
            }
          } catch (error) {
            console.log("Could not refresh user profile:", error);
          }
        }
      } catch (error) {
        console.error("Unable to restore logged-in user:", error);
      } finally {
        if (!cancelled) setMounted(true);
      }
    };

    restoreUser();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;

    const normalized = normalizeUser(user);

    setUserData((previous) => ({
      ...previous,
      firstName: normalized.firstName || "",
      lastName: normalized.lastName || "",
      email: normalized.email || "",
      phoneNumber: normalized.phoneNumber || "",
      bookings: normalized.bookings || [],
    }));
  }, [user]);

  const logout = () => {
    dispatch(clearUser());
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    router.push("/");
  };

  const handleSave = async () => {
    try {
      const data = await editprofile(
        user?.id,
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phoneNumber
      );
      const normalized = normalizeUser(data);
      dispatch(setUser(normalized));
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(normalized));
      }
      setIsEditing(false);
    } catch (error) {
      setUserData(editForm);
      setIsEditing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleEditFormChange = (field: any, value: any) => {
    setUserData((previousState) => ({
      ...previousState,
      [field]: value,
    }));
  };

  const openCancellation = async (booking: any) => {
    if (!booking?.bookingId || !user?.id) return;

    // Before opening the cancellation modal, verify the booking is still
    // cancellable on the backend. This prevents an old/stale Redux booking
    // from showing the cancellation form after it was already cancelled.
    try {
      const response = await axios.get(
        `${BACKEND_URL}/cancellation/refund/${encodeURIComponent(
          user.id
        )}/${encodeURIComponent(booking.bookingId)}`
      );

      if (response.data?.active && response.data?.refund) {
        const refund = response.data.refund;

        setRefundStatuses((previous) => ({
          ...previous,
          [booking.bookingId]: refund,
        }));

        const updatedUser = {
          ...user,
          bookings: (user.bookings || []).map((item: any) =>
            item.bookingId === booking.bookingId
              ? {
                  ...item,
                  status: "CANCELLED",
                  cancellationReason:
                    refund.cancellationReason || item.cancellationReason,
                  refundAmount: refund.refundAmount,
                  refundStatus: refund.status,
                  cancelledAt: refund.cancelledAt,
                }
              : item
          ),
        };

        dispatch(setUser(updatedUser));
        setRefundResult(null);
        return;
      }
    } catch (error) {
      // If there is no refund record, continue and open the cancellation form.
      console.log("No existing cancellation found; opening cancellation form.");
    }

    setCancelBooking(booking);
    setCancelReason("");
    setCancelError("");
    setRefundResult(null);
  };

  const closeCancellation = () => {
    if (cancelLoading) return;
    setCancelBooking(null);
    setCancelReason("");
    setCancelError("");
  };

  const submitCancellation = async () => {
    if (!cancelBooking || !cancelReason || !user?.id) return;

    setCancelLoading(true);
    setCancelError("");

    try {
      const response = await axios.post(
        `${BACKEND_URL}/cancellation/cancel`,
        null,
        {
          params: {
            userId: user.id,
            bookingId: cancelBooking.bookingId,
            reason: cancelReason,
          },
        }
      );

      const refund = response.data;
      setRefundResult(refund);
      setRefundStatuses((previous) => ({
        ...previous,
        [cancelBooking.bookingId]: refund,
      }));

      const updatedBookings = (user.bookings || []).map((booking: any) =>
        booking.bookingId === cancelBooking.bookingId
          ? {
              ...booking,
              status: "CANCELLED",
              cancellationReason: cancelReason,
              refundAmount: refund.refundAmount,
              refundStatus: refund.status,
              cancelledAt: refund.cancelledAt,
            }
          : booking
      );

      const updatedUser = {
        ...user,
        bookings: updatedBookings,
      };

      dispatch(setUser(updatedUser));
    } catch (error: any) {
      setCancelError(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Unable to cancel this booking. Please try again."
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const loadRefundStatus = async (booking: any) => {
    if (!user?.id || !booking?.bookingId) return;

    setRefundLoading(true);

    try {
      const response = await axios.get(
        `${BACKEND_URL}/cancellation/refund/${encodeURIComponent(
          user.id
        )}/${encodeURIComponent(booking.bookingId)}`
      );

      if (response.data?.active) {
        const refund = response.data.refund;

        setRefundResult(refund);

        setRefundStatuses((previous) => ({
          ...previous,
          [booking.bookingId]: refund,
        }));

        // Persist the fetched status on this exact booking as well.
        // This prevents another booking's status from changing this card.
        const updatedUser = {
          ...user,
          bookings: (user.bookings || []).map((item: any) =>
            item.bookingId === booking.bookingId
              ? {
                  ...item,
                  refundStatus: refund.status,
                  refundAmount: refund.refundAmount,
                  cancelledAt: refund.cancelledAt,
                }
              : item
          ),
        };

        dispatch(setUser(updatedUser));
      } else {
        setRefundStatuses((previous) => {
          const next = { ...previous };
          delete next[booking.bookingId];
          return next;
        });

        setRefundResult(null);
      }
    } catch (error) {
      console.log("Refund status error:", error);
    } finally {
      setRefundLoading(false);
    }
  };

  const getStatus = (booking: any) => {
    return booking?.status || "CONFIRMED";
  };

  const isCancelled = (booking: any) =>
    getStatus(booking).toUpperCase() === "CANCELLED";

  const getExpectedRefundDate = (refund: any) => {
    if (!refund?.expectedRefundDate) return "Within 5 working days";
    return new Date(refund.expectedRefundDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getRefundStep = (status: string) => {
    const normalized = String(status || "PENDING").toUpperCase();

    if (normalized === "COMPLETED") return 3;
    if (normalized === "PROCESSED") return 2;
    return 1;
  };

  const RefundTracker = ({ status }: { status: string }) => {
    const step = getRefundStep(status);

    const steps = [
      { label: "Pending", icon: Clock3 },
      { label: "Processed", icon: RefreshCw },
      { label: "Completed", icon: CheckCircle2 },
    ];

    return (
      <div className="mt-4 bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-800">Refund Status Tracker</p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            {String(status || "PENDING").toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {steps.map((item, index) => {
            const currentStep = index + 1;
            const Icon = item.icon;
            const active = currentStep <= step;

            return (
              <div key={item.label} className="text-center">
                <div
                  className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center ${
                    active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p
                  className={`text-xs mt-2 font-medium ${
                    active ? "text-green-700" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Refunds are expected within 5 working days. Status updates are
          processed automatically.
        </p>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 px-4 pb-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Profile</h2>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setEditForm({ ...userData });
                      setIsEditing(true);
                    }}
                    className="text-red-600 flex items-center space-x-1 hover:text-red-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) =>
                        handleEditFormChange("firstName", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) =>
                        handleEditFormChange("lastName", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) =>
                        handleEditFormChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={userData.phoneNumber}
                      onChange={(e) =>
                        handleEditFormChange("phoneNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setUserData(editForm);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <p>{user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <p>{user?.phoneNumber}</p>
                  </div>
                  <button
                    className="w-full mt-4 flex items-center justify-center space-x-2 text-red-600 hover:text-red-700"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Refund Policy */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h3 className="font-bold text-lg mb-3">Cancellation Policy</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Cancel within 24 hours of reservation: <strong>50% refund</strong>.</p>
                <p>• After 24 hours: refund amount may be <strong>₹0</strong> under this demo policy.</p>
                <p>• Refund status is tracked as Pending, Processed or Completed.</p>
                <p>• Expected refund timeline: up to 5 working days.</p>
              </div>
            </div>
          </div>

          {/* Bookings Section */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">My Bookings</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage cancellations and track refunds from one place.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {(user?.bookings || []).length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No bookings found.
                  </div>
                ) : (
                  user.bookings.map((booking: any, index: number) => {
                    const bookingRefund =
                      refundStatuses[booking.bookingId] || null;

                    // A booking is treated as cancelled if either the
                    // booking itself says CANCELLED or we already have a
                    // refund record for this exact booking. This prevents
                    // the Cancel Booking button from appearing again when
                    // the backend has already cancelled the booking.
                    const cancelled =
                      isCancelled(booking) ||
                      Boolean(bookingRefund?.bookingId === booking.bookingId);

                    const displayedRefundStatus =
                      bookingRefund?.status ||
                      booking?.refundStatus ||
                      "PENDING";

                    const displayedRefundAmount =
                      bookingRefund?.refundAmount ??
                      booking?.refundAmount ??
                      0;

                    return (
                      <div
                        key={`${booking?.bookingId || "booking"}-${index}`}
                        className={`border rounded-lg p-4 transition-shadow hover:shadow-md ${
                          cancelled ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                          <div className="flex items-center space-x-3">
                            {booking?.type === "Flight" ? (
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Plane className="w-6 h-6 text-blue-600" />
                              </div>
                            ) : (
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Building2 className="w-6 h-6 text-green-600" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold">{booking?.type}</h3>
                              <p className="text-sm text-gray-500">
                                Booking ID: {booking?.bookingId}
                              </p>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="font-semibold">
                              ₹ {Number(booking?.totalPrice || 0).toLocaleString("en-IN")}
                            </p>
                            <span
                              className={`inline-flex items-center mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                cancelled
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {cancelled ? "CANCELLED" : "CONFIRMED"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(booking?.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{booking?.type}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CreditCard className="w-4 h-4" />
                            <span>{cancelled ? "Refund initiated" : "Paid"}</span>
                          </div>
                        </div>

                        {!cancelled ? (
                          <div className="mt-5 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-sm text-gray-500">
                              <span className="font-medium text-gray-700">Refund policy:</span>{" "}
                              50% if cancelled within 24 hours of reservation.
                            </div>
                            <button
                              onClick={() => openCancellation(booking)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel Booking
                            </button>
                          </div>
                        ) : (
                          <div className="mt-5 pt-4 border-t bg-red-50 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-800">Refund Status</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Reason: {booking?.cancellationReason || "Cancellation requested"}
                                </p>
                              </div>
                              <button
                                onClick={() => loadRefundStatus(booking)}
                                disabled={refundLoading}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-100"
                              >
                                <RefreshCw className={`w-4 h-4 ${refundLoading ? "animate-spin" : ""}`} />
                                Check Refund Status
                              </button>
                            </div>

                            {(
                              refundStatuses[booking.bookingId] ||
                              booking?.refundAmount !== undefined
                            ) && (
                              <>
                              <RefundTracker
                                status={displayedRefundStatus}
                              />

                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white rounded-lg p-3">
                                  <p className="text-xs text-gray-500">Refund Amount</p>
                                  <p className="font-bold text-lg text-green-700">
                                    ₹ {Number(displayedRefundAmount).toLocaleString("en-IN")}
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                  <p className="text-xs text-gray-500">Status</p>
                                  <p className="font-semibold text-orange-600">
                                    {displayedRefundStatus}
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                  <p className="text-xs text-gray-500">Expected</p>
                                  <p className="font-semibold text-gray-800">
                                    {getExpectedRefundDate(bookingRefund)}
                                  </p>
                                </div>
                              </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Cancel Booking</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Booking ID: {cancelBooking.bookingId}
                </p>
              </div>
              <button
                onClick={closeCancellation}
                className="p-2 rounded-full hover:bg-gray-100"
                disabled={cancelLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {refundResult ? (
              <div className="p-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-green-800">Cancellation Successful</h3>
                  <p className="text-sm text-green-700 mt-2">
                    Your refund request has been created successfully.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500">Refund</p>
                      <p className="font-bold text-lg">₹ {Number(refundResult.refundAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-bold text-orange-600">{refundResult.status}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Expected refund date: <strong>{getExpectedRefundDate(refundResult)}</strong>
                  </p>
                </div>
                <button
                  onClick={closeCancellation}
                  className="w-full mt-5 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold">Please review before cancelling.</p>
                    <p className="mt-1">
                      Under the current demo policy, cancellations within 24 hours of reservation receive a 50% refund.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cancellation reason
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border rounded-lg px-3 py-3 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select a reason</option>
                    {CANCELLATION_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Booking amount</span>
                    <span className="font-semibold">₹ {Number(cancelBooking.totalPrice || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Policy</span>
                    <span className="font-semibold">50% within 24 hours</span>
                  </div>
                </div>

                {cancelError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                    {cancelError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeCancellation}
                    disabled={cancelLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={submitCancellation}
                    disabled={!cancelReason || cancelLoading}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Clock3 className="w-4 h-4" />
                  Refund processing timeline: up to 5 working days
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default index;
