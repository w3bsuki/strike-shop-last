'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Trash2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AddProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([
    '/placeholder.svg?height=200&width=200',
  ]);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    compareAtPrice: '',
    description: '',
    category: 'Clothing',
    status: 'Active',
    tags: '',
    stock: '100',
    weight: '',
    dimensions: '',
    materials: '',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'White'],
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeToggle = (size: string) => {
    setFormData((prev) => {
      if (prev.sizes.includes(size)) {
        return { ...prev, sizes: prev.sizes.filter((s) => s !== size) };
      } else {
        return { ...prev, sizes: [...prev.sizes, size] };
      }
    });
  };

  const handleColorToggle = (color: string) => {
    setFormData((prev) => {
      if (prev.colors.includes(color)) {
        return { ...prev, colors: prev.colors.filter((c) => c !== color) };
      } else {
        return { ...prev, colors: [...prev.colors, color] };
      }
    });
  };

  const handleAddImage = () => {
    const newImageIndex = images.length + 1;
    setImages([
      ...images,
      `/placeholder.svg?height=200&width=200&query=product+${newImageIndex}`,
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, this would send the data to the server

    setIsSubmitting(false);
    router.push('/admin/products');
  };

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const availableColors = [
    'Black',
    'White',
    'Gray',
    'Red',
    'Blue',
    'Green',
    'Yellow',
    'Purple',
    'Brown',
    'Navy',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link
            href="/admin/products"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/products')}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-md border">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Monochrome Knit Sweater"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g. STR-MKS-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      £
                    </span>
                    <Input
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="pl-8"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="compareAtPrice">Compare-at Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      £
                    </span>
                    <Input
                      id="compareAtPrice"
                      name="compareAtPrice"
                      value={formData.compareAtPrice}
                      onChange={handleChange}
                      className="pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your product..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="bg-white p-6 rounded-md border">
            <h2 className="text-lg font-semibold mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="Clothing">Clothing</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Bags">Bags</option>
                  <option value="Homeware">Homeware</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g. winter, knitwear, new (comma separated)"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white p-6 rounded-md border">
            <h2 className="text-lg font-semibold mb-4">Inventory</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stock">Stock quantity</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="dimensions">Dimensions (cm)</Label>
                  <Input
                    id="dimensions"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    placeholder="L x W x H"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="materials">Materials</Label>
                <Input
                  id="materials"
                  name="materials"
                  value={formData.materials}
                  onChange={handleChange}
                  placeholder="e.g. 100% Cotton"
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white p-6 rounded-md border">
            <h2 className="text-lg font-semibold mb-4">Variants</h2>
            <div className="space-y-6">
              <div>
                <Label className="block mb-2">Available Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-4 py-2 border ${
                        formData.sizes.includes(size)
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="block mb-2">Available Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorToggle(color)}
                      className={`px-4 py-2 border ${
                        formData.colors.includes(color)
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white p-6 rounded-md border">
            <h2 className="text-lg font-semibold mb-4">Product Images</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square relative border border-gray-200 rounded-md overflow-hidden">
                      <Image
                        src={image || '/placeholder.svg'}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="aspect-square flex items-center justify-center border border-dashed border-gray-300 rounded-md hover:border-gray-500"
                >
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-sm">Add Image</span>
                  </div>
                </button>
              </div>
              <div className="text-xs text-gray-500">
                You can add up to 8 images. First image will be used as the
                product thumbnail.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-md border">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </Button>
              <Button variant="outline" className="w-full">
                Preview
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
