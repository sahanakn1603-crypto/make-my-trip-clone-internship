import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { signup, login } from "../api";
import { setUser } from "@/store";
import { useDispatch } from "react-redux";

interface SignupDialogProps {
  trigger: React.ReactNode;
  onSuccess?: (data: any) => void;
  initialMode?: "login" | "signup";
}

const SignupDialog = ({
  trigger,
  onSuccess,
  initialMode = "signup",
}: SignupDialogProps) => {
  const [isSignup, setIsSignup] = useState(initialMode === "signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [open, setopem] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const clearform = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setError("");
  };

  const completeLogin = (data: any) => {
    // Keep the existing user object, but normalize the MongoDB _id
    // to id as well because the booking page uses currentUser.id.
    const normalizedUser = {
      ...data,
      id: data?.id ?? data?._id ?? data?.userId,
    };

    dispatch(setUser(normalizedUser));

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    }

    if (onSuccess) {
      onSuccess(normalizedUser);
    }

    setopem(false);
    clearform();
  };

  const handlePhoneChange = (value: string) => {
    // Digits only, maximum 10 digits.
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(digitsOnly);
    setError("");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignup && !/^\d{10}$/.test(phoneNumber)) {
      setError("Please enter exactly 10 digits.");
      return;
    }

    setLoading(true);

    try {
      const data = isSignup
        ? await signup(
            firstName,
            lastName,
            email.trim(),
            phoneNumber,
            password
          )
        : await login(email.trim(), password);

      completeLogin(data);
    } catch (error: any) {
      console.error("Authentication error:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        (isSignup
          ? "Signup failed. Please try again."
          : "Login failed. Please check your email and password.");

      setError(String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setopem}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isSignup ? "Create Account" : "Welcome Back"}
          </DialogTitle>

          <DialogDescription>
            {isSignup
              ? "Join us to start booking your travels."
              : "Enter your credentials to access your account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAuth} className="space-y-4 py-4">
          {isSignup && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setError("");
                  }}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="10-digit mobile number"
                required
              />
              <p className="text-xs text-gray-500">
                Enter exactly 10 digits.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 text-white"
            variant="outline"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Sign Up"
              : "Login"}
          </Button>
        </form>

        <div className="text-center text-sm">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 text-blue-600"
                onClick={() => {
                  setError("");
                  setIsSignup(false);
                }}
              >
                Login
              </Button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 text-blue-600"
                onClick={() => {
                  setError("");
                  setIsSignup(true);
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupDialog;
