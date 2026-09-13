"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { FormEvent, useState } from "react";

type RegisterResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordValid = password.length >= 8;

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    passwordValid &&
    passwordsMatch &&
    acceptedTerms &&
    !loading;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    if (name.trim().length < 2) {
      setError(
        "Name must be at least 2 characters."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError(
        "Please accept the terms to continue."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data: RegisterResponse =
        await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Failed to create account."
        );
        return;
      }

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        router.replace("/login");
      }, 1000);
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-10 text-white">
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
          style={{
            animationDelay: "1s",
          }}
        />

        {/* Glow 3 */}
        <div
          className="absolute left-[45%] top-[45%] h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl"
          style={{
            animation:
              "pulse 4s ease-in-out infinite",
          }}
        />

        {/* Glow 4 */}
        <div
          className="absolute right-[35%] top-[8%] h-40 w-40 rounded-full bg-fuchsia-500/5 blur-3xl"
          style={{
            animation:
              "pulse 5s ease-in-out infinite",
          }}
        />

        {/* Floating particles */}
        <span
          className="absolute left-[15%] top-[30%] h-1 w-1 animate-ping rounded-full bg-blue-400"
          style={{
            animationDuration: "3s",
          }}
        />

        <span
          className="absolute right-[20%] top-[20%] h-1 w-1 animate-ping rounded-full bg-violet-400"
          style={{
            animationDuration: "4s",
          }}
        />

        <span
          className="absolute bottom-[25%] left-[25%] h-1 w-1 animate-ping rounded-full bg-cyan-400"
          style={{
            animationDuration: "3.5s",
          }}
        />

        <span
          className="absolute bottom-[15%] right-[30%] h-1 w-1 animate-ping rounded-full bg-blue-400"
          style={{
            animationDuration: "5s",
          }}
        />

        <span
          className="absolute left-[70%] top-[65%] h-1 w-1 animate-ping rounded-full bg-fuchsia-400"
          style={{
            animationDuration: "4.5s",
          }}
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
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl transition duration-500 group-hover:bg-violet-500/20" />

              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 shadow-xl shadow-blue-950/20 backdrop-blur transition duration-500 group-hover:-translate-y-1 group-hover:border-slate-600 group-hover:shadow-blue-900/30">
                <Sparkles className="h-6 w-6 text-white transition duration-500 group-hover:rotate-12" />
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              DevHayat
            </h1>

            <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
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
              Create your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Join DevHayat and start managing your
              software projects.
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
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="relative space-y-5"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Full Name
              </label>

              <div className="group/input relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition duration-300 group-focus-within/input:text-slate-300" />

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Parham Hayat"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);

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
                  Minimum 8 characters
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
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  required
                  minLength={8}
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

              <div className="mt-2.5 flex items-center gap-4">
                <PasswordCheck
                  active={passwordValid}
                  text="8+ characters"
                />

                <PasswordCheck
                  active={passwordsMatch}
                  text="Passwords match"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Confirm Password
              </label>

              <div className="group/input relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition duration-300 group-focus-within/input:text-slate-300" />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  required
                  minLength={8}
                  disabled={loading}
                  className={`h-12 w-full rounded-xl bg-slate-950/80 pl-11 pr-12 text-sm text-white outline-none transition duration-300 placeholder:text-slate-700 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                    confirmPassword.length > 0 &&
                    password !==
                      confirmPassword
                      ? "border border-red-900/60 focus:border-red-700/60 focus:ring-red-900/20"
                      : "border border-slate-800 hover:border-slate-700 focus:border-slate-600 focus:bg-slate-950 focus:ring-slate-800/30"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 transition duration-300 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {confirmPassword.length > 0 &&
                password !== confirmPassword && (
                  <p className="mt-2 text-xs text-red-400">
                    Passwords do not match.
                  </p>
                )}
            </div>

            {/* Terms */}
            <button
              type="button"
              onClick={() =>
                setAcceptedTerms(
                  (value) => !value
                )
              }
              disabled={loading}
              className="group flex w-full items-start gap-3 text-left"
              aria-pressed={acceptedTerms}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition duration-300 ${
                  acceptedTerms
                    ? "border-white bg-white text-slate-950"
                    : "border-slate-700 bg-slate-950 text-transparent group-hover:border-slate-500"
                }`}
              >
                <Check
                  className="h-3 w-3"
                  strokeWidth={3}
                />
              </span>

              <span className="text-xs leading-5 text-slate-500 transition group-hover:text-slate-400">
                I agree to the DevHayat{" "}
                <span className="text-slate-300">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-slate-300">
                  Privacy Policy
                </span>
                .
              </span>
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="group/button relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white text-sm font-semibold text-slate-950 shadow-lg shadow-white/5 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-xl hover:shadow-white/10 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
            >
              {!loading && canSubmit && (
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition duration-700 group-hover/button:translate-x-full" />
              )}

              {loading ? (
                <>
                  <Loader2 className="relative h-4 w-4 animate-spin" />

                  <span className="relative">
                    Creating account...
                  </span>
                </>
              ) : (
                <>
                  <span className="relative">
                    Create Account
                  </span>

                  <ArrowRight className="relative h-4 w-4 transition duration-300 group-hover/button:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Login */}
          <div className="relative mt-7 border-t border-slate-800 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?
            </p>

            <Link
              href="/login"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white transition duration-300 hover:text-slate-300"
            >
              Sign in to DevHayat
              <ArrowRight className="h-3.5 w-3.5 transition duration-300" />
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

function PasswordCheck({
  active,
  text,
}: {
  active: boolean;
  text: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs transition duration-300 ${
        active
          ? "text-emerald-400"
          : "text-slate-700"
      }`}
    >
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
          active
            ? "bg-emerald-500/10"
            : "bg-slate-800"
        }`}
      >
        <Check className="h-2.5 w-2.5" />
      </span>

      {text}
    </div>
  );
}