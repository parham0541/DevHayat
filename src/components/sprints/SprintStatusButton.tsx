"use client";

import { useState } from "react";
import {
  Check,
  Circle,
  Clock3,
  Loader2,
} from "lucide-react";

type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

type Props = {
  sprintId: string;
  status: SprintStatus;
  onUpdated: () => void;
};

const statusConfig: Record<
  SprintStatus,
  {
    label: string;
    icon: typeof Circle;
    className: string;
  }
> = {
  PLANNED: {
    label: "Planned",
    icon: Circle,
    className:
      "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200",
  },

  ACTIVE: {
    label: "Active",
    icon: Clock3,
    className:
      "border-blue-500/30 text-blue-400 hover:border-blue-400 hover:text-blue-300",
  },

  COMPLETED: {
    label: "Completed",
    icon: Check,
    className:
      "border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:text-emerald-300",
  },
};

function getNextStatus(
  status: SprintStatus
): SprintStatus {
  if (status === "PLANNED") {
    return "ACTIVE";
  }

  if (status === "ACTIVE") {
    return "COMPLETED";
  }

  return "PLANNED";
}

export default function SprintStatusButton({
  sprintId,
  status,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = statusConfig[status];
  const Icon = config.icon;

  async function handleClick() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextStatus = getNextStatus(status);

      const response = await fetch(
        `/api/sprints/${sprintId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update sprint status"
        );
      }

      onUpdated();
    } catch (error) {
      console.error(
        "Sprint status update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update sprint status"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={`${config.label} - Click to change status`}
        aria-label={`${config.label} - Click to change status`}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${config.className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}

        <span>{config.label}</span>
      </button>

      {error && (
        <p className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-red-500/20 bg-red-950/90 p-2 text-xs text-red-300 shadow-xl">
          {error}
        </p>
      )}
    </div>
  );
}
