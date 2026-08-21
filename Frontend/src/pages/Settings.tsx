import PageMeta from "../components/common/PageMeta";

export default function Settings() {
  return (
    <>
      <PageMeta
        title="InsureAI | Settings"
        description="Manage your InsureAI account settings."
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Account
          </p>

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Settings
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage your account preferences and security settings.
          </p>
        </div>

        {/* Account Settings */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Account Settings
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update your account preferences.
          </p>

          <div className="mt-6 space-y-5">
            {/* Email Notifications */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Email Notifications
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Receive updates about your policies and claims.
                </p>
              </div>

              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Claim Updates */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Claim Updates
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Get notified when your claim status changes.
                </p>
              </div>

              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Security
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account security.
          </p>

          <div className="mt-6">
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Privacy
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your personal information is protected by InsureAI.
          </p>

          <div className="mt-5 rounded-xl bg-blue-50 p-4 dark:bg-blue-500/5">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Your insurance information and submitted claim evidence should
              only be accessible to authorised users.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}