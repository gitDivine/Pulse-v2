"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Send, CheckCircle } from "lucide-react";

interface TripReviewProps {
  tripId: string;
  revieweeId: string;
  revieweeLabel: string; // e.g. "carrier" or "shipper"
}

export function TripReview({ tripId, revieweeId, revieweeLabel }: TripReviewProps) {
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?trip_id=${tripId}`)
      .then((r) => r.json())
      .then((data) => {
        // Find the current user's review (they are the reviewer)
        // The API returns all reviews for this trip; we check if any has reviewer_id matching
        // We can't check user ID client-side easily, so just look for a review where reviewee_id matches
        const myReview = (data.reviews || []).find((r: any) => r.reviewee_id === revieweeId);
        if (myReview) setExistingReview(myReview);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tripId, revieweeId]);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: tripId,
          reviewee_id: revieweeId,
          rating,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExistingReview(data.review);
      setSubmitted(true);
    } catch {
      // Silently handle — likely duplicate
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  // Already reviewed
  if (existingReview) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          {submitted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </motion.div>
          ) : (
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          )}
          <CardTitle>
            {submitted ? "Thanks for your review!" : `Your review`}
          </CardTitle>
        </div>
        <div className="flex items-center gap-0.5 mb-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${
                s <= existingReview.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-200 dark:text-gray-700"
              }`}
            />
          ))}
          <span className="text-sm font-medium text-gray-900 dark:text-white ml-1.5">
            {existingReview.rating}/5
          </span>
        </div>
        {existingReview.comment && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{existingReview.comment}</p>
        )}
      </Card>
    );
  }

  // Review form
  return (
    <Card>
      <CardTitle className="mb-3">Rate this {revieweeLabel}</CardTitle>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        How was your experience? Your rating helps build trust on the platform.
      </p>

      {/* Star picker */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <motion.button
            key={s}
            type="button"
            whileTap={{ scale: 0.8 }}
            onMouseEnter={() => setHoveredStar(s)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(s)}
            className="p-0.5 rounded-md transition-colors hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                s <= (hoveredStar || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-200 dark:text-gray-700"
              }`}
            />
          </motion.button>
        ))}
        {rating > 0 && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-2"
          >
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </motion.span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={`Leave a comment about this ${revieweeLabel} (optional)`}
        rows={2}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/5 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow resize-none"
      />

      <Button
        size="sm"
        onClick={handleSubmit}
        loading={submitting}
        disabled={rating === 0}
        className="mt-2"
      >
        <Send className="h-3.5 w-3.5 mr-1" /> Submit Review
      </Button>
    </Card>
  );
}
