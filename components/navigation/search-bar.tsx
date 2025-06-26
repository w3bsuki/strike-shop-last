"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface SearchBarProps {
  className?: string;
  variant?: "inline" | "dialog" | "command" | "icon";
}

export function SearchBar({ className, variant = "dialog" }: SearchBarProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setOpen(false);
      setSearchQuery("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn("min-h-[48px] min-w-[48px]", className)}
        aria-label="Search products"
      >
        <Search className="h-6 w-6" />
      </Button>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={cn("relative", className)}>
        <Input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
          inputMode="search"
          enterKeyHint="search"
        />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="absolute right-0 top-0 h-full px-3 min-w-touch"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </form>
    );
  }

  if (variant === "command") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className={className}
          aria-label="Search products"
        >
          <Search className="h-5 w-5" />
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput
            placeholder="Search products..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={() => handleSearch("men's clothing")}>
                Men's Clothing
              </CommandItem>
              <CommandItem onSelect={() => handleSearch("women's shoes")}>
                Women's Shoes
              </CommandItem>
              <CommandItem onSelect={() => handleSearch("accessories")}>
                Accessories
              </CommandItem>
              <CommandItem onSelect={() => handleSearch("sale items")}>
                Sale Items
              </CommandItem>
            </CommandGroup>
            {searchQuery && (
              <CommandGroup heading="Search">
                <CommandItem onSelect={() => handleSearch(searchQuery)}>
                  Search for "{searchQuery}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={className}
        aria-label="Search products"
      >
        <Search className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                inputMode="search"
                enterKeyHint="search"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3 min-w-touch"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Popular searches:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Sneakers", "T-Shirts", "Jeans", "Sale"].map((term) => (
                  <Button
                    key={term}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(term.toLowerCase())}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}