import { defineField, defineType } from "sanity"
import { PackageIcon } from "lucide-react" // Or any other icon

export default defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "shortDescription",
      title: "Short Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "description",
      title: "Full Description",
      type: "array", // For rich text
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
          ],
          lists: [{ title: "Bullet", value: "bullet" }],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" },
            ],
          },
        },
      ],
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "originalPrice",
      title: "Original Price (Optional)",
      description: "The price before discount, if applicable.",
      type: "number",
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: "sku",
      title: "SKU (Stock Keeping Unit)",
      type: "string",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "sizes",
      title: "Available Sizes",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "colors",
      title: "Available Colors",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "stock",
      title: "Stock Quantity",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "isNewArrival",
      title: "New Arrival",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isFeatured",
      title: "Featured Product",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isOnSale",
      title: "On Sale",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "details",
      title: "Product Details (Accordion)",
      type: "array",
      of: [
        defineType({
          name: "productDetailItem",
          title: "Detail Item",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "content", title: "Content", type: "text", rows: 3 }),
          ],
        }) as any,
      ],
    }),
    // Add more fields as needed: materials, care instructions, etc.
  ],
  preview: {
    select: {
      title: "name",
      media: "images.0.asset",
      category: "category.name",
      price: "price",
    },
    prepare({ title, media, category, price }) {
      return {
        title: title || "Untitled Product",
        subtitle: `${category ? category + " - " : ""}£${price || "N/A"}`,
        media: media || PackageIcon,
      }
    },
  },
})
