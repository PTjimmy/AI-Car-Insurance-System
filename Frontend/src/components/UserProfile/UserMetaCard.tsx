import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";
import { customerApi, officerApi } from "../../lib/api";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user } = useAuth();

  // Form state — used by all three roles
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(""); // customer only

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const isCustomer = user?.role === "CUSTOMER";
  const isOfficerOrAdmin = user?.role === "CLAIM_OFFICER" || user?.role === "ADMIN";

  // Load existing profile data into form
  useEffect(() => {
    if (isCustomer) {
      customerApi.getProfile().then((p) => {
        setFirstName(p.first_name);
        setLastName(p.last_name);
        setPhone(p.phone);
        setAddress(p.address ?? "");
      }).catch(() => {});
    } else if (isOfficerOrAdmin) {
      officerApi.getProfile().then((p) => {
        setFirstName(p.first_name);
        setLastName(p.last_name);
        setPhone(p.phone ?? "");
      }).catch(() => {
        // Admin may not have a linked officer profile (created via script)
        // Pre-fill with the name from the JWT
        const parts = user?.full_name?.split(" ") ?? [];
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" ") ?? "");
      });
    }
  }, [user]);

  const initials = user?.full_name
    ? user.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "?";

  const roleBadge =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "CLAIM_OFFICER"
        ? "Claims Officer"
        : "Customer";

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      if (isCustomer) {
        await customerApi.updateProfile({
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
        });
        setSaveMsg({ type: "ok", text: "Profile updated successfully." });
      } else if (isOfficerOrAdmin) {
        await officerApi.updateProfile({
          first_name: firstName,
          last_name: lastName,
          phone,
        });
        setSaveMsg({ type: "ok", text: "Profile updated successfully." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("No officer profile linked")) {
        setSaveMsg({
          type: "err",
          text: "This admin account was created without a linked profile. Contact an admin to set one up via the officer creation flow.",
        });
      } else {
        setSaveMsg({ type: "err", text: "Failed to save changes. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xl font-bold text-white">
              {initials}
            </div>

            {/* User information */}
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user?.full_name ?? "—"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">{roleBadge}</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email ?? ""}</p>
              </div>
            </div>
          </div>

          {/* Edit button — available to all roles */}
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Profile
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your personal information.
            </p>
          </div>

          {saveMsg && (
            <div className={`mb-4 mx-2 rounded-lg px-4 py-2 text-sm ${
              saveMsg.type === "ok"
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            }`}>
              {saveMsg.text}
            </div>
          )}

          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* First name */}
                <div>
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>

                {/* Last name */}
                <div>
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>

                {/* Email — read-only for all roles */}
                <div className="lg:col-span-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={user?.email ?? ""} readOnly />
                </div>

                {/* Phone */}
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                {/* Role — read-only */}
                <div>
                  <Label>Role</Label>
                  <Input type="text" value={roleBadge} readOnly />
                </div>

                {/* Address — customers only */}
                {isCustomer && (
                  <div className="lg:col-span-2">
                    <Label>Address</Label>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Your address"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} type="button">
                Close
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
