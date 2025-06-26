"use client";

import * as React from "react";
import { User, Heart, ShoppingBag, LogOut, Settings, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SignInButton, UserButton, useUser, useClerk } from "@/lib/clerk-mock";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useWishlistCount } from "@/lib/stores";
import { MiniCart } from "@/components/cart/mini-cart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserNavProps {
  className?: string;
  showLabels?: boolean;
  showCart?: boolean;
}

export function UserNav({ className, showLabels = false, showCart = false }: UserNavProps) {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const wishlistCount = useWishlistCount();

  // Mobile mode - only show cart
  if (showCart) {
    return (
      <div className={cn("flex items-center", className)}>
        <MiniCart
          trigger={
            <Button variant="ghost" size="icon" className="relative h-12 w-12">
              <ShoppingBag className="h-6 w-6" />
              <span className="sr-only">Shopping cart</span>
            </Button>
          }
        />
      </div>
    );
  }

  // Desktop mode - show all
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Wishlist */}
      {isSignedIn && (
        <Link href="/wishlist">
          <Button variant="ghost" size="icon" className="relative min-h-[48px] min-w-[48px]">
            <Heart className="h-6 w-6" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
            <span className="sr-only">Wishlist ({wishlistCount} items)</span>
          </Button>
        </Link>
      )}

      {/* User Account */}
      {isSignedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative min-h-[48px] min-w-[48px]">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                <AvatarFallback>
                  {user?.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">User account menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/orders" className="cursor-pointer">
                <Package className="mr-2 h-4 w-4" />
                <span>Orders</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <SignInButton mode="modal">
          <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]">
            <User className="h-6 w-6" />
            <span className="sr-only">Sign in</span>
          </Button>
        </SignInButton>
      )}

      {/* Shopping Cart */}
      <MiniCart
        trigger={
          <Button variant="ghost" size="icon" className="relative min-h-[48px] min-w-[48px]">
            <ShoppingBag className="h-6 w-6" />
            <span className="sr-only">Shopping cart</span>
          </Button>
        }
      />
    </div>
  );
}