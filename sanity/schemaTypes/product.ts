import { defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image' }]
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }]
    },
    {
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'colors',
      title: 'Colors',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'isNewArrival',
      title: 'New Arrival',
      type: 'boolean'
    },
    {
      name: 'isFeatured',
      title: 'Featured',
      type: 'boolean'
    },
    {
      name: 'isOnSale',
      title: 'On Sale',
      type: 'boolean'
    }
  ]
})