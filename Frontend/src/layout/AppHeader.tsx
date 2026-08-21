import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-99999 w-full border-b border-gray-800 bg-[#08142b]">
      <div className="flex h-[76px] items-center justify-between px-4 lg:px-6">
        
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Sidebar toggle */}
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/5 hover:text-white"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 6H20M4 12H20M4 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          {/* InsureAI logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/images/logo/insureai-logo-light.png"
              alt="InsureAI"
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Dark / Light mode */}
          <ThemeToggleButton />

          {/* Notifications */}
          <NotificationDropdown />

          {/* User profile */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;