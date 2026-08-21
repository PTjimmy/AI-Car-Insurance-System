import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-[#08142b] text-gray-300 transition hover:bg-white/5 hover:text-white"
        onClick={handleClick}
        aria-label="Notifications"
      >
        {/* Notification indicator */}
        {notifying && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-blue-500">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
          </span>
        )}

        {/* Bell */}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>

      {/* Notification Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:w-[380px]"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h5 className="text-lg font-semibold text-gray-800 dark:text-white">
              Notifications
            </h5>

            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Updates about your insurance
            </p>
          </div>

          <button
            onClick={closeDropdown}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>

        {/* Notifications */}
        <ul className="flex max-h-[360px] flex-col overflow-y-auto">
          {/* AI Assessment */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                AI
              </span>

              <span className="block">
                <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
                  Your claim has been analysed by InsureAI.
                </span>

                <span className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Claim CLM-2026-00142</span>
                  <span className="h-1 w-1 rounded-full bg-gray-400" />
                  <span>Recently</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          {/* Claim Update */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600 dark:bg-green-500/10 dark:text-green-400">
                ✓
              </span>

              <span className="block">
                <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
                  Your claim is currently under review.
                </span>

                <span className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Claim CLM-2026-00142</span>
                  <span className="h-1 w-1 rounded-full bg-gray-400" />
                  <span>Today</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          {/* Policy */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg border-b border-gray-100 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                ◈
              </span>

              <span className="block">
                <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
                  Your motor insurance policy is active.
                </span>

                <span className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Policy INS-MTR-2026-00124</span>
                  <span className="h-1 w-1 rounded-full bg-gray-400" />
                  <span>Today</span>
                </span>
              </span>
            </DropdownItem>
          </li>

          {/* Evidence */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex gap-3 rounded-lg p-3 transition hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                !
              </span>

              <span className="block">
                <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
                  Your submitted evidence is being reviewed.
                </span>

                <span className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Claim CLM-2026-00142</span>
                  <span className="h-1 w-1 rounded-full bg-gray-400" />
                  <span>Yesterday</span>
                </span>
              </span>
            </DropdownItem>
          </li>
        </ul>

        {/* Footer */}
        <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          <p className="text-center text-xs text-gray-400">
            InsureAI notifications
          </p>
        </div>
      </Dropdown>
    </div>
  );
}