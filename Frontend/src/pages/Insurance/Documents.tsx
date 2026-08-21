import PageMeta from "../../components/common/PageMeta";
import { useState } from "react";

export default function Documents() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const documents = [
    {
      name: "Motor Insurance Policy",
      type: "Policy Document",
      date: "21 August 2026",
      size: "2.4 MB",
    },
    {
      name: "Insurance Certificate",
      type: "Certificate",
      date: "21 August 2026",
      size: "1.1 MB",
    },
    {
      name: "Premium Receipt",
      type: "Payment Receipt",
      date: "21 August 2026",
      size: "540 KB",
    },
  ];

  return (
    <>
      <PageMeta
        title="InsureAI | Documents"
        description="View and manage your insurance documents."
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            My Insurance
          </p>

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Documents
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Access your insurance policies, certificates and payment documents.
          </p>
        </div>

        {/* Document List */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Your Documents
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Documents associated with your active policy.
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {documents.map((document) => (
              <div
                key={document.name}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  {/* Document Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2V8H20"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 13H16"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M8 17H13"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {document.name}
                    </h3>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{document.type}</span>
                      <span>•</span>
                      <span>{document.date}</span>
                      <span>•</span>
                      <span>{document.size}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDocument(document.name)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Information */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <span className="text-sm font-bold">i</span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Keep your documents safe
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Your insurance documents are securely stored in InsureAI and
                can be accessed whenever you need them.
              </p>
            </div>
          </div>
        </div>

        {/* Document Preview */}
        {selectedDocument && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Document Preview
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedDocument}
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Document preview will be connected to secure file storage in
                  the next development phase.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
