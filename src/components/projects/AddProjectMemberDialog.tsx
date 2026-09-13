"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, X, Loader2 } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AddProjectMemberDialogProps = {
  projectId: string;
  currentMemberIds: string[];
  onAdded: () => void;
};

function formatRole(role: string) {
  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AddProjectMemberDialog({
  projectId,
  currentMemberIds,
  onAdded,
}: AddProjectMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      setError("");

      const response = await fetch("/api/users", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load users."
        );
      }

      setUsers(data.users ?? []);
    } catch (error) {
      console.error("Load users error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load users."
      );
    } finally {
      setLoadingUsers(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setSearch("");
    setSelectedUserId("");
    setError("");
    setSuccess("");

    loadUsers();
  }

  function handleClose() {
    if (adding) return;

    setOpen(false);
    setSearch("");
    setSelectedUserId("");
    setError("");
    setSuccess("");
  }

  async function handleAddMember() {
    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/projects/${projectId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add member."
        );
      }

      setSuccess("Member added successfully.");

      setSelectedUserId("");

      onAdded();

      setTimeout(() => {
        setOpen(false);
        setSuccess("");
      }, 700);
    } catch (error) {
      console.error("Add member error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to add member."
      );
    } finally {
      setAdding(false);
    }
  }

  const availableUsers = useMemo(() => {
    const memberIds = new Set(currentMemberIds);

    return users
      .filter((user) => !memberIds.has(user.id))
      .filter((user) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
        );
      });
  }, [users, currentMemberIds, search]);

  const selectedUser = users.find(
    (user) => user.id === selectedUserId
  );

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open, adding]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-violet-500 active:scale-[0.98]"
      >
        <UserPlus size={16} />
        Add Member
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Add Project Member
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Select a user to add to this project.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={adding}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Search users
                </label>

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search by name, email or role..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/70 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Available users
                </label>

                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-10 text-slate-500">
                      <Loader2
                        size={20}
                        className="animate-spin"
                      />
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-800 px-4 py-8 text-center">
                      <p className="text-sm text-slate-500">
                        No available users found.
                      </p>
                    </div>
                  ) : (
                    availableUsers.map((user) => {
                      const selected =
                        selectedUserId === user.id;

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() =>
                            setSelectedUserId(user.id)
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-violet-500/60 bg-violet-500/10"
                              : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-400">
                            {user.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {user.name}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {user.email}
                            </p>

                            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-violet-400/80">
                              {formatRole(user.role)}
                            </p>
                          </div>

                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-violet-500 bg-violet-500"
                                : "border-slate-700"
                            }`}
                          >
                            {selected && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedUser && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Selected member
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">
                    {selectedUser.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {selectedUser.email}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
                  {success}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={adding}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddMember}
                disabled={
                  adding ||
                  loadingUsers ||
                  !selectedUserId
                }
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Add Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
