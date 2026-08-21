import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-1 bg-white p-6 dark:bg-gray-900 sm:p-0">
      <div className="relative flex h-screen w-full flex-col justify-center dark:bg-gray-900 sm:p-0 lg:flex-row">
        {children}

        {/* InsureAI Branding Panel */}
        <div className="hidden h-full w-full items-center bg-white lg:grid dark:bg-[#0f1b33] lg:w-1/2">
          <div className="relative z-1 flex w-full items-center justify-center">
            <GridShape />

            <div className="flex max-w-md flex-col items-center px-8 text-center">
              <Link to="/" className="mb-6 block">
                <img
                  src="/images/logo/insureai-logo-dark.png"
                  alt="InsureAI"
                  className="h-14 w-auto object-contain"
                />
              </Link>

              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Smarter Insurance.
              </h2>

              <h2 className="mt-1 text-3xl font-semibold text-blue-600 dark:text-blue-400">
                Simpler Claims.
              </h2>

              <p className="mt-5 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Manage your insurance policies, submit claims and track
                progress with intelligent AI-powered assistance.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    AI
                  </span>
                  Damage Assessment
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    Fast
                  </span>
                  Claims
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    Secure
                  </span>
                  Insurance
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}