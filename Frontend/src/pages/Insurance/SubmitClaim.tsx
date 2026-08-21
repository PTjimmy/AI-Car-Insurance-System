import { useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function SubmitClaim() {
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    const validFiles = selectedFiles.filter(
      (file) => file.size <= 10 * 1024 * 1024
    );

    setFiles((currentFiles) => [...currentFiles, ...validFiles]);

    event.target.value = "";
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (submitted) {
    return (
      <>
        <PageMeta
          title="InsureAI | Claim Submitted"
          description="Your insurance claim has been submitted."
        />

        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm dark:border-green-500/20 dark:bg-gray-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600 dark:bg-green-500/10 dark:text-green-400">
              ✓
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-gray-900 dark:text-white">
              Claim Submitted Successfully
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Your claim has been submitted and is now ready for AI assessment.
              You will be able to track its progress from My Claims.
            </p>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Claim Number
              </p>

              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                CLM-2026-00143
              </p>

              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Current Status
              </p>

              <p className="mt-1 font-semibold text-blue-600 dark:text-blue-400">
                Submitted — Awaiting AI Assessment
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/claims"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                View My Claims
              </Link>

              <Link
                to="/"
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="InsureAI | Submit Claim"
        description="Submit a new insurance claim."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/claims"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to My Claims
          </Link>

          <div className="mt-4">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Claims
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              Submit a Claim
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Provide the incident details and evidence required to assess your
              claim.
            </p>
          </div>
        </div>

        {/* Process */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
              AI
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                What happens after submission?
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                InsureAI analyses your submitted evidence to estimate damage
                severity and repair cost. A Claims Officer then reviews the
                assessment and makes the final decision.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={(event) => {
            event.preventDefault();

            if (files.length === 0) {
              return;
            }

            setSubmitted(true);
          }}
          className="space-y-6"
        >
          {/* Claim Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Claim Information
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tell us which policy and type of incident you are reporting.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="policy"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Insurance Policy
                </label>

                <select
                  id="policy"
                  required
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select a policy</option>
                  <option value="INS-MTR-2026-00124">
                    INS-MTR-2026-00124 — Motor Insurance
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="claimType"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Claim Type
                </label>

                <select
                  id="claimType"
                  required
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select claim type</option>
                  <option value="vehicle-damage">Vehicle Damage</option>
                  <option value="accident">Accident</option>
                  <option value="theft">Theft</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="incidentDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Incident Date
                </label>

                <input
                  id="incidentDate"
                  type="date"
                  required
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Incident Location
                </label>

                <input
                  id="location"
                  type="text"
                  required
                  placeholder="e.g. Vadodara, Gujarat"
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Incident Description
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Describe what happened and the damage you observed.
            </p>

            <textarea
              required
              rows={6}
              placeholder="Describe the incident, visible damage and any other relevant information..."
              className="mt-5 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Evidence */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Upload Evidence
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload clear photographs and supporting documents for the AI
              assessment.
            </p>

            <div className="mt-5 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                ↑
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                Upload claim evidence
              </h3>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG or PDF files up to 10 MB each
              </p>

              <label className="mt-4 inline-flex cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                Choose Files

                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Selected Evidence
                  </h3>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        {file.type === "application/pdf" ? "PDF" : "IMG"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length === 0 && (
              <p className="mt-4 text-center text-xs text-amber-600 dark:text-amber-400">
                Please upload at least one piece of evidence.
              </p>
            )}
          </div>

          {/* Declaration */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                I confirm that the information and evidence provided in this
                claim are accurate and complete to the best of my knowledge.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link
              to="/claims"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={files.length === 0}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit Claim for AI Assessment
            </button>
          </div>
        </form>
      </div>
    </>
  );
}