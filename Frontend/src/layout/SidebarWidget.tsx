export default function SidebarWidget() {
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-blue-50 px-4 py-5 text-center
        dark:bg-blue-500/10
      `}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        InsureAI
      </h3>

      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Smart insurance management with AI-powered claims assistance.
      </p>
    </div>
  );
}