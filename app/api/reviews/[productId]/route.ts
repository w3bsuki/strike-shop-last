import { NextResponse } from "next/server"

const mockReviews = {
  "monochrome-knit-sweater": [
    {
      id: "rev1",
      author: "Alex M.",
      rating: 5,
      title: "Incredible Quality",
      content: "The material is so soft and the fit is perfect. It feels incredibly luxurious. Worth every penny.",
      createdAt: "2024-05-15T10:00:00Z",
      isVerified: true,
    },
    {
      id: "rev2",
      author: "Jessica L.",
      rating: 4,
      title: "Stylish and Comfortable",
      content:
        "A very stylish sweater that you can dress up or down. It's a bit oversized, which I love. Only reason for 4 stars is it's dry-clean only.",
      createdAt: "2024-05-10T14:30:00Z",
      isVerified: true,
    },
  ],
  "default-product": [
    {
      id: "rev3",
      author: "David R.",
      rating: 5,
      title: "Exceeded Expectations",
      content: "This piece is a work of art. The attention to detail is amazing. Highly recommend.",
      createdAt: "2024-05-20T09:00:00Z",
      isVerified: true,
    },
  ],
}

export async function GET(request: Request, { params }: { params: { productId: string } }) {
  const { productId } = params
  const reviews = mockReviews[productId as keyof typeof mockReviews] || mockReviews["default-product"]

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    averageRating: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length,
    totalReviews: reviews.length,
    reviews,
  })
}
