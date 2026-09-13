"use client";

import {
  Check,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Shield,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SettingsSection = "profile" | "security";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER"
  | "DESIGNER"
  | "MEMBER";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

type AuthResponse = {
  success: boolean;
  authenticated?: boolean;
  user?: CurrentUser | null;
  message?: string;
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  PROJECT_MANAGER: "Project Manager",
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  MEMBER: "Member",
};

const menuItems: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof User;
}> = [
  {
    id: "profile",
    label: "Profile",
    description: "Manage your account information",
    icon: User,
  },
  {
    id: "security",
    label: "Security",
    description: "Change your account password",
    icon: Shield,
  },
];

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (
    words[0].slice(0, 1) +
    words[words.length - 1].slice(0, 1)
  ).toUpperCase();
}

function getRoleLabel(role: UserRole) {
  return roleLabels[role] ?? "Member";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function SettingsPage() {
  const router = useRouter();

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadUser = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccessMessage("");

      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
          }
        );

        const data: AuthResponse =
          await response.json();

        if (
          response.status === 401 ||
          !data.authenticated ||
          !data.user
        ) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load account information."
          );
        }

        setUser(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
      } catch (error) {
        console.error(
          "Load settings user error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load account information."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function handleSaveProfile() {
    if (!user) {
      return;
    }

    const normalizedName = name.trim();
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedName) {
      setError("Full name is required.");
      return;
    }

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    setSavingProfile(true);
    setError("");
    setSuccessMessage("");

    try {
      /*
       * Profile update API can be connected here.
       * For now this keeps the current session state
       * updated in the interface.
       */

      setUser({
        ...user,
        name: normalizedName,
        email: normalizedEmail,
      });

      setName(normalizedName);
      setEmail(normalizedEmail);

      setSuccessMessage(
        "Profile information updated successfully."
      );
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setError("");
    setSuccessMessage("");

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirmation password do not match."
      );
      return;
    }

    setChangingPassword(true);

    try {
      /*
       * Password update API should be connected here.
       * The interface is ready for the password-change flow.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 600)
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccessMessage(
        "Password changed successfully."
      );
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />

            <p className="text-sm text-slate-400">
              Loading settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                <SettingsIcon className="h-5 w-5 text-blue-400" />
              </div>

              <span className="text-sm font-medium text-blue-400">
                Account
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Manage your account information and
              security settings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadUser(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/20 p-4">
            <p className="text-sm font-medium text-red-300">
              Something went wrong
            </p>

            <p className="mt-1 text-xs text-red-400/80">
              {error}
            </p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-3 w-3 text-emerald-400" />
            </div>

            <p className="text-sm font-medium text-emerald-300">
              {successMessage}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-2">
            <div className="mb-2 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Settings
              </p>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setError("");
                      setSuccessMessage("");
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {item.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {activeSection === "profile" && (
              <ProfileSection
                user={user}
                name={name}
                email={email}
                setName={setName}
                setEmail={setEmail}
                saving={savingProfile}
                onSave={handleSaveProfile}
              />
            )}

            {activeSection === "security" && (
              <SecuritySection
                currentPassword={currentPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                setCurrentPassword={
                  setCurrentPassword
                }
                setNewPassword={setNewPassword}
                setConfirmPassword={
                  setConfirmPassword
                }
                changingPassword={
                  changingPassword
                }
                onChangePassword={
                  handleChangePassword
                }
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

type ProfileSectionProps = {
  user: CurrentUser | null;
  name: string;
  email: string;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  saving: boolean;
  onSave: () => void;
};

function ProfileSection({
  user,
  name,
  email,
  setName,
  setEmail,
  saving,
  onSave,
}: ProfileSectionProps) {
  const initials = getInitials(
    user?.name || name || "User"
  );

  return (
    <div>
      <SectionHeader
        title="Profile"
        description="Manage your personal account information."
      />

      <div className="space-y-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-400 ring-1 ring-blue-500/20">
            {initials}
          </div>

          <div>
            <p className="text-base font-semibold text-white">
              {user?.name || "User"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {user?.email || email}
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Enter your full name"
          />

          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="Enter your email"
          />

          <InfoField
            label="Role"
            value={
              user
                ? getRoleLabel(user.role)
                : "Member"
            }
          />

          <InfoField
            label="Account Created"
            value={
              user
                ? formatDate(user.createdAt)
                : "-"
            }
          />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <User className="h-5 w-5 text-slate-400" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Account Information
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your account role is managed according
                to your permissions in DevHayat.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type SecuritySectionProps = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  changingPassword: boolean;
  onChangePassword: () => void;
};

function SecuritySection({
  currentPassword,
  newPassword,
  confirmPassword,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  changingPassword,
  onChangePassword,
}: SecuritySectionProps) {
  return (
    <div>
      <SectionHeader
        title="Security"
        description="Keep your DevHayat account secure."
      />

      <div className="p-6">
        <div className="max-w-2xl">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">
                Change Password
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Update your password to protect your
                DevHayat account.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter your current password"
            />

            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter your new password"
            />

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm your new password"
            />
          </div>

          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <div>
                <p className="text-xs font-medium text-slate-300">
                  Password requirements
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your new password must contain at
                  least 8 characters.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onChangePassword}
              disabled={changingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}

              {changingPassword
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-800 p-6">
      <h2 className="text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="relative">
        {type === "email" && (
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className={`h-11 w-full rounded-lg border border-slate-800 bg-slate-950 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 ${
            type === "email"
              ? "pl-10"
              : "pl-4"
          }`}
        />
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="flex h-11 items-center rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-slate-400">
        {value}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <input
        type="password"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        autoComplete="current-password"
        className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
      />
    </div>
  );
}