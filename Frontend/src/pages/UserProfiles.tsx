import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="InsureAI | Profile"
        description="Manage your InsureAI profile and personal information."
      />

      <PageBreadcrumb pageTitle="Profile" />

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Account
          </p>

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information and account details.
          </p>
        </div>

        {/* Profile */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="space-y-6">
            <UserMetaCard />
            <UserInfoCard />
            <UserAddressCard />
          </div>
        </div>
      </div>
    </>
  );
}