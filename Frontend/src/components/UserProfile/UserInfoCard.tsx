import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { customerApi, officerApi, type CustomerProfile, type OfficerProfile } from "../../lib/api";

export default function UserInfoCard() {
  const { user } = useAuth();
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [officerProfile, setOfficerProfile] = useState<OfficerProfile | null>(null);

  useEffect(() => {
    if (user?.role === "CUSTOMER") {
      customerApi.getProfile().then(setCustomerProfile).catch(() => {});
    } else if (user?.role === "CLAIM_OFFICER" || user?.role === "ADMIN") {
      officerApi.getProfile().then(setOfficerProfile).catch(() => {});
    }
  }, [user]);

  const roleBadge =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "CLAIM_OFFICER"
        ? "Claims Officer"
        : "Customer";

  // Resolve fields across roles
  const firstName = customerProfile?.first_name ?? officerProfile?.first_name ?? user?.full_name?.split(" ")[0] ?? "—";
  const lastName  = customerProfile?.last_name  ?? officerProfile?.last_name  ?? user?.full_name?.split(" ").slice(1).join(" ") ?? "—";
  const phone     = customerProfile?.phone      ?? officerProfile?.phone      ?? "—";

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">First Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{firstName}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Last Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{lastName}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email Address</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{phone}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{roleBadge}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
