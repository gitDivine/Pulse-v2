"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/card";
import { Star, X } from "lucide-react";
import { timeAgo } from "@/lib/utils/format";

interface RatingCardProps {
  userId: string;
  avgRating: number | null;
  totalReviews: number;
}

export function RatingCard({ userId, avgRating, totalReviews }: RatingCardProps) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function handleOpen() {
    setOpen(true);
    if (!fetched) {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews?reviewee_id=${userId}`);
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch {}
      setLoading(false);
      setFetched(true);
    }
  }

  return (
    <>
      <button onClick={handleOpen} className="text-left w-full">
        <Card className="hover:ring-2 hover:ring-yellow-400/30 transition-all cursor-pointer h-full">
          <div className="flex items-center gap-4">
            <div className="rounded-lg p-2.5 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgRating ? `${avgRating.toFixed(1)} (${totalReviews})` : "No reviews"}
              </p>
            </div>
          </div>
        </Card>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full sm:max-w-sm bg-white dark:bg-[#111] rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className={`h-5 w-5 ${avgRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
                    <CardTitle>
                      {avgRating ? `${avgRating.toFixed(1)} Rating` : "No Reviews Yet"}
                    </CardTitle>
                    {totalReviews > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {avgRating !== null && avgRating > 0 && (
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= Math.round(avgRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200 dark:text-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg bg-gray-50 dark:bg-white/5 p-3 space-y-1.5">
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No reviews yet. Complete trips to receive ratings.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-200 dark:text-gray-700"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
                              {review.rating}/5
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {timeAgo(review.created_at)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                          — {review.profiles?.company_name || review.profiles?.full_name || "User"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
