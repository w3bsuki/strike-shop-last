import { NextResponse } from "next/server"

// Define the type for a social feed item
type SocialFeedItem = {
  id: string
  userAvatar: string
  userName: string
  timestamp: string
  productName: string
  productImage: string
  arImage: string
  recommendedSize: string
  fitScore: number
  caption: string
  likes: number
  comments: number
}

const mockSocialFeedItems: SocialFeedItem[] = [
  {
    id: "sf1",
    userAvatar: "/placeholder.svg?height=40&width=40",
    userName: '"STREETSTYLE_GURU"',
    timestamp: "2h ago",
    productName: "DIAGONAL HOODIE",
    productImage: "/placeholder.svg?height=100&width=80",
    arImage: "/placeholder.svg?height=300&width=250",
    recommendedSize: "L",
    fitScore: 95,
    caption: "Nailed the fit with the AR try-on! 🔥 Absolutely seamless. #OffWhiteAR #FutureOfFashion",
    likes: 1203,
    comments: 45,
  },
  {
    id: "sf2",
    userAvatar: "/placeholder.svg?height=40&width=40",
    userName: '"TECH_FASHIONISTA"',
    timestamp: "5h ago",
    productName: "ARROW SNEAKERS",
    productImage: "/placeholder.svg?height=100&width=80",
    arImage: "/placeholder.svg?height=300&width=250",
    recommendedSize: "42",
    fitScore: 98,
    caption: "Virtual try-on for these Off-White™ kicks is a game-changer. Perfect fit confirmed! 👟",
    likes: 876,
    comments: 22,
  },
  {
    id: "sf3",
    userAvatar: "/placeholder.svg?height=40&width=40",
    userName: '"MINIMAL_MODE"',
    timestamp: "1d ago",
    productName: "LOGO T-SHIRT",
    productImage: "/placeholder.svg?height=100&width=80",
    arImage: "/placeholder.svg?height=300&width=250",
    recommendedSize: "M",
    fitScore: 92,
    caption: 'Loving the AR feature. Got my size right instantly. @OffWhite™ "ACCURATE"',
    likes: 540,
    comments: 15,
  },
  {
    id: "sf4",
    userAvatar: "/placeholder.svg?height=40&width=40",
    userName: '"URBAN_EXPLORER"',
    timestamp: "3d ago",
    productName: "INDUSTRIAL CARGO PANTS",
    productImage: "/placeholder.svg?height=100&width=80",
    arImage: "/placeholder.svg?height=300&width=250",
    recommendedSize: "S",
    fitScore: 96,
    caption: "AR fitting for pants? Yes, please! These Off-White™ cargos are 🔥. Fit is spot on.",
    likes: 992,
    comments: 33,
  },
]

export async function GET() {
  // Return data immediately without delay
  return NextResponse.json(mockSocialFeedItems)
}
