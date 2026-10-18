"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Search,
  X,
  FileText,
  Users,
  Package,
  ShieldCheck,
} from "lucide-react";
import { api, session } from "@/lib/api";
import { useMarketplace, type State } from "@/lib/store";
import { adminNavigation } from "./navigation";
import { TableShimmer } from "./list-tools";
import { Button } from "./ui/button";

function AdminSearch({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [term, setTerm] = useState("");
  const query = useQuery<State>({
    queryKey: ["workspace", session()?.user.id || "public", "full"],
    queryFn: () => api("/workspace"),
    staleTime: 30000,
  });
  useEffect(() => {
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  type Result = { title: string; detail: string; href: string; search: string };
  const results: Result[] = adminNavigation.map(([path, title]) => ({
    title,
    detail: "Admin page",
    href: `/admin/${path}`,
    search: title,
  }));
  const add = (
    section: string,
    title: string,
    detail: string,
    fields: Array<string | undefined | null>,
    filter = title,
  ) => {
    results.push({
      title,
      detail,
      href: `/admin/${section}?q=${encodeURIComponent(filter)}`,
      search: [title, detail, ...fields].join(" "),
    });
  };
  if (term.trim() && query.data) {
    const state = query.data;
    state.leads.forEach((item) =>
      add("leads", item.title, `Lead · ${item.buyerName}`, [
        item.id,
        item.email,
        item.city,
        item.category,
      ]),
    );
    state.buyers.forEach((item) =>
      add("buyers", item.name, `Buyer · ${item.company}`, [
        item.id,
        item.email,
        item.phone,
        item.city,
      ]),
    );
    state.sellers.forEach((item) =>
      add("sellers", item.company, `Supplier · ${item.name}`, [
        item.id,
        item.email,
        item.phone,
        item.city,
      ]),
    );
    state.products.forEach((item) =>
      add("products", item.name, `Product · ${item.category}`, [
        item.id,
        state.sellers.find((seller) => seller.id === item.sellerId)?.company,
      ]),
    );
    state.categories.forEach((item) =>
      add("categories", item.name, "Category", [item.id]),
    );
    state.payments.forEach((item) =>
      add(
        "payments",
        item.gatewayPaymentId || item.id,
        `Payment · ${item.payerName || item.type}`,
        [item.id, item.payerEmail, item.type, item.planName],
      ),
    );
  }
  const matches = results.filter((item) =>
    item.search.toLowerCase().includes(term.trim().toLowerCase()),
  );
  return (
    <dialog
      ref={dialog}
      className="ms-admin-search-dialog"
      aria-labelledby="admin-search-title"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          dialog.current?.close();
        }
      }}
    >
      <div className="ms-admin-tool-heading">
        <h2 id="admin-search-title">Search admin panel</h2>
        <button
          className="ms-dialog-close"
          aria-label="Close admin search"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} />
        </button>
      </div>
      <label className="ms-field">
        Search pages and records
        <input
          type="search"
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search leads, buyers, suppliers, products..."
        />
      </label>
      {query.isPending && term.trim() ? (
        <TableShimmer columns={2} />
      ) : (
        <>
          {query.error && (
            <div role="alert" className="ms-search-error">
              <p>
                Records could not be loaded. You can still search admin pages.
              </p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Retry records
              </Button>
            </div>
          )}
          <p className="ms-admin-search-summary" role="status">
            {term.trim()
              ? `${matches.length} matches${matches.length > 40 ? " (showing first 40)" : ""}`
              : "Quick access to admin pages"}
          </p>
          <div className="ms-admin-search-results">
            {matches.slice(0, 40).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => dialog.current?.close()}
              >
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </Link>
            ))}
          </div>
          {!matches.length && (
            <p className="ms-list-empty">No matching pages or records.</p>
          )}
        </>
      )}
    </dialog>
  );
}

export function AdminHeaderTools({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const { state } = useMarketplace();
  const pathname = usePathname();
  const [search, setSearch] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const bell = useRef<HTMLButtonElement>(null);
  const kyc =
    state.kycReviewCount ??
    state.sellers.filter((seller) =>
      ["Submitted", "Under Review"].includes(seller.kyc),
    ).length;
  const groups = [
    {
      path: "leads",
      label: "New leads",
      count: counts.leads || 0,
      Icon: FileText,
    },
    {
      path: "buyers",
      label: "New buyers",
      count: counts.buyers || 0,
      Icon: Users,
    },
    {
      path: "sellers",
      label: "New suppliers",
      count: counts.sellers || 0,
      Icon: Users,
    },
    {
      path: "kyc",
      label: "KYC awaiting review",
      count: kyc,
      Icon: ShieldCheck,
    },
    {
      path: "products",
      label: "New products",
      count: counts.products || 0,
      Icon: Package,
    },
  ];
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  useEffect(() => {
    setNotifications(false);
    setSearch(false);
  }, [pathname]);
  useEffect(() => {
    if (!notifications) return;
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node))
        setNotifications(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotifications(false);
        bell.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [notifications]);
  return (
    <div className="ms-admin-header-tools" ref={wrapper}>
      <button
        className="ms-header-icon"
        aria-label="Search admin panel"
        onClick={() => {
          setNotifications(false);
          setSearch(true);
        }}
      >
        <Search size={20} />
      </button>
      <button
        ref={bell}
        className="ms-header-icon ms-notification-button"
        aria-label={`View notifications${total ? ` (${total})` : ""}`}
        aria-expanded={notifications}
        aria-controls="admin-notifications"
        onClick={() => setNotifications(!notifications)}
      >
        <Bell size={20} />
        {total > 0 && (
          <span className="ms-header-notification-count">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {notifications && (
        <section
          id="admin-notifications"
          className="ms-admin-notifications"
          aria-label="Admin notifications"
        >
          <div className="ms-admin-tool-heading">
            <h2>Notifications</h2>
            <button
              className="ms-dialog-close"
              aria-label="Close notifications"
              onClick={() => {
                setNotifications(false);
                bell.current?.focus();
              }}
            >
              <X size={18} />
            </button>
          </div>
          <p className="ms-admin-search-summary">
            New records since your last visit and pending KYC reviews.
          </p>
          {groups
            .filter((group) => group.count > 0)
            .map(({ path, label, count, Icon }) => (
              <Link
                key={path}
                href={`/admin/${path}`}
                onClick={() => setNotifications(false)}
              >
                <Icon size={20} />
                <strong>{label}</strong>
                <span className="ms-nav-count">{count}</span>
              </Link>
            ))}
          {!total && (
            <p className="ms-list-empty">
              You're all caught up. No new records or pending KYC reviews.
            </p>
          )}
        </section>
      )}
      {search && <AdminSearch onClose={() => setSearch(false)} />}
    </div>
  );
}
