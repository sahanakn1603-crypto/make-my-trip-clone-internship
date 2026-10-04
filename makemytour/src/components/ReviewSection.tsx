"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Star,
  Camera,
  ThumbsUp,
  MessageCircle,
  Flag,
  X,
} from "lucide-react";

import {
  getReviews,
  createReview,
  addReviewPhotos,
  uploadReviewPhoto,
  markReviewHelpful,
  replyToReview,
  flagReview,
} from "@/api";

interface ReviewSectionProps {
  targetType: "HOTEL" | "FLIGHT";
  targetId: string;
  user: any;
}

interface ReviewReply {
  userId?: string;
  userName?: string;
  text?: string;
  date?: string;
  createdAt?: string;
}

interface Review {
  id?: string;
  _id?: string;

  userId?: string;
  userName?: string;

  targetType?: string;
  targetId?: string;

  rating?: number;
  reviewText?: string;

  photoUrls?: string[];

  helpfulCount?: number;
  helpful?: number;

  replies?: ReviewReply[];

  date?: string;
  createdAt?: string;

  flagged?: boolean;
  status?: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  targetType,
  targetId,
  user,
}) => {
  // =========================================================
  // STATE
  // =========================================================

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState("newest");

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [flagOpen, setFlagOpen] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");

  // Reviews reported by this customer during the current browser session.
  const [reportedReviewIds, setReportedReviewIds] = useState<string[]>([]);

  const [helpfulLoading, setHelpfulLoading] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState<string | null>(null);
  const [flagLoading, setFlagLoading] = useState<string | null>(null);

  // Backend URL used for uploaded review photos.
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

  // Opens a review photo inside the current page.
  const [selectedReviewPhoto, setSelectedReviewPhoto] =
    useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // =========================================================
  // USER DETAILS
  // =========================================================

  const userId =
    user?.id ||
    user?._id ||
    "";

  const userName =
    user?.firstName
      ? `${user.firstName}${user?.lastName ? ` ${user.lastName}` : ""}`
      : user?.name ||
        user?.userName ||
        user?.email ||
        "User";

  // =========================================================
  // LOAD REVIEWS
  // =========================================================

  const loadReviews = async () => {
    if (!targetId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const normalizedTargetType = String(targetType || '')
        .trim()
        .toUpperCase();

      const normalizedTargetId = String(targetId || '').trim();

      const data = await getReviews(
        normalizedTargetType,
        normalizedTargetId,
        sort
      );

      // Only show reviews belonging to THIS exact hotel/flight.
      // This also protects the UI if the backend returns unrelated reviews.
      if (Array.isArray(data)) {
        const currentTargetReviews = data.filter((review: Review) => {
          const reviewTargetType = String(review?.targetType || '')
            .trim()
            .toUpperCase();

          const reviewTargetId = String(review?.targetId || '').trim();

          return (
            reviewTargetType === normalizedTargetType &&
            reviewTargetId === normalizedTargetId
          );
        });

        setReviews(currentTargetReviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [targetType, targetId, sort]);

  // =========================================================
  // CHECK IF CURRENT USER ALREADY REVIEWED THIS EXACT TARGET
  // =========================================================

  const userAlreadyReviewed = useMemo(() => {
    if (!userId || !targetId) return false;

    const normalizedUserId = String(userId).trim();
    const normalizedTargetType = String(targetType || '')
      .trim()
      .toUpperCase();
    const normalizedTargetId = String(targetId).trim();

    return reviews.some((review) => {
      const reviewUserId = String(review?.userId || '').trim();
      const reviewTargetType = String(review?.targetType || '')
        .trim()
        .toUpperCase();
      const reviewTargetId = String(review?.targetId || '').trim();

      return (
        reviewUserId === normalizedUserId &&
        reviewTargetType === normalizedTargetType &&
        reviewTargetId === normalizedTargetId
      );
    });
  }, [reviews, userId, targetType, targetId]);

  const existingUserReview = useMemo(() => {
    if (!userId || !targetId) return null;

    const normalizedUserId = String(userId).trim();
    const normalizedTargetType = String(targetType || '')
      .trim()
      .toUpperCase();
    const normalizedTargetId = String(targetId).trim();

    return reviews.find((review) => {
      const reviewUserId = String(review?.userId || '').trim();
      const reviewTargetType = String(review?.targetType || '')
        .trim()
        .toUpperCase();
      const reviewTargetId = String(review?.targetId || '').trim();

      return (
        reviewUserId === normalizedUserId &&
        reviewTargetType === normalizedTargetType &&
        reviewTargetId === normalizedTargetId
      );
    }) || null;
  }, [reviews, userId, targetType, targetId]);

  // =========================================================
  // AVERAGE RATING
  // =========================================================

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, review) =>
        sum + Number(review.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  // =========================================================
  // STAR DISPLAY
  // =========================================================

  const renderStars = (
    value: number,
    size = "w-5 h-5"
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= value
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // =========================================================
  // SELECT REVIEW RATING
  // =========================================================

  const handleRatingClick = (value: number) => {
    setRating(value);
    setErrorMessage("");
  };

  // =========================================================
  // PHOTO SELECTION
  // =========================================================

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const remainingSlots =
      5 - selectedPhotos.length;

    const newFiles = files.slice(0, remainingSlots);

    const validFiles = newFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      setErrorMessage(
        "Please select image files only."
      );
      return;
    }

    setSelectedPhotos((previous) => [
      ...previous,
      ...validFiles,
    ]);

    const newPreviews = validFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setPhotoPreviews((previous) => [
      ...previous,
      ...newPreviews,
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // REMOVE PHOTO
  // =========================================================

  const removePhoto = (index: number) => {
    setSelectedPhotos((previous) =>
      previous.filter((_, i) => i !== index)
    );

    setPhotoPreviews((previous) => {
      const url = previous[index];

      if (url) {
        URL.revokeObjectURL(url);
      }

      return previous.filter((_, i) => i !== index);
    });
  };

  // =========================================================
  // SUBMIT REVIEW / ADD PHOTOS
  // =========================================================

  const handleSubmitReview = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!userId) {
      setErrorMessage("Please log in to submit a review.");
      return;
    }

    // If the user already has a review, this action adds photos
    // to that existing review instead of attempting a duplicate review.
    if (userAlreadyReviewed && existingUserReview) {
      if (selectedPhotos.length === 0) {
        setErrorMessage("Please select at least one photo to add.");
        return;
      }

      const existingPhotoCount = Array.isArray(existingUserReview.photoUrls)
        ? existingUserReview.photoUrls.length
        : 0;

      if (existingPhotoCount + selectedPhotos.length > 5) {
        setErrorMessage("A review can contain a maximum of 5 photos.");
        return;
      }

      try {
        setSubmitting(true);

        const uploadedPhotoUrls: string[] = [];

        for (const file of selectedPhotos) {
          const uploadResponse = await uploadReviewPhoto(file);

          if (typeof uploadResponse === "string") {
            uploadedPhotoUrls.push(uploadResponse);
          } else if (uploadResponse?.url) {
            uploadedPhotoUrls.push(uploadResponse.url);
          } else if (uploadResponse?.photoUrl) {
            uploadedPhotoUrls.push(uploadResponse.photoUrl);
          }
        }

        if (uploadedPhotoUrls.length === 0) {
          throw new Error("Photo upload did not return a photo URL.");
        }

        await addReviewPhotos(
          String(existingUserReview.id || existingUserReview._id),
          String(userId),
          uploadedPhotoUrls
        );

        setSuccessMessage("Photos added to your review successfully.");
        setSelectedPhotos([]);
        setPhotoPreviews([]);

        await loadReviews();
      } catch (error: any) {
        console.error("Error adding photos to review:", error);

        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          (typeof error?.response?.data === "string"
            ? error.response.data
            : "");

        setErrorMessage(
          backendMessage ||
            error?.message ||
            "Unable to add photos to your review. Please try again."
        );
      } finally {
        setSubmitting(false);
      }

      return;
    }

    if (
      !rating ||
      rating < 1 ||
      rating > 5
    ) {
      setErrorMessage("Please select a rating from 1 to 5 stars.");
      return;
    }

    const trimmedText = reviewText.trim();

    if (!trimmedText) {
      setErrorMessage("Please write a review.");
      return;
    }

    if (trimmedText.length > 1000) {
      setErrorMessage("Review cannot exceed 1000 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const uploadedPhotoUrls: string[] = [];

      for (const file of selectedPhotos) {
        const uploadResponse = await uploadReviewPhoto(file);

        if (typeof uploadResponse === "string") {
          uploadedPhotoUrls.push(uploadResponse);
        } else if (uploadResponse?.url) {
          uploadedPhotoUrls.push(uploadResponse.url);
        } else if (uploadResponse?.photoUrl) {
          uploadedPhotoUrls.push(uploadResponse.photoUrl);
        }
      }

      await createReview(
        userId,
        userName,
        targetType,
        targetId,
        rating,
        trimmedText,
        uploadedPhotoUrls
      );

      setSuccessMessage("Your review has been submitted successfully.");
      setReviewText("");
      setRating(5);
      setSelectedPhotos([]);
      setPhotoPreviews([]);

      await loadReviews();
    } catch (error: any) {
      console.error("Review submission failed:", error);

      if (error?.response?.status === 409) {
        setErrorMessage(
          `You have already reviewed this ${
            targetType === "HOTEL" ? "hotel" : "flight"
          }. You can add photos to your existing review instead.`
        );
        await loadReviews();
        return;
      }

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : "");

      setErrorMessage(
        backendMessage ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // HELPFUL
  // =========================================================

  const handleHelpful = async (
    reviewId: string
  ) => {
    try {
      setHelpfulLoading(reviewId);

      await markReviewHelpful(reviewId);

      await loadReviews();
    } catch (error) {
      console.error(
        "Error marking review helpful:",
        error
      );
    } finally {
      setHelpfulLoading(null);
    }
  };

  // =========================================================
  // REPLY
  // =========================================================

  const handleReply = async (
    reviewId: string
  ) => {
    if (!userId) {
      setErrorMessage(
        "Please log in to reply."
      );
      return;
    }

    const trimmedReply =
      replyText.trim();

    if (!trimmedReply) {
      return;
    }

    try {
      setReplyLoading(reviewId);

      await replyToReview(
        reviewId,
        userId,
        userName,
        trimmedReply
      );

      setReplyText("");
      setReplyOpen(null);

      await loadReviews();

    } catch (error: any) {
      console.error(
        "Error replying to review:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
          "Unable to reply to this review."
      );
    } finally {
      setReplyLoading(null);
    }
  };

  // =========================================================
  // REPORT
  // =========================================================

  const handleFlag = async (
    reviewId: string
  ) => {
    if (!flagReason.trim()) {
      return;
    }

    try {
      setFlagLoading(reviewId);

      await flagReview(
        reviewId,
        flagReason.trim()
      );

      setFlagReason("");
      setFlagOpen(null);

      setReportedReviewIds((previous) =>
        previous.includes(String(reviewId))
          ? previous
          : [...previous, String(reviewId)]
      );

      setSuccessMessage(
        "Review reported successfully. It has been sent for moderation."
      );

      await loadReviews();

    } catch (error: any) {
      console.error(
        "Error reporting review:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
          "Unable to report this review."
      );
    } finally {
      setFlagLoading(null);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    review: Review
  ) => {
    const dateValue =
      review.createdAt ||
      review.date;

    if (!dateValue) {
      return "";
    }

    try {
      const date =
        new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return String(dateValue);
      }

      return date.toLocaleDateString(
        "en-IN"
      );
    } catch {
      return String(dateValue);
    }
  };

  // =========================================================
  // REVIEW PHOTO URL
  // =========================================================

  const getReviewPhotoUrl = (photo: string) => {
    if (!photo) return "";

    // Keep complete URLs and browser-created URLs unchanged.
    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://") ||
      photo.startsWith("data:") ||
      photo.startsWith("blob:")
    ) {
      return photo;
    }

    // Remove a trailing slash without using a regular expression.
    const cleanBackendUrl = backendUrl.endsWith("/")
      ? backendUrl.slice(0, -1)
      : backendUrl;

    if (photo.startsWith("/")) {
      return `${cleanBackendUrl}${photo}`;
    }

    return `${cleanBackendUrl}/${photo}`;
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">

      {/* =====================================================
          HEADER
         ===================================================== */}

      <div className="flex items-start justify-between gap-4 mb-6">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reviews & Ratings
          </h2>

          <div className="flex items-center gap-3 mt-3">

            <span className="text-4xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>

            {renderStars(
              Math.round(averageRating),
              "w-6 h-6"
            )}

            <span className="text-gray-500">
              {reviews.length}{" "}
              {reviews.length === 1
                ? "review"
                : "reviews"}
            </span>

          </div>
        </div>

        {/* SORT */}

        <div className="flex items-center gap-2">

          <span className="text-gray-600">
            Sort:
          </span>

          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value)
            }
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
          >
            <option value="newest">
              Newest
            </option>

            <option value="helpful">
              Most Helpful
            </option>

            <option value="highest">
              Highest Rated
            </option>
          </select>

        </div>

      </div>

      {/* =====================================================
          SUCCESS MESSAGE
         ===================================================== */}

      {successMessage && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {successMessage}
        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
         ===================================================== */}

      {errorMessage && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          WRITE REVIEW
         ===================================================== */}

      <div className="border border-gray-200 rounded-xl p-6 mb-8 bg-gray-50">

        <h3 className="text-xl font-bold text-gray-900 mb-5">
          Write a Review
        </h3>

        {!userId ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            Please log in to write a review.
          </div>
        ) : userAlreadyReviewed ? (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800 mb-5">
              You have already reviewed this {targetType === "HOTEL" ? "hotel" : "flight"}.
              <br />
              You can add up to 5 photos to your existing review.
            </div>

            <div className="mb-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={
                  (existingUserReview?.photoUrls?.length || 0) +
                    selectedPhotos.length >= 5
                }
                className="inline-flex items-center gap-2 border border-gray-300 bg-white px-5 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                Add Photos
              </button>

              <p className="text-xs text-gray-500 mt-2">
                Maximum 5 photos per review
              </p>
            </div>

            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-5">
                {photoPreviews.map((preview, index) => (
                  <div key={`${preview}-${index}`} className="relative">
                    <img
                      src={preview}
                      alt={`Review photo ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting || selectedPhotos.length === 0}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Uploading..." : "Add Photos to My Review"}
            </button>
          </>
        ) : (
          <>
            {/* RATING */}

            <div className="mb-5">

              <p className="text-gray-700 mb-3">
                Your rating
              </p>

              <div className="flex items-center gap-2">

                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        handleRatingClick(
                          star
                        )
                      }
                      className="focus:outline-none"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-9 h-9 transition ${
                          star <= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  )
                )}

              </div>

            </div>

            {/* TEXT */}

            <div className="mb-4">

              <textarea
                value={reviewText}
                onChange={(e) => {
                  if (
                    e.target.value.length <=
                    1000
                  ) {
                    setReviewText(
                      e.target.value
                    );
                  }

                  setErrorMessage("");
                }}
                placeholder={
                  targetType === "HOTEL"
                    ? "How was your stay?"
                    : "How was your flight?"
                }
                className="w-full min-h-[150px] border border-gray-300 rounded-xl px-4 py-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="text-right text-sm text-gray-500 mt-1">
                {reviewText.length}/1000
              </div>

            </div>

            {/* PHOTO UPLOAD */}

            <div className="mb-5">

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  selectedPhotos.length >= 5
                }
                className="inline-flex items-center gap-2 border border-gray-300 bg-white px-5 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />

                Add Photos

              </button>

              <p className="text-xs text-gray-500 mt-2">
                Maximum 5 photos
              </p>

            </div>

            {/* PHOTO PREVIEWS */}

            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-5">

                {photoPreviews.map(
                  (preview, index) => (
                    <div
                      key={`${preview}-${index}`}
                      className="relative"
                    >

                      <img
                        src={preview}
                        alt={`Review photo ${
                          index + 1
                        }`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removePhoto(index)
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        aria-label="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

            {/* SUBMIT */}

            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </>
        )}

      </div>

      {/* =====================================================
          EXISTING REVIEWS
         ===================================================== */}

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No reviews yet.
        </div>
      ) : (
        <div className="space-y-5">

          {reviews.map(
            (review, index) => {

              const reviewId =
                review.id ||
                review._id ||
                `review-${index}`;

              const helpfulCount =
                Number(
                  review.helpfulCount ??
                    review.helpful ??
                    0
                );

              const replies =
                Array.isArray(
                  review.replies
                )
                  ? review.replies
                  : [];

              return (
                <div
                  key={reviewId}
                  className="border border-gray-200 rounded-xl p-6"
                >

                  {/* USER */}

                  <div className="flex items-start justify-between">

                    <div>

                      <h4 className="font-semibold text-lg text-gray-900">
                        {review.userName ||
                          "Anonymous User"}
                      </h4>

                      <div className="flex items-center gap-3 mt-1">

                        {renderStars(
                          Number(
                            review.rating || 0
                          ),
                          "w-5 h-5"
                        )}

                        <span className="text-sm text-gray-500">
                          {formatDate(review)}
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* REVIEW TEXT */}

                  {review.reviewText && (
                    <p className="text-gray-700 mt-4 whitespace-pre-wrap">
                      {review.reviewText}
                    </p>
                  )}

                  {/* REVIEW PHOTOS */}

                  {Array.isArray(
                    review.photoUrls
                  ) &&
                    review.photoUrls.length >
                      0 && (
                      <div className="flex flex-wrap gap-3 mt-4">

                        {review.photoUrls.map(
                          (
                            photo,
                            photoIndex
                          ) => (
                            <button
                              key={`${photo}-${photoIndex}`}
                              type="button"
                              onClick={() =>
                                setSelectedReviewPhoto(
                                  getReviewPhotoUrl(photo)
                                )
                              }
                              className="block focus:outline-none"
                              aria-label="View review photo"
                            >
                              <img
                                src={getReviewPhotoUrl(photo)}
                                alt="Review photo"
                                className="w-28 h-28 object-cover rounded-lg border hover:opacity-90 cursor-pointer"
                              />
                            </button>
                          )
                        )}

                      </div>
                    )}

                  {/* ACTIONS */}

                  <div className="flex flex-wrap items-center gap-5 mt-5">

                    <button
                      type="button"
                      onClick={() =>
                        handleHelpful(
                          String(reviewId)
                        )
                      }
                      disabled={
                        helpfulLoading ===
                        String(reviewId)
                      }
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                      <ThumbsUp className="w-5 h-5" />

                      Helpful (
                      {helpfulCount}
                      )

                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReplyOpen(
                          replyOpen ===
                            String(reviewId)
                            ? null
                            : String(reviewId)
                        );
                        setFlagOpen(null);
                      }}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                      <MessageCircle className="w-5 h-5" />

                      Reply

                    </button>

                    {reportedReviewIds.includes(String(reviewId)) ? (
                      <span className="flex items-center gap-2 text-red-600 font-medium">
                        <Flag className="w-5 h-5" />

                        Reported
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setFlagOpen(
                            flagOpen ===
                              String(reviewId)
                              ? null
                              : String(reviewId)
                          );
                          setReplyOpen(null);
                        }}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                      >
                        <Flag className="w-5 h-5" />

                        Report

                      </button>
                    )}

                  </div>

                  {/* REPLY BOX */}

                  {replyOpen ===
                    String(reviewId) && (
                    <div className="mt-4 ml-6 border-l-2 border-gray-200 pl-4">

                      <textarea
                        value={replyText}
                        onChange={(e) =>
                          setReplyText(
                            e.target.value
                          )
                        }
                        placeholder="Write a reply..."
                        className="w-full border border-gray-300 rounded-lg p-3 min-h-[90px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="flex gap-2 mt-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleReply(
                              String(reviewId)
                            )
                          }
                          disabled={
                            replyLoading ===
                            String(reviewId)
                          }
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {replyLoading ===
                          String(reviewId)
                            ? "Sending..."
                            : "Send Reply"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReplyOpen(
                              null
                            );
                            setReplyText("");
                          }}
                          className="border border-gray-300 px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </button>

                      </div>

                    </div>
                  )}

                  {/* REPORT BOX */}

                  {flagOpen ===
                    String(reviewId) && (
                    <div className="mt-4 ml-6 border-l-2 border-red-200 pl-4">

                      <textarea
                        value={flagReason}
                        onChange={(e) =>
                          setFlagReason(
                            e.target.value
                          )
                        }
                        placeholder="Why are you reporting this review?"
                        className="w-full border border-gray-300 rounded-lg p-3 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                      />

                      <div className="flex gap-2 mt-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleFlag(
                              String(reviewId)
                            )
                          }
                          disabled={
                            flagLoading ===
                            String(reviewId)
                          }
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {flagLoading ===
                          String(reviewId)
                            ? "Reporting..."
                            : "Report Review"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFlagOpen(
                              null
                            );
                            setFlagReason("");
                          }}
                          className="border border-gray-300 px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </button>

                      </div>

                    </div>
                  )}

                  {/* REPLIES */}

                  {replies.length > 0 && (
                    <div className="mt-5 ml-6 border-l-2 border-gray-200 pl-4 space-y-3">

                      {replies.map(
                        (
                          reply,
                          replyIndex
                        ) => (
                          <div
                            key={`${reviewId}-reply-${replyIndex}`}
                            className="bg-gray-50 rounded-lg p-4"
                          >

                            <div className="font-semibold text-gray-900">
                              {reply.userName ||
                                "User"}
                            </div>

                            <p className="text-gray-700 mt-2">
                              {reply.text}
                            </p>

                            {(reply.date ||
                              reply.createdAt) && (
                              <div className="text-sm text-gray-500 mt-2">
                                {reply.date ||
                                  reply.createdAt}
                              </div>
                            )}

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>
      )}


      {/* =====================================================
          REVIEW PHOTO VIEWER
         ===================================================== */}

      {selectedReviewPhoto ? (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedReviewPhoto(null)}
        >
          <div
            className="relative max-w-[95vw] max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedReviewPhoto(null)}
              className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full bg-white text-black text-2xl font-bold shadow-lg"
              aria-label="Close photo"
            >
              ×
            </button>

            <img
              src={selectedReviewPhoto}
              alt="Review photo enlarged"
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      ) : null}

    </div>
  );
};

export default ReviewSection;