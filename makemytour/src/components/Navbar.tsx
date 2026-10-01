"use client";

import React, { useEffect, useState } from "react";
import SignupDialog from "./SignupDialog";
import { LogOut, Plane, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { clearUser } from "@/store";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  // Important:
  // Redux/localStorage user state is only available after hydration.
  // Rendering the Radix DropdownMenu before hydration can make the
  // server render a Dialog/Sign Up trigger while the client renders
  // a Menu trigger, causing the hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logout = () => {
    dispatch(clearUser());
  };

  return (
    <header className="backdrop-blur-md py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-white">
          <Plane className="w-8 h-8 text-red-500" />
          <span className="text-2xl font-bold text-black">MakeMyTour</span>
        </div>

        <div className="flex items-center space-x-4">
          {!mounted ? (
            // Keep server HTML and the first client render identical.
            <div className="h-8 w-20 rounded-md" aria-hidden="true" />
          ) : user ? (
            <>
              {user.role === "ADMIN" && (
                <Button
                  variant="default"
                  onClick={() => router.push("/admin")}
                >
                  ADMIN
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.firstName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <SignupDialog
              trigger={
                <Button
                  variant="outline"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign Up
                </Button>
              }
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
