import { type SchemaTypeDefinition } from 'sanity'
import product from '@/sanity-studio/schemas/product'
import category from '@/sanity-studio/schemas/category'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, category],
}
