"use client";
import { appHref } from "@/lib/app-links";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Globe,
  LifeBuoy,
} from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
import { useMarketplace } from "@/lib/store";
import type { Role } from "@/lib/data";
import { adminNavigation } from "@/components/navigation";
import { useNavigationCounts } from "@/lib/navigation-counts";
import { TableShimmer } from "./list-tools";
import { AdminHeaderTools } from "./admin-header-tools";
const navigation: ReadonlyArray<
  readonly [string, string, typeof LayoutDashboard]
> = adminNavigation;
export function PanelShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    state,
    setRole,
    ready,
    role: authenticatedRole,
    error,
    busy,
  } = useMarketplace();
  const [open, setOpen] = useState(false);
  const counts = useNavigationCounts(state, pathname, ready);
  const selected = [...navigation]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([p]) => pathname.startsWith("/" + role + "/" + p));
  if (!ready)
    return (
      <div className="ms-workspace-shimmer">
        <div className="ms-shimmer ms-heading-shimmer" />
        <div className="ms-card">
          <TableShimmer columns={6} />
        </div>
      </div>
    );
  if (authenticatedRole !== role)
    return (
      <div className="ms-card">
        <h1>Sign in required</h1>
        <p>Use your {role} account to access this workspace.</p>
        <Link href={"/login?next=" + encodeURIComponent(pathname)}>
          Sign in
        </Link>
      </div>
    );
  if (error)
    return (
      <div className="ms-card" role="alert">
        <h1>Unable to load your workspace</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  return (
    <div className="ms-panel">
      <aside className={"ms-sidebar " + (open ? "open" : "")}>
        <Brand />
        <button
          className="ms-close-sidebar"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <div className="ms-workspace-label">
          {role === "admin"
            ? "MARKETPLACE ADMIN"
            : role === "seller"
              ? "SUPPLIER WORKSPACE"
              : "BUYER WORKSPACE"}
        </div>
        <nav>
          {navigation.map(([path, label, Icon]) => (
            <Link
              key={path}
              href={"/" + role + "/" + path}
              className={selected?.[0] === path ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
              {role === "admin" && path in counts && (
                <span
                  className="ms-nav-count"
                  aria-label={`${counts[path]} new ${label.toLowerCase()}`}
                  title="New records since your last visit"
                >
                  {counts[path]}
                </span>
              )}
              {role === "admin" && path === "kyc" && (
                <span className="ms-nav-count">
                  {state.kycReviewCount ??
                    state.sellers.filter((s) =>
                      ["Submitted", "Under Review"].includes(s.kyc),
                    ).length}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="ms-sidebar-bottom">
          <div className="ms-support">
            <LifeBuoy size={20} />
            <strong>Here to help your business</strong>
            <Link href={appHref("buyer", "/contact")}>
              Contact support <ChevronRight size={13} />
            </Link>
          </div>
          <Link href={appHref("buyer", "/")}>
            <Globe size={16} /> Back to marketplace
          </Link>
          <button
            onClick={() => {
              setRole(null);
              router.push("/login");
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="ms-sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="ms-panel-body">
        <header className="ms-panel-header">
          <button
            className="ms-menu-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <div className="ms-header-actions ms-admin-header-actions">
            <AdminHeaderTools counts={counts} />
            <div className="ms-header-divider" />
            <div className="ms-avatar small">
              {role === "admin" ? "AD" : role === "seller" ? "NT" : "RM"}
            </div>
            <div className="ms-user-name">
              <strong>
                {role === "admin"
                  ? "Super Admin"
                  : role === "seller"
                    ? state.sellers[0].name
                    : state.profile.name}
              </strong>
              <small>
                {role === "admin"
                  ? "Marketplace administrator"
                  : role === "seller"
                    ? state.sellers[0].company
                    : state.profile.company}
              </small>
            </div>
          </div>
        </header>
        <main className="ms-panel-content" aria-busy={busy}>
          {children}
        </main>
        <footer className="ms-panel-footer">
          © 2026 Roxodeal <span>Built for serious trade.</span>
        </footer>
      </div>
    </div>
  );
}
