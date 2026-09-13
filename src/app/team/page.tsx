"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Circle,
  Copy,
  Eye,
  EyeOff,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER"
  | "DESIGNER"
  | "MEMBER";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type CreatedAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type RoleFilter = "ALL" | UserRole;
type StatusFilter = "ALL" | "ACTIVE" | "OFFLINE";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  PROJECT_MANAGER: "Project Manager",
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  MEMBER: "Member",
};

const ROLE_OPTIONS: UserRole[] = [
  "ADMIN",
  "PROJECT_MANAGER",
  "DEVELOPER",
  "DESIGNER",
  "MEMBER",
];

function getRoleClasses(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "PROJECT_MANAGER":
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    case "DEVELOPER":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "DESIGNER":
      return "border-pink-500/20 bg-pink-500/10 text-pink-400";

    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);

  if (!parts[0]) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatDate(date: string) {
  if (!date) {
    return "Unknown";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getUserStatus(user: User): "Active" | "Offline" {
  const updatedAt = new Date(user.updatedAt).getTime();

  if (Number.isNaN(updatedAt)) {
    return "Offline";
  }

  const difference = Date.now() - updatedAt;

  return difference < 1000 * 60 * 60 * 24
    ? "Active"
    : "Offline";
}

export default function TeamPage() {
  const [members, setMembers] = useState<User[]>([]);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [selectedMember, setSelectedMember] =
    useState<User | null>(null);

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [loading, setLoading] = useState(true);

  const [loadingProfile, setLoadingProfile] =
    useState(false);

  const [changingRole, setChangingRole] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [deletingUser, setDeletingUser] =
    useState(false);

  const [showCreateAccount, setShowCreateAccount] =
    useState(false);

  const [creatingAccount, setCreatingAccount] =
    useState(false);

  const [createdAccount, setCreatedAccount] =
    useState<CreatedAccount | null>(null);

  const [createName, setCreateName] = useState("");

  const [createEmail, setCreateEmail] =
    useState("");

  const [createPassword, setCreatePassword] =
    useState("");

  const [createRole, setCreateRole] =
    useState<UserRole>("MEMBER");

  const [newUserPassword, setNewUserPassword] =
    useState("");

  const [confirmUserPassword, setConfirmUserPassword] =
    useState("");

  const [showNewUserPassword, setShowNewUserPassword] =
    useState(false);

  const [
    showConfirmUserPassword,
    setShowConfirmUserPassword,
  ] = useState(false);

  const [pageMessage, setPageMessage] =
    useState("");

  const [pageError, setPageError] =
    useState("");

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileError, setProfileError] =
    useState("");

  const isAdmin = currentUser?.role === "ADMIN";

  const loadCurrentUser =
    useCallback(async () => {
      const response = await fetch(
        "/api/auth/me",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load current user."
        );
      }

      if (!data?.user) {
        throw new Error(
          "Current user was not found."
        );
      }

      setCurrentUser(data.user);
    }, []);

  const loadMembers =
    useCallback(async () => {
      const response = await fetch(
        "/api/users",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load team members."
        );
      }

      setMembers(
        Array.isArray(data?.users)
          ? data.users
          : []
      );
    }, []);

  const loadTeam =
    useCallback(async () => {
      try {
        setLoading(true);
        setPageError("");

        await Promise.all([
          loadCurrentUser(),
          loadMembers(),
        ]);
      } catch (error) {
        console.error(
          "Load team error:",
          error
        );

        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load team members."
        );
      } finally {
        setLoading(false);
      }
    }, [
      loadCurrentUser,
      loadMembers,
    ]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key !== "Escape") {
        return;
      }

      if (showCreateAccount) {
        if (!creatingAccount) {
          setShowCreateAccount(false);
          setCreatedAccount(null);
        }

        return;
      }

      if (selectedMember) {
        setSelectedMember(null);
        setProfileError("");
        setProfileMessage("");
        setNewUserPassword("");
        setConfirmUserPassword("");
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    showCreateAccount,
    creatingAccount,
    selectedMember,
  ]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !normalizedSearch ||
        member.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        member.email
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesRole =
        roleFilter === "ALL" ||
        member.role === roleFilter;

      const status =
        getUserStatus(member);

      const normalizedStatus =
        status === "Active"
          ? "ACTIVE"
          : "OFFLINE";

      const matchesStatus =
        statusFilter === "ALL" ||
        normalizedStatus === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    members,
    search,
    roleFilter,
    statusFilter,
  ]);

  const adminCount = useMemo(
    () =>
      members.filter(
        (member) =>
          member.role === "ADMIN"
      ).length,
    [members]
  );

  const developerCount = useMemo(
    () =>
      members.filter(
        (member) =>
          member.role === "DEVELOPER"
      ).length,
    [members]
  );

  const activeCount = useMemo(
    () =>
      members.filter(
        (member) =>
          getUserStatus(member) ===
          "Active"
      ).length,
    [members]
  );

  function openCreateAccount() {
    if (!isAdmin) {
      setPageError(
        "Only administrators can create user accounts."
      );
      return;
    }

    setPageError("");
    setPageMessage("");

    setCreatedAccount(null);
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRole("MEMBER");

    setShowCreateAccount(true);
  }

  function closeCreateAccount() {
    if (creatingAccount) {
      return;
    }

    setShowCreateAccount(false);
    setCreatedAccount(null);
  }

  async function handleCreateAccount(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!isAdmin) {
      setPageError(
        "Only administrators can create user accounts."
      );
      return;
    }

    const name = createName.trim();

    const email = createEmail
      .trim()
      .toLowerCase();

    const password = createPassword;

    if (!name) {
      setPageError(
        "Full name is required."
      );
      return;
    }

    if (!email) {
      setPageError(
        "Email is required."
      );
      return;
    }

    if (!password) {
      setPageError(
        "Password is required."
      );
      return;
    }

    if (password.length < 8) {
      setPageError(
        "Password must be at least 8 characters."
      );
      return;
    }

    try {
      setCreatingAccount(true);
      setPageError("");
      setPageMessage("");

      const response = await fetch(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role: createRole,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create user account."
        );
      }

      const user = data?.user;

      if (!user?.id) {
        throw new Error(
          "Account was created but user information was not returned."
        );
      }

      const account: CreatedAccount = {
        id: user.id,
        name: user.name,
        email: user.email,
        password,
        role: user.role,
      };

      setCreatedAccount(account);

      setMembers(
        (previousMembers) => [
          user,
          ...previousMembers,
        ]
      );

      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("MEMBER");

      setPageMessage(
        "User account created successfully."
      );
    } catch (error) {
      console.error(
        "Create account error:",
        error
      );

      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to create user account."
      );
    } finally {
      setCreatingAccount(false);
    }
  }

  async function copyAccountInfo() {
    if (!createdAccount) {
      return;
    }

    const text = [
      "DevHayat Account",
      `Name: ${createdAccount.name}`,
      `User ID: ${createdAccount.id}`,
      `Email: ${createdAccount.email}`,
      `Password: ${createdAccount.password}`,
      `Role: ${ROLE_LABELS[createdAccount.role]}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(
        text
      );

      setPageError("");
      setPageMessage(
        "Account information copied to clipboard."
      );
    } catch (error) {
      console.error(
        "Copy account info error:",
        error
      );

      setPageError(
        "Failed to copy account information."
      );
    }
  }

  async function openProfile(
    member: User
  ) {
    setSelectedMember(member);

    setProfileError("");
    setProfileMessage("");

    setNewUserPassword("");
    setConfirmUserPassword("");
    setShowNewUserPassword(false);
    setShowConfirmUserPassword(false);

    try {
      setLoadingProfile(true);

      const response = await fetch(
        `/api/users/${member.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load user profile."
        );
      }

      if (data?.user) {
        setSelectedMember(data.user);
      }
    } catch (error) {
      console.error(
        "Load user profile error:",
        error
      );

      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to load user profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleRoleChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    if (!selectedMember) {
      return;
    }

    if (!isAdmin) {
      setProfileError(
        "Only administrators can change user roles."
      );
      return;
    }

    if (
      selectedMember.id ===
      currentUser?.id
    ) {
      setProfileError(
        "You cannot change your own role."
      );
      return;
    }

    const newRole =
      event.target.value as UserRole;

    if (
      !ROLE_OPTIONS.includes(newRole)
    ) {
      setProfileError(
        "Invalid user role."
      );
      return;
    }

    if (
      newRole === selectedMember.role
    ) {
      return;
    }

    try {
      setChangingRole(true);
      setProfileError("");
      setProfileMessage("");

      const response = await fetch(
        `/api/users/${selectedMember.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update user role."
        );
      }

      const updatedUser: User =
        data.user;

      setSelectedMember(updatedUser);

      setMembers(
        (previousMembers) =>
          previousMembers.map(
            (member) =>
              member.id ===
              updatedUser.id
                ? updatedUser
                : member
          )
      );

      setProfileMessage(
        `User role changed to ${ROLE_LABELS[newRole]}.`
      );
    } catch (error) {
      console.error(
        "Change user role error:",
        error
      );

      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to update user role."
      );
    } finally {
      setChangingRole(false);
    }
  }

  async function handleChangeUserPassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedMember) {
      return;
    }

    if (!isAdmin) {
      setProfileError(
        "Only administrators can change user passwords."
      );
      return;
    }

    if (
      selectedMember.id ===
      currentUser?.id
    ) {
      setProfileError(
        "You cannot change your own password from this page."
      );
      return;
    }

    if (!newUserPassword) {
      setProfileError(
        "New password is required."
      );
      return;
    }

    if (newUserPassword.length < 8) {
      setProfileError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newUserPassword.length > 128) {
      setProfileError(
        "New password must not exceed 128 characters."
      );
      return;
    }

    if (
      newUserPassword !==
      confirmUserPassword
    ) {
      setProfileError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setChangingPassword(true);
      setProfileError("");
      setProfileMessage("");

      /*
       * IMPORTANT:
       *
       * Password has its own API endpoint.
       *
       * POST /api/users/[id]/password
       *
       * Do NOT send the password to:
       * /api/users/[id]
       *
       * because that endpoint is used for
       * user management and role changes.
       */
      const response = await fetch(
        `/api/users/${selectedMember.id}/password`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            password:
              newUserPassword,
            confirmPassword:
              confirmUserPassword,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to change user password."
        );
      }

      setNewUserPassword("");
      setConfirmUserPassword("");
      setShowNewUserPassword(false);
      setShowConfirmUserPassword(false);

      setProfileMessage(
        data?.message ||
          "User password changed successfully. Previous sessions have been signed out."
      );
    } catch (error) {
      console.error(
        "Change user password error:",
        error
      );

      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to change user password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteUser() {
    if (!selectedMember) {
      return;
    }

    if (!isAdmin) {
      setProfileError(
        "Only administrators can delete users."
      );
      return;
    }

    if (
      selectedMember.id ===
      currentUser?.id
    ) {
      setProfileError(
        "You cannot delete your own account."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete ${selectedMember.name}?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUser(true);
      setProfileError("");
      setProfileMessage("");

      const response = await fetch(
        `/api/users/${selectedMember.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete user."
        );
      }

      const deletedUserName =
        selectedMember.name;

      setMembers(
        (previousMembers) =>
          previousMembers.filter(
            (member) =>
              member.id !==
              selectedMember.id
          )
      );

      setSelectedMember(null);
      setProfileError("");
      setProfileMessage("");

      setPageError("");
      setPageMessage(
        `${deletedUserName} was permanently deleted.`
      );
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to delete user."
      );
    } finally {
      setDeletingUser(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
                <Users className="h-5 w-5 text-slate-300" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Team
                </h1>

                <p className="text-sm text-slate-500">
                  Manage your DevHayat team members
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {isAdmin && (
              <button
                type="button"
                onClick={
                  openCreateAccount
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                <Plus className="h-4 w-4" />
                Create Account
              </button>
            )}

            <button
              type="button"
              onClick={loadTeam}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={
                  loading
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {pageMessage && (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {pageMessage}
          </div>
        )}

        {pageError && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {pageError}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Total Members
              </span>

              <Users className="h-5 w-5 text-slate-500" />
            </div>

            <div className="text-2xl font-bold">
              {members.length}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Administrators
              </span>

              <ShieldCheck className="h-5 w-5 text-slate-500" />
            </div>

            <div className="text-2xl font-bold">
              {adminCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Developers
              </span>

              <BriefcaseBusiness className="h-5 w-5 text-slate-500" />
            </div>

            <div className="text-2xl font-bold">
              {developerCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Active
              </span>

              <CheckCircle2 className="h-5 w-5 text-slate-500" />
            </div>

            <div className="text-2xl font-bold">
              {activeCount}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search team members..."
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value as RoleFilter
                )
              }
              className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-slate-600"
            >
              <option value="ALL">
                All Roles
              </option>

              {ROLE_OPTIONS.map(
                (role) => (
                  <option
                    key={role}
                    value={role}
                  >
                    {ROLE_LABELS[role]}
                  </option>
                )
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as StatusFilter
                )
              }
              className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-slate-600"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="OFFLINE">
                Offline
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
                />
              )
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-16 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-slate-700" />

            <h2 className="text-lg font-semibold text-slate-300">
              No team members found
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map(
              (member) => {
                const status =
                  getUserStatus(member);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() =>
                      openProfile(member)
                    }
                    className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-bold text-slate-200">
                          {getInitials(
                            member.name
                          )}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-white">
                            {member.name}
                          </h2>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div
                        className={
                          status ===
                          "Active"
                            ? "flex items-center gap-1.5 text-xs text-emerald-400"
                            : "flex items-center gap-1.5 text-xs text-slate-600"
                        }
                      >
                        {status ===
                        "Active" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}

                        {status}
                      </div>
                    </div>

                    <div className="mb-5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getRoleClasses(
                          member.role
                        )}`}
                      >
                        {
                          ROLE_LABELS[
                            member.role
                          ]
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CalendarDays className="h-3.5 w-3.5" />

                        Joined{" "}
                        {formatDate(
                          member.createdAt
                        )}
                      </div>

                      <span className="text-xs font-medium text-slate-500 transition group-hover:text-slate-300">
                        View profile
                      </span>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>

      {showCreateAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreateAccount();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="font-semibold text-white">
                  {createdAccount
                    ? "Account Created"
                    : "Create Account"}
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  {createdAccount
                    ? "Save these login credentials for the user."
                    : "Create a new DevHayat user account."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateAccount
                }
                disabled={
                  creatingAccount
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-5">
              {createdAccount ? (
                <div>
                  <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Account created successfully
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Give these credentials to the user so they can log in.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="mb-1 text-xs text-slate-600">
                        Full Name
                      </div>

                      <div className="font-medium text-slate-200">
                        {createdAccount.name}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="mb-1 text-xs text-slate-600">
                        User ID
                      </div>

                      <div className="break-all font-mono text-sm text-slate-300">
                        {createdAccount.id}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="mb-1 text-xs text-slate-600">
                        Email
                      </div>

                      <div className="break-all text-sm text-slate-300">
                        {createdAccount.email}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="mb-1 text-xs text-slate-600">
                        Password
                      </div>

                      <div className="break-all font-mono text-sm text-slate-200">
                        {createdAccount.password}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="mb-1 text-xs text-slate-600">
                        Role
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getRoleClasses(
                          createdAccount.role
                        )}`}
                      >
                        {
                          ROLE_LABELS[
                            createdAccount.role
                          ]
                        }
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={
                        copyAccountInfo
                      }
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Account Info
                    </button>

                    <button
                      type="button"
                      onClick={
                        closeCreateAccount
                      }
                      className="h-10 flex-1 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={
                    handleCreateAccount
                  }
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={createName}
                      onChange={(event) =>
                        setCreateName(
                          event.target.value
                        )
                      }
                      placeholder="Ali Ahmadi"
                      autoComplete="name"
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Email
                    </label>

                    <input
                      type="email"
                      value={createEmail}
                      onChange={(event) =>
                        setCreateEmail(
                          event.target.value
                        )
                      }
                      placeholder="user@example.com"
                      autoComplete="email"
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Password
                    </label>

                    <input
                      type="password"
                      value={
                        createPassword
                      }
                      onChange={(event) =>
                        setCreatePassword(
                          event.target.value
                        )
                      }
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600"
                    />

                    <p className="mt-2 text-xs text-slate-600">
                      Password must be at least 8 characters.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Role
                    </label>

                    <select
                      value={createRole}
                      onChange={(event) =>
                        setCreateRole(
                          event.target.value as UserRole
                        )
                      }
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300 outline-none focus:border-slate-600"
                    >
                      {ROLE_OPTIONS.map(
                        (role) => (
                          <option
                            key={role}
                            value={role}
                          >
                            {
                              ROLE_LABELS[
                                role
                              ]
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs leading-5 text-slate-600">
                    The user will log in to DevHayat using their email and password. The User ID will be generated automatically.
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={
                        closeCreateAccount
                      }
                      disabled={
                        creatingAccount
                      }
                      className="h-11 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        creatingAccount
                      }
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {creatingAccount ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Create Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedMember(null);
              setProfileError("");
              setProfileMessage("");
              setNewUserPassword("");
              setConfirmUserPassword("");
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="font-semibold text-white">
                  User Profile
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Team member details and management
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setProfileError("");
                  setProfileMessage("");
                  setNewUserPassword("");
                  setConfirmUserPassword("");
                }}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-5">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-lg font-bold text-slate-200">
                  {getInitials(
                    selectedMember.name
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold text-white">
                    {selectedMember.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="h-4 w-4" />

                    <span className="truncate">
                      {selectedMember.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4" />
                    Role
                  </div>

                  <div className="text-sm font-semibold text-slate-200">
                    {
                      ROLE_LABELS[
                        selectedMember.role
                      ]
                    }
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                    <Circle className="h-4 w-4" />
                    Status
                  </div>

                  <div className="text-sm font-semibold text-slate-200">
                    {getUserStatus(
                      selectedMember
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    Joined
                  </div>

                  <div className="text-sm font-semibold text-slate-200">
                    {formatDate(
                      selectedMember.createdAt
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                    <UserRound className="h-4 w-4" />
                    Account
                  </div>

                  <div className="text-sm font-semibold text-slate-200">
                    Active
                  </div>
                </div>
              </div>

              {loadingProfile && (
                <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-500">
                  Loading latest profile data...
                </div>
              )}

              {profileMessage && (
                <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  {profileMessage}
                </div>
              )}

              {profileError && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {profileError}
                </div>
              )}

              {isAdmin &&
                selectedMember.id !==
                  currentUser?.id && (
                  <>
                    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-white">
                          User Management
                        </h3>

                        <p className="mt-1 text-xs text-slate-600">
                          Administrator controls
                        </p>
                      </div>

                      <label className="mb-2 block text-xs font-medium text-slate-500">
                        Change Role
                      </label>

                      <select
                        value={
                          selectedMember.role
                        }
                        onChange={
                          handleRoleChange
                        }
                        disabled={
                          changingRole
                        }
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none transition focus:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map(
                          (role) => (
                            <option
                              key={role}
                              value={role}
                            >
                              {
                                ROLE_LABELS[
                                  role
                                ]
                              }
                            </option>
                          )
                        )}
                      </select>

                      {changingRole && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Updating role...
                        </div>
                      )}
                    </div>

                    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-white">
                          Change Password
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Set a new password for this user. Their previous sessions will be signed out.
                        </p>
                      </div>

                      <form
                        onSubmit={
                          handleChangeUserPassword
                        }
                        className="space-y-4"
                      >
                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-500">
                            New Password
                          </label>

                          <div className="relative">
                            <input
                              type={
                                showNewUserPassword
                                  ? "text"
                                  : "password"
                              }
                              value={
                                newUserPassword
                              }
                              onChange={(event) =>
                                setNewUserPassword(
                                  event.target.value
                                )
                              }
                              placeholder="Minimum 8 characters"
                              autoComplete="new-password"
                              minLength={8}
                              maxLength={128}
                              disabled={
                                changingPassword
                              }
                              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowNewUserPassword(
                                  (value) =>
                                    !value
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
                              tabIndex={-1}
                            >
                              {showNewUserPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-500">
                            Confirm New Password
                          </label>

                          <div className="relative">
                            <input
                              type={
                                showConfirmUserPassword
                                  ? "text"
                                  : "password"
                              }
                              value={
                                confirmUserPassword
                              }
                              onChange={(event) =>
                                setConfirmUserPassword(
                                  event.target.value
                                )
                              }
                              placeholder="Repeat the new password"
                              autoComplete="new-password"
                              minLength={8}
                              maxLength={128}
                              disabled={
                                changingPassword
                              }
                              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmUserPassword(
                                  (value) =>
                                    !value
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
                              tabIndex={-1}
                            >
                              {showConfirmUserPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={
                            changingPassword
                          }
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {changingPassword ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Changing Password...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              Change Password
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-red-400">
                          Danger Zone
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Permanently delete this user from DevHayat. This action cannot be undone.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleDeleteUser
                        }
                        disabled={
                          deletingUser
                        }
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingUser ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Deleting User...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete User
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

              {selectedMember.id ===
                currentUser?.id && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs leading-5 text-slate-600">
                  This is your own account. You cannot change or delete your own account from this page.
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setProfileError("");
                  setProfileMessage("");
                  setNewUserPassword("");
                  setConfirmUserPassword("");
                }}
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}