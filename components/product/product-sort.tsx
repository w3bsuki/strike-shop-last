"use client"

import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProductSortOption } from "@/types/integrated"

interface ProductSortProps {
  currentSort: ProductSortOption
}

const sortOptions: Array<{ value: ProductSortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "best-selling", label: "Best Selling" },
]

/**
 * Client Component - Product Sort
 * Handles sort selection and URL updates
 */
export function ProductSort({ currentSort }: ProductSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (value: ProductSortOption) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "newest") {
      params.delete("sort") // Default sort
    } else {
      params.set("sort", value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <Select value={currentSort} onValueChange={handleSortChange}>
      <SelectTrigger className="w-[180px] h-9 text-xs">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}