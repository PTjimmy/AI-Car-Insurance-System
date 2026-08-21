import PageMeta from "../../components/common/PageMeta";
import InsuranceMetrics from "../../components/insurance/InsuranceMetrics";
import PolicyCard from "../../components/insurance/PolicyCard";
import ClaimsOverview from "../../components/insurance/ClaimsOverview";
import QuickActions from "../../components/insurance/QuickActions";

export default function Home() {
  return (
    <>
      <PageMeta
        title="InsureAI | Customer Dashboard"
        description="Manage your insurance policies, claims and documents with InsureAI."
      />

      <div className="space-y-8">

        {/* Welcome Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Customer Dashboard
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Welcome back 👋
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Manage your insurance policies, track claims and stay on top of
            your coverage.
          </p>
        </div>

        {/* Insurance Overview */}
        <section>
          <InsuranceMetrics />
        </section>

        {/* Policies + Claims */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section>
            <PolicyCard />
          </section>

          <section>
            <ClaimsOverview />
          </section>
        </div>

        {/* Quick Actions */}
        <section>
          <QuickActions />
        </section>

      </div>
    </>
  );
}