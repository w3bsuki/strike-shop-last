import { Star, CheckCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { WriteReviewButton } from './write-review-button';

type Review = {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  isVerified: boolean;
};

type ReviewData = {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
};

interface ProductReviewsProps {
  productId: string;
}

// Server component that fetches reviews data
export default async function ProductReviews({ productId }: ProductReviewsProps) {
  let reviewData: ReviewData | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews/${productId}`, {
      cache: 'no-store' // Fresh data for reviews
    });
    reviewData = await res.json();
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!reviewData || reviewData.totalReviews === 0) {
    return (
      <div className="section-padding">
        <div className="strike-container">
          <SectionHeader title="CUSTOMER REVIEWS" showCta={false} />
          <p className="text-sm text-[var(--subtle-text-color)]">
            No reviews yet. Be the first to share your thoughts!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding bg-gray-50">
      <div className="strike-container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <SectionHeader title="CUSTOMER REVIEWS" showCta={false} />
            <div className="flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(reviewData.averageRating) ? 'text-black fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="ml-2 text-sm font-medium">
                {reviewData.averageRating.toFixed(1)} out of 5
                <span className="text-[var(--subtle-text-color)] ml-2">
                  ({reviewData.totalReviews} reviews)
                </span>
              </p>
            </div>
          </div>
          <WriteReviewButton productId={productId} />
        </div>

        <div className="space-y-8">
          {reviewData.reviews.map((review) => (
            <div key={review.id} className="border-b border-subtle pb-8">
              <div className="flex items-center mb-2">
                <p className="font-bold">{review.author}</p>
                {review.isVerified && (
                  <span className="ml-2 flex items-center text-success text-xs">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Verified
                    Purchase
                  </span>
                )}
                <p className="ml-auto text-xs text-[var(--subtle-text-color)]">
                  {formatDate(review.createdAt)}
                </p>
              </div>
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? 'text-black fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <h3 className="font-bold text-base mb-2">"{review.title}"</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {review.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
