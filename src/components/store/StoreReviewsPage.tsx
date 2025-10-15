// src/components/store/StoreReviewsPage.tsx
'use client';

import { useEffect, useState } from 'react';

interface Review {
  authorAttribution: {
    displayName: string;
    photoUri?: string;
  };
  rating: number;
  text: {
    text: string;
  };
  relativePublishTimeDescription: string;
}

interface StoreReviewsPageProps {
  placeId?: string;
  storeName: string;
}

export const StoreReviewsPage = ({ placeId, storeName }: StoreReviewsPageProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!placeId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/store/reviews/${placeId}`);
        const data = await res.json();
        
        setReviews(data.reviews || []);
        setRating(data.rating || 0);
        setTotalReviews(data.totalReviews || 0);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [placeId]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check for no placeId AFTER loading is done
  if (!placeId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Reviews</h1>
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-gray-600 text-lg mb-2">Reviews niet beschikbaar</p>
            <p className="text-gray-500 text-sm">Deze winkel heeft nog geen Google reviews geconfigureerd</p>
          </div>
        </div>
      </div>
    );
  }

  // Check for empty reviews AFTER placeId check
  if (reviews.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Reviews</h1>
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-gray-600 text-lg mb-2">Nog geen reviews</p>
            <p className="text-gray-500 text-sm mb-4">Wees de eerste om {storeName} te reviewen op Google!</p>
            <a
              href={`https://search.google.com/local/writereview?placeid=${placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Schrijf een review op Google
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Reviews</h1>

        {/* Overall Rating Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="text-center md:text-left">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {rating.toFixed(1)}
              </div>
              {renderStars(Math.round(rating))}
              <p className="text-gray-600 text-sm mt-2">
                Gebaseerd op {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <div className="flex-1"></div>
            <a
              href={`https://search.google.com/local/writereview?placeid=${placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Schrijf een review
            </a>
          </div>
        </div>

        {/* Individual Reviews */}
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {review.authorAttribution.photoUri ? (
                  <img
                    src={review.authorAttribution.photoUri}
                    alt={review.authorAttribution.displayName}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {review.authorAttribution.displayName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <h4 className="font-semibold text-gray-900">
                      {review.authorAttribution.displayName}
                    </h4>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {review.relativePublishTimeDescription}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                  <p className="text-gray-700 mt-3 leading-relaxed">
                    {review.text.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Link */}
        <div className="text-center mt-8">
          <a
            href={`https://search.google.com/local/reviews?placeid=${placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-2"
          >
            Bekijk alle reviews op Google
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};