import { useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const firstName = user?.full_name?.split(" ")[0] ?? "Account";

  const roleBadge =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "CLAIM_OFFICER"
        ? "Claims Officer"
        : "Customer";

  const handleLogout = () => {
    logout();
    navigate("/signin", { replace: true });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-gray-300 transition hover:text-white"
      >
        <span className="mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="mr-1 hidden font-medium text-white sm:block">{firstName}</span>
        <svg
          className={`stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900"
      >
        {/* User Info */}
        <div className="border-b border-gray-200 pb-4 dark:border-gray-800">
          <span className="block font-semibold text-gray-800 dark:text-white">
            {user?.full_name ?? "—"}
          </span>
          <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
            {roleBadge}
          </span>
          <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
            {user?.email}
          </span>
        </div>

        {/* Menu */}
        <ul className="flex flex-col gap-1 py-3">
          {user?.role === "CUSTOMER" && (
            <li>
              <DropdownItem
                onItemClick={() => setIsOpen(false)}
                tag="a"
                to="/profile"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              >
                Profile
              </DropdownItem>
            </li>
          )}
          <li>
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              tag="a"
              to="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              Account Settings
            </DropdownItem>
          </li>
        </ul>

        {/* Sign Out */}
        <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          >
            Sign Out
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
