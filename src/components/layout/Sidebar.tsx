"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckSquare,
  CircleAlert,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Issues",
    href: "/issues",
    icon: CircleAlert,
  },
  {
    name: "My Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Sprints",
    href: "/sprints",
    icon: ListTodo,
  },
];

function formatRole(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administrator";

    case "PROJECT_MANAGER":
      return "Project Manager";

    case "DEVELOPER":
      return "Developer";

    case "DESIGNER":
      return "Designer";

    case "MEMBER":
      return "Member";

    default:
      return "User";
  }
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return parts
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  async function loadUser() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data?.success && data?.authenticated && data?.user) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to load current user:", error);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initializeUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data?.success && data?.authenticated && data?.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        if (mounted) {
          console.error(
            "Failed to initialize current user:",
            error
          );

          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    initializeUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);

    loadUser();
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  }

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-[#070a17] px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <Sparkles className="h-5 w-5 text-violet-400" />

          <span className="text-base font-bold tracking-tight text-white">
            Dev
            <span className="text-violet-400">
              Hayat
            </span>
          </span>
        </Link>

        <div className="h-9 w-9" />
      </header>

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col bg-[#070a17] text-white transition-transform duration-200 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex h-16 shrink-0 items-center px-5">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="group flex min-w-0 items-center gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-400 transition-transform duration-200 group-hover:scale-110" />
            </div>

            <div className="min-w-0">
              <div className="text-lg font-bold tracking-tight text-white">
                Dev
                <span className="text-violet-400">
                  Hayat
                </span>
              </div>

              <div className="mt-0.5 truncate text-[9px] font-medium uppercase tracking-[0.16em] text-slate-600">
                Engineering Workspace
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-900 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-violet-500/10 text-white"
                      : "text-slate-500 hover:bg-slate-900/70 hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-400" />
                  )}

                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? "text-violet-400"
                        : "text-slate-600 group-hover:text-slate-400"
                    }`}
                  />

                  <span className="truncate">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 p-3">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className={`mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-violet-500/10 text-white"
                : "text-slate-500 hover:bg-slate-900/70 hover:text-slate-200"
            }`}
          >
            <Settings
              className={`h-4 w-4 shrink-0 ${
                pathname.startsWith("/settings")
                  ? "text-violet-400"
                  : "text-slate-600"
              }`}
            />

            <span>Settings</span>
          </Link>

          {loadingUser && (
            <div className="flex items-center gap-3 rounded-lg bg-slate-900/40 px-3 py-2.5">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-800" />

              <div className="min-w-0 flex-1">
                <div className="h-2.5 w-20 animate-pulse rounded bg-slate-800" />

                <div className="mt-1.5 h-2 w-14 animate-pulse rounded bg-slate-800" />
              </div>
            </div>
          )}

          {!loadingUser && user && (
            <div className="rounded-lg bg-slate-900/40 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[11px] font-bold text-violet-400">
                  {getInitials(user.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-semibold text-white"
                    title={user.name}
                  >
                    {user.name}
                  </p>

                  <p
                    className="truncate text-[10px] text-slate-500"
                    title={user.email}
                  >
                    {user.email}
                  </p>

                  <p className="mt-0.5 truncate text-[9px] font-medium uppercase tracking-wide text-violet-400/80">
                    {formatRole(user.role)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  title="Logout"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {!loadingUser && !user && (
            <div className="rounded-lg bg-slate-900/40 p-3">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-400">
                  G
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-300">
                    Guest
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-600">
                    Guest User
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-violet-500 px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-violet-600"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-md border border-slate-700 px-2 py-2 text-[10px] font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}