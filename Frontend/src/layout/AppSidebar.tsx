import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PageIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
  }[];
};

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/",
  },
  {
    name: "My Insurance",
    icon: <BoxCubeIcon />,
    subItems: [
      { name: "Policies", path: "/policies" },
      { name: "Documents", path: "/documents" },
    ],
  },
  {
    name: "Claims",
    icon: <PageIcon />,
    subItems: [
      { name: "My Claims", path: "/claims" },
      { name: "Submit Claim", path: "/claims/submit" },
    ],
  },
];

const managementItems: NavItem[] = [
  {
    name: "Claims Officer",
    icon: <PageIcon />,
    subItems: [
      { name: "Claims Management", path: "/officer/claims" },
    ],
  },
  {
    name: "Admin",
    icon: <GridIcon />,
    subItems: [
      { name: "Admin Dashboard", path: "/admin" },
    ],
  },
];

const accountItems: NavItem[] = [
  {
    name: "Account",
    icon: <UserCircleIcon />,
    subItems: [
      { name: "Profile", path: "/profile" },
      { name: "Settings", path: "/settings" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
  } = useSidebar();

  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const isItemActive = (item: NavItem) => {
    if (item.path) {
      return isActive(item.path);
    }

    return (
      item.subItems?.some((subItem) => isActive(subItem.path)) ?? false
    );
  };

  useEffect(() => {
    const allItems = [
      ...navItems,
      ...managementItems,
      ...accountItems,
    ];

    const activeItem = allItems.find((item) =>
      item.subItems?.some((subItem) => isActive(subItem.path))
    );

    setOpenSubmenu(activeItem?.name ?? null);
  }, [location.pathname, isActive]);

  const expanded = isExpanded || isHovered || isMobileOpen;

  const handleSubmenuToggle = (name: string) => {
    setOpenSubmenu((current) =>
      current === name ? null : name
    );
  };

  const renderItems = (items: NavItem[]) => {
    return (
      <div className="space-y-2">
        {items.map((item) => {
          const active = isItemActive(item);

          if (item.path) {
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                } ${!expanded ? "lg:justify-center" : ""}`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {item.icon}
                </span>

                {expanded && <span>{item.name}</span>}
              </Link>
            );
          }

          const isOpen = openSubmenu === item.name;

          return (
            <div key={item.name}>
              <button
                type="button"
                onClick={() => handleSubmenuToggle(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                } ${!expanded ? "lg:justify-center" : ""}`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {item.icon}
                </span>

                {expanded && (
                  <>
                    <span>{item.name}</span>

                    <ChevronDownIcon
                      className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </>
                )}
              </button>

              {expanded && (
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen
                      ? "max-h-40 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="ml-11 mt-1 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                    {item.subItems?.map((subItem) => {
                      const subActive = isActive(subItem.path);

                      return (
                        <Link
                          key={subItem.name}
                          to={subItem.path}
                          className={`block rounded-lg px-3 py-2 text-sm transition ${
                            subActive
                              ? "font-medium text-blue-600 dark:text-blue-400"
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white px-4 transition-all duration-300 dark:border-slate-800 dark:bg-[#08142b] ${
        expanded ? "w-[260px]" : "w-[88px]"
      } ${
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0"
      }`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`flex h-[76px] items-center border-b border-slate-100 dark:border-slate-800 ${
          expanded ? "justify-start px-2" : "justify-center"
        }`}
      >
        <Link to="/">
          {expanded ? (
            <>
              <img
                src="/images/logo/insureai-logo-light.png"
                alt="InsureAI"
                className="block h-12 w-auto object-contain dark:hidden"
              />

              <img
                src="/images/logo/insureai-logo-dark.png"
                alt="InsureAI"
                className="hidden h-12 w-auto object-contain dark:block"
              />
            </>
          ) : (
            <img
              src="/images/logo/insureai-logo-icon.png"
              alt="InsureAI"
              className="h-10 w-10 object-contain"
            />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-7 no-scrollbar">

        {/* Main Menu */}
        {expanded ? (
          <h2 className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Main Menu
          </h2>
        ) : (
          <div className="mb-4 flex justify-center text-slate-400">
            <HorizontaLDots className="h-5 w-5" />
          </div>
        )}

        {renderItems(navItems)}

        {/* Management */}
        <div className="my-7 border-t border-slate-100 dark:border-slate-800" />

        {expanded ? (
          <h2 className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Management
          </h2>
        ) : (
          <div className="mb-4 flex justify-center text-slate-400">
            <HorizontaLDots className="h-5 w-5" />
          </div>
        )}

        {renderItems(managementItems)}

        {/* Account */}
        <div className="my-7 border-t border-slate-100 dark:border-slate-800" />

        {expanded ? (
          <h2 className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Account
          </h2>
        ) : (
          <div className="mb-4 flex justify-center text-slate-400">
            <HorizontaLDots className="h-5 w-5" />
          </div>
        )}

        {renderItems(accountItems)}

        {/* InsureAI Info Card */}
        {expanded && (
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-4 text-white shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <span className="text-lg font-bold">AI</span>
            </div>

            <h3 className="text-sm font-semibold">
              Smarter Insurance
            </h3>

            <p className="mt-1 text-xs leading-5 text-blue-50">
              Manage your policies and claims with InsureAI.
            </p>

            <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
              SMARTER • FASTER • FAIRER
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;