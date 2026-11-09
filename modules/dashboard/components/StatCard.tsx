import { ReactNode } from "react";
import { StatCard as KpiCard } from "@/components/ui/StatCard";

interface StatCardProps {
  label: string;
  /** The figure, or a placeholder element while it is still loading. */
  value: ReactNode;
  sub: string;
  icon: ReactNode;
  /** Icon tile classes (background + icon colour), e.g. "bg-brand-50 text-brand-600". */
  iconBg: string;
  href?: string;
}

/* Candidate KPI tile — a thin adapter over the shared components/ui/StatCard. */
export default function StatCard({ label, value, sub, icon, iconBg, href }: StatCardProps) {
  return <KpiCard label={label} value={value} sub={sub} icon={icon} iconClassName={iconBg} href={href} />;
}
