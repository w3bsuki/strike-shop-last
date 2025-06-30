"use client"

import * as React from "react"
import Link from "next/link"
import { User, LogOut, Settings, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/lib/supabase/hooks"
import { useSignOut } from "@/lib/hooks/use-auth"

interface UserMenuProps {
  align?: "start" | "center" | "end"
}

export const UserMenu = React.forwardRef<
  HTMLButtonElement,
  UserMenuProps
>(({ align = "end" }, ref) => {
  const { user } = useUser()
  const { signOut, isLoading } = useSignOut()
  
  if (!user) {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className="min-h-[48px] min-w-[48px]"
        asChild
      >
        <Link href="/sign-in">
          <User className="h-6 w-6" />
          <span className="sr-only">Sign in</span>
        </Link>
      </Button>
    )
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          className="relative min-h-[48px] min-w-[48px]"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
            <AvatarFallback>
              {user.fullName?.[0] || user.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">User account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.fullName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
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
          onClick={signOut}
          disabled={isLoading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
UserMenu.displayName = "UserMenu"