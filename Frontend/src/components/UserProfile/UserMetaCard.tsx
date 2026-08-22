import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";
import { customerApi } from "../../lib/api";
import { useEffect, useState } from "react";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Load customer profile for editable fields
  useEffect(() => {
    if (user?.role === "CUSTOMER") {
      customerApi.getProfile().then((p) => {
        setFirstName(p.first_name);
        setLastName(p.last_name);
        setPhone(p.phone);
        setAddress(p.address ?? "");
      }).catch(() => {});
    }
  }, [user]);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const roleBadge =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "CLAIM_OFFICER"
        ? "Claims Officer"
        : "Customer";

  const handleSave = async () => {
    if (user?.role !== "CUSTOMER") { closeModal(); return; }
    setSaving(true);
    setSaveMsg(null);
    try {
      await customerApi.updateProfile({ first_name: firstName, last_name: lastName, phone, address });
      setSaveMsg("Profile updated.");
    } catch {
      setSaveMsg("Failed to save changes.");
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

          {/* Edit button — only for customers */}
          {user?.role === "CUSTOMER" && (
            <button
              onClick={openModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Profile</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your InsureAI profile information.
            </p>
          </div>

          {saveMsg && (
            <div className="mb-4 mx-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {saveMsg}
            </div>
          )}

          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>First Name</Label>
                  <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                </div>
                <div className="lg:col-span-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={user?.email ?? ""} readOnly />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input type="text" value={roleBadge} readOnly />
                </div>
                <div className="lg:col-span-2">
                  <Label>Address</Label>
                  <Input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your address" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>Close</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
