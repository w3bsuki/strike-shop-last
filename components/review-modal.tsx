'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReviewModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewModal({ productId, productName, isOpen, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !title.trim() || !content.trim() || !authorName.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setRating(0);
      setTitle('');
      setContent('');
      setAuthorName('');
      onClose();
      
      // Show success message (you could use toast here)
      alert('Thank you for your review! It will be published after moderation.');
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Write a Review</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Share your thoughts about <strong>{productName}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Rating <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="authorName" className="block text-sm font-medium mb-2">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="authorName"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="block text-sm font-medium mb-2">
                Review Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your review"
                maxLength={100}
                required
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content" className="block text-sm font-medium mb-2">
                Review <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell us about your experience with this product"
                rows={4}
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.length}/500 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rating === 0 || !title.trim() || !content.trim() || !authorName.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}