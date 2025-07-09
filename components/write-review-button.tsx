'use client';

interface WriteReviewButtonProps {
  productId: string;
}

export function WriteReviewButton({ productId }: WriteReviewButtonProps) {
  const handleWriteReview = () => {
    // TODO: Implement review modal or navigation to review form
    console.log('Write review for product:', productId);
  };

  return (
    <button 
      className="button-secondary mt-4 md:mt-0"
      onClick={handleWriteReview}
    >
      Write a Review
    </button>
  );
}