import ProductPageClient from "./ProductPageClient"
import { client, type SanityProduct } from "@/lib/sanity"

interface ProductPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const products = await client.fetch<SanityProduct[]>(`*[_type == "product"]{"slug": slug.current}`)
  return products.map((product) => ({
    slug: product.slug.current,
  }))
}

async function getProductData(slug: string): Promise<SanityProduct | null> {
  const query = `*[_type == "product" && slug.current == $slug][0]{
    ...,
    "category": category->{name, "slug": slug.current},
    "images": images[]{asset->{_id, url, metadata{dimensions, lqip}}, hotspot, crop},
    "description": description[]{
      ...,
      _type == "image" => asset->
    }
  }`
  const product = await client.fetch<SanityProduct>(query, { slug })
  return product
}

export default async function ProductPage({ params }: ProductPageProps) {
  const productData = await getProductData(params.slug)

  return <ProductPageClient productData={productData} slug={params.slug} />
}
