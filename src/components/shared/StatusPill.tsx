import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "pending"
  | "rejected"
  | "suspended"
  | "none"
  | "paid"
  | "sponsored"
  | "role_farmer"
  | "role_org_admin"
  | "role_org_staff"
  | "role_gov";

const statusStyles: Record<StatusVariant, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
  none: "bg-slate-100 text-slate-700 border-slate-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  sponsored: "bg-lime-100 text-lime-800 border-lime-200",
  role_farmer: "bg-emerald-100 text-emerald-800 border-emerald-200",
  role_org_admin: "bg-green-100 text-green-800 border-green-200",
  role_org_staff: "bg-teal-100 text-teal-800 border-teal-200",
  role_gov: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export function StatusPill({ label, variant, className }: { label: string; variant: StatusVariant; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        statusStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

