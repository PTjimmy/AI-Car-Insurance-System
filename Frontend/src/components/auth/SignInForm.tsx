import { useState } from "react";
import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 py-10">
        <div>
          {/* InsureAI Branding */}
         <div className="mb-8 text-center">
         <div className="mb-4 flex justify-center">
         <img
         src="/images/logo/insureai-logo-icon.png"
         alt="InsureAI"
         className="h-16 w-16 rounded-2xl object-contain"
         />
         </div>

         <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
         InsureAI
         </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
         Smart insurance. Simpler claims.
         </p>
         </div>

          {/* Welcome */}
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              Welcome back
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to manage your policies and claims.
            </p>
          </div>

          {/* Login Form */}
          <form>
            <div className="space-y-5">

              {/* Email */}
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>

                <Input
                  type="email"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                  />

                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isChecked}
                    onChange={setIsChecked}
                  />

                  <span className="text-sm text-gray-700 dark:text-gray-400">
                    Remember me
                  </span>
                </div>

                <Link
                  to="/reset-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button className="w-full" size="sm">
                Sign In
              </Button>
            </div>
          </form>

          {/* Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center dark:border-gray-800 dark:bg-white/5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your information is protected with secure authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}