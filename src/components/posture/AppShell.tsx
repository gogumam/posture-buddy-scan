import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Bluetooth, CalendarDays, Dumbbell, House } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "홈", icon: House },
  { to: "/connect", label: "연결", icon: Bluetooth },
  { to: "/pelvis", label: "측정", icon: Activity },
  { to: "/exercises", label: "운동", icon: Dumbbell },
  { to: "/history", label: "기록", icon: CalendarDays },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-sm sm:my-0 sm:min-h-screen">
      <main className="flex-1 pb-24">{children}</main>

      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 backdrop-blur"
      >
        <ul className="flex items-stretch">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-6", active && "stroke-[2.4]")} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
