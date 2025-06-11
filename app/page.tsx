import { client, urlFor, type SanityProduct, type SanityCategory } from "@/lib/sanity"
import HomePageClient from "@/components/home-page-client"
import type { HomePageCategory, HomePageProduct } from "@/types/home-page"
import { MedusaProductService } from "@/lib/medusa-service"

async function getHomePageData() {
  // Try to fetch from Medusa first, fallback to Sanity
  try {
    // Fetch categories from Medusa
    const medusaCategories = await MedusaProductService.getCategories()
    const categories: HomePageCategory[] = medusaCategories.length > 0 
      ? medusaCategories.map(cat => ({
          id: cat.id,
          name: cat.name.toUpperCase(),
          count: 0, // Medusa doesn't provide count
          image: "/placeholder.svg?height=400&width=400",
          slug: cat.handle,
        }))
      : [] // Fallback to empty if no Medusa categories

    // If no Medusa categories, try Sanity
    if (categories.length === 0) {
      const categoryQuery = `*[_type == "category"]{
        _id, name, "slug": slug.current, "image": image.asset->url, "count": count(*[_type == "product" && references(^._id)])
      }`
      const categoriesData: SanityCategory[] = (await client.fetch(categoryQuery)) || []
      categories.push(...categoriesData.map((cat) => ({
        id: cat._id,
        name: cat.name.toUpperCase(),
        count: cat.count || 0,
        image: cat.image ? urlFor(cat.image).width(400).height(400).url() : "/placeholder.svg?height=400&width=400",
        slug: cat.slug.current,
      })))
    }

    // Fetch products from Medusa
    const medusaProducts = await MedusaProductService.getProducts({ limit: 20 })
    
    // Get collections for categorizing products
    const collections = await MedusaProductService.getCollections()
    const newArrivalsCollection = collections.find(c => c.handle === 'new-arrivals')
    const bestSellersCollection = collections.find(c => c.handle === 'best-sellers')

    // Convert Medusa products to HomePageProduct format
    const convertMedusaProduct = (prod: any): HomePageProduct => {
      const lowestPrice = MedusaProductService.getLowestPrice(prod)
      return {
        id: prod.id,
        name: prod.title,
        price: lowestPrice ? MedusaProductService.formatPrice(lowestPrice.amount, lowestPrice.currency) : "£0.00",
        image: prod.thumbnail || prod.images?.[0]?.url || "/placeholder.svg?height=400&width=300",
        images: prod.images?.map((img: any) => img.url),
        slug: prod.handle,
        isNew: prod.collection?.id === newArrivalsCollection?.id,
        colors: prod.variants?.filter((v: any) => v.title.includes('/')).length || 1,
        description: prod.description,
        sizes: prod.variants?.map((v: any) => v.title.split(' / ')[0]).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
        sku: prod.variants?.[0]?.sku,
      }
    }

    // Categorize products
    const newArrivals: HomePageProduct[] = medusaProducts
      .filter(p => p.collection?.id === newArrivalsCollection?.id)
      .slice(0, 6)
      .map(convertMedusaProduct)

    // If no new arrivals from Medusa, use all products
    if (newArrivals.length === 0) {
      newArrivals.push(...medusaProducts.slice(0, 6).map(convertMedusaProduct))
    }

    // For now, use same products for different sections (until more products are added)
    const saleItems = medusaProducts
      .filter(p => p.collection?.id === bestSellersCollection?.id)
      .slice(0, 4)
      .map(convertMedusaProduct)
    
    // If no sale items, use all products with a "discount"
    if (saleItems.length === 0 && medusaProducts.length > 0) {
      const saleProducts = medusaProducts
        .slice(0, 4)
        .map(p => ({
          ...convertMedusaProduct(p),
          originalPrice: p.variants?.[0]?.prices?.[0] 
            ? MedusaProductService.formatPrice(
                Math.round(p.variants[0].prices[0].amount * 1.3), // Add 30% to show as "original"
                p.variants[0].prices[0].currency_code
              )
            : undefined,
          discount: "-30%",
        }))
      saleItems.push(...saleProducts)
    }

    const sneakers = medusaProducts
      .filter(p => p.title.toLowerCase().includes('shoe') || p.title.toLowerCase().includes('sneaker'))
      .slice(0, 4)
      .map(convertMedusaProduct)
    
    // If no sneakers found, use some products as placeholder
    if (sneakers.length === 0 && medusaProducts.length > 0) {
      // Use sweatpants and shorts as "footwear" temporarily
      const footwearProducts = medusaProducts
        .filter(p => p.handle === 'sweatpants' || p.handle === 'shorts')
        .slice(0, 4)
        .map(p => ({
          ...convertMedusaProduct(p),
          name: p.title.replace('Medusa', 'Strike™'), // Rebrand for consistency
        }))
      sneakers.push(...footwearProducts)
    }

    const kidsItems = medusaProducts
      .filter(p => p.categories?.some(c => c.handle === 'kids'))
      .slice(0, 4)
      .map(convertMedusaProduct)
    
    // If no kids items found, use some products as placeholder
    if (kidsItems.length === 0 && medusaProducts.length > 0) {
      // Use t-shirt and sweatshirt as "kids" items temporarily
      const kidsProducts = medusaProducts
        .filter(p => p.handle === 't-shirt' || p.handle === 'sweatshirt')
        .slice(0, 4)
        .map(p => ({
          ...convertMedusaProduct(p),
          name: `Kids ${p.title.replace('Medusa', 'Strike™')}`, // Add "Kids" prefix
        }))
      kidsItems.push(...kidsProducts)
    }

    // If Medusa returns no products, fallback to Sanity
    if (medusaProducts.length === 0) {
      // Original Sanity queries...
      const newArrivalsQuery = `*[_type == "product" && isNewArrival == true][0...6]{
        _id, name, price, originalPrice, "slug": slug.current, "image": images[0].asset->url, isNewArrival, colors,
        "discount": select(originalPrice > price => "-" + round((originalPrice - price) / originalPrice * 100) + "%"),
        description, sizes, sku, images
      }`
      let newArrivalsData: SanityProduct[] = (await client.fetch(newArrivalsQuery)) || []
      
      if (newArrivalsData.length === 0) {
        const fallbackQuery = `*[_type == "product"][0...6] | order(_createdAt desc){
          _id, name, price, originalPrice, "slug": slug.current, "image": images[0].asset->url, isNewArrival, colors,
          "discount": select(originalPrice > price => "-" + round((originalPrice - price) / originalPrice * 100) + "%"),
          description, sizes, sku, images
        }`
        newArrivalsData = (await client.fetch(fallbackQuery)) || []
      }
      
      if (newArrivalsData.length > 0) {
        newArrivals.length = 0
        newArrivals.push(...newArrivalsData.map((prod) => ({
          id: prod._id,
          name: prod.name,
          price: `£${prod.price.toFixed(2)}`,
          originalPrice: prod.originalPrice ? `£${prod.originalPrice.toFixed(2)}` : undefined,
          discount: prod.discount,
          image:
            prod.images && prod.images.length > 0
              ? urlFor(prod.images[0]).width(300).height(400).url()
              : "/placeholder.svg?height=400&width=300",
          images: prod.images?.map((img) => urlFor(img).url()),
          isNew: prod.isNewArrival,
          slug: prod.slug.current,
          colors: prod.colors?.length,
          description: prod.description,
          sizes: prod.sizes,
          sku: prod.sku,
        })))
      }
    }

    return { categories, newArrivals, saleItems, sneakers, kidsItems }
  } catch (error) {
    console.error('Error fetching data:', error)
    // Return empty data
    return {
      categories: [],
      newArrivals: [],
      saleItems: [],
      sneakers: [],
      kidsItems: []
    }
  }
}

export default async function HomePage() {
  const data = await getHomePageData()

  return <HomePageClient {...data} />
}