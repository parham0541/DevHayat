"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
ArrowRight,
Check,
Eye,
EyeOff,
Loader2,
Lock,
Mail,
ShieldCheck,
Sparkles,
} from "lucide-react";

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [showPassword, setShowPassword] = useState(false);
const [rememberMe, setRememberMe] = useState(false);

const [loading, setLoading] = useState(false);
const [checkingSession, setCheckingSession] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
const checkSession = async () => {
try {
const response = await fetch("/api/auth/me", {
method: "GET",
cache: "no-store",
});

    if (response.ok) {
      router.replace("/");
      return;
    }
  } catch {
    // Session check failed silently.
  } finally {
    setCheckingSession(false);
  }
};

checkSession();


}, [router]);

const handleSubmit = async (
event: FormEvent<HTMLFormElement>
) => {
event.preventDefault();

if (loading) {
  return;
}

setError("");
setLoading(true);

try {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    setError(
      data.message || "Invalid email or password."
    );
    return;
  }

  router.replace("/");
  router.refresh();
} catch {
  setError(
    "Unable to connect to the server. Please try again."
  );
} finally {
  setLoading(false);
}


};

if (checkingSession) {
return ( <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] text-white"> <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.12),transparent_45%)]" />


    <div className="relative flex items-center gap-3 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      Checking session...
    </div>
  </main>
);

}

return ( <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-10 text-white">

  {/* Background */}
  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    {/* Grid */}
    <div
      className="absolute inset-0 opacity-[0.035]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />

    {/* Glow 1 */}
    <div className="absolute left-[10%] top-[10%] h-72 w-72 animate-pulse rounded-full bg-blue-600/10 blur-3xl" />

    {/* Glow 2 */}
    <div
      className="absolute bottom-[5%] right-[5%] h-80 w-80 animate-pulse rounded-full bg-violet-600/10 blur-3xl"
      style={{ animationDelay: "1s" }}
    />

    {/* Glow 3 */}
    <div
      className="absolute left-[45%] top-[45%] h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl"
      style={{
        animation: "pulse 4s ease-in-out infinite",
      }}
    />

    {/* Floating particles */}
    <span
      className="absolute left-[15%] top-[30%] h-1 w-1 animate-ping rounded-full bg-blue-400"
      style={{ animationDuration: "3s" }}
    />

    <span
      className="absolute right-[20%] top-[20%] h-1 w-1 animate-ping rounded-full bg-violet-400"
      style={{ animationDuration: "4s" }}
    />

    <span
      className="absolute bottom-[25%] left-[25%] h-1 w-1 animate-ping rounded-full bg-cyan-400"
      style={{ animationDuration: "3.5s" }}
    />

    <span
      className="absolute bottom-[15%] right-[30%] h-1 w-1 animate-ping rounded-full bg-blue-400"
      style={{ animationDuration: "5s" }}
    />
  </div>

  {/* Main Content */}
  <div className="relative z-10 w-full max-w-md">

    {/* Logo */}
    <div
      className="mb-8 text-center"
      style={{
        animation:
          "fadeInDown 0.7s ease-out both",
      }}
    >
      <Link
        href="/"
        className="group inline-flex flex-col items-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 shadow-xl shadow-blue-950/20 backdrop-blur transition duration-500 group-hover:-translate-y-1 group-hover:border-slate-600 group-hover:shadow-blue-900/30">
          <Sparkles className="h-6 w-6 text-white transition duration-500 group-hover:rotate-12" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          DevHayat
        </h1>

        <p className="mt-2 text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
          Project Management Platform
        </p>
      </Link>
    </div>

    {/* Card */}
    <div
      className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/75 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
      style={{
        animation:
          "fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >

      {/* Card top glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl transition duration-700 group-hover:bg-blue-500/15" />

      {/* Border shine */}
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/50 to-transparent" />

      {/* Header */}
      <div className="relative mb-7">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
          Secure workspace
        </div>

        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sign in to continue to your DevHayat workspace.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300"
          style={{
            animation:
              "shake 0.35s ease-in-out",
          }}
        >
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />

          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="relative space-y-5"
      >

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Email
          </label>

          <div className="group/input relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition duration-300 group-focus-within/input:text-slate-300" />

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              required
              disabled={loading}
              className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-11 pr-4 text-sm text-white outline-none transition duration-300 placeholder:text-slate-700 hover:border-slate-700 focus:border-slate-600 focus:bg-slate-950 focus:ring-4 focus:ring-slate-800/30 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300"
            >
              Password
            </label>

            <span className="text-xs text-slate-700">
              Recovery coming soon
            </span>
          </div>

          <div className="group/input relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition duration-300 group-focus-within/input:text-slate-300" />

            <input
              id="password"
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              required
              disabled={loading}
              className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-11 pr-12 text-sm text-white outline-none transition duration-300 placeholder:text-slate-700 hover:border-slate-700 focus:border-slate-600 focus:bg-slate-950 focus:ring-4 focus:ring-slate-800/30 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              disabled={loading}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 transition duration-300 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setRememberMe(
                (value) => !value
              )
            }
            disabled={loading}
            className="group/remember flex items-center gap-2"
            aria-pressed={rememberMe}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-md border transition duration-300 ${
                rememberMe
                  ? "border-white bg-white text-slate-950"
                  : "border-slate-700 bg-slate-950 text-transparent group-hover/remember:border-slate-500"
              }`}
            >
              <Check
                className="h-3 w-3"
                strokeWidth={3}
              />
            </span>

            <span className="text-xs text-slate-500 transition group-hover/remember:text-slate-300">
              Remember me
            </span>
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="group/button relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white text-sm font-semibold text-slate-950 shadow-lg shadow-white/5 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-xl hover:shadow-white/10 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
        >
          {/* Button shine */}
          {!loading && (
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition duration-700 group-hover/button:translate-x-full" />
          )}

          {loading ? (
            <>
              <Loader2 className="relative h-4 w-4 animate-spin" />
              <span className="relative">
                Signing in...
              </span>
            </>
          ) : (
            <>
              <span className="relative">
                Sign In
              </span>

              <ArrowRight className="relative h-4 w-4 transition duration-300 group-hover/button:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Register */}
      <div className="relative mt-7 border-t border-slate-800 pt-6 text-center">
        <p className="text-sm text-slate-500">
          Don't have an account?
        </p>

        <Link
          href="/register"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white transition duration-300 hover:text-slate-300"
        >
          Create an account
          <ArrowRight className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>

    {/* Footer */}
    <div
      className="mt-6 text-center"
      style={{
        animation:
          "fadeIn 1s ease-out 0.4s both",
      }}
    >
      <p className="text-xs text-slate-700">
        © 2026 DevHayat. All rights reserved.
      </p>
    </div>
  </div>

  {/* Animations */}
  <style jsx>{`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(24px) scale(0.98);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-16px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes shake {
      0%,
      100% {
        transform: translateX(0);
      }

      25% {
        transform: translateX(-5px);
      }

      75% {
        transform: translateX(5px);
      }
    }
  `}</style>
</main>

);
}
