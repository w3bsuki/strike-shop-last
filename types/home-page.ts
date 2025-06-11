export type HomePageCategory = {
  id: string
  name: string
  count: number
  image: string
  slug: string
}

export type HomePageProduct = {
  id: string
  name: string
  price: string
  originalPrice?: string
  discount?: string
  image: string
  images?: string[]
  isNew?: boolean
  soldOut?: boolean
  slug: string
  colors?: number
  description?: string
  sizes?: string[]
  sku?: string
}

export type HomePageProps = {
  categories: HomePageCategory[]
  newArrivals: HomePageProduct[]
  saleItems: HomePageProduct[]
  sneakers: HomePageProduct[]
  kidsItems: HomePageProduct[]
}
