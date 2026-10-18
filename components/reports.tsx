"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, CreditCard, RefreshCw } from "lucide-react";
import { Badge } from "./marketplace";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { money } from "@/lib/utils";
import { PageHeading } from "./page-heading";
import { Button } from "./ui/button";
import { TableShimmer } from "./list-tools";
export function AdminReports() {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const query = useQuery({
    queryKey: ["admin-reports", from, to],
    queryFn: () =>
      api(
        "/admin/reports?" +
          new URLSearchParams({
            ...(from ? { from } : {}),
            ...(to ? { to: to + "T23:59:59.999Z" } : {}),
          }),
      ),
    enabled: !from || !to || from <= to,
    refetchInterval: 30000,
  });
  const r = query.data;
  const invalidRange = Boolean(from && to && from > to);
  const metrics = r
    ? {
        Buyers: r.buyers,
        Sellers: r.sellers,
        Products: r.products,
        "Active subscriptions": r.activeSubscriptions,
        "Lead purchases": r.purchases.length,
        Transactions: r.transactions,
        "Total revenue": money(r.totalRevenuePaise / 100),
      }
    : {};
  return (
    <div className="ms-reports">
      <PageHeading
        title="Reports & analytics"
        description="Payment revenue and marketplace activity from your database."
      />
      <div className="ms-card ms-report-filters">
        <div className="ms-form-grid">
          <label className="ms-field">
            From
            <input
              type="date"
              max={to || undefined}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="ms-field">
            To
            <input
              type="date"
              min={from || undefined}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <div className="ms-report-filter-footer">
          <span>Choose a date range to review revenue and activity.</span>
          <Button
            variant="outline"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Reset dates
          </Button>
        </div>
      </div>
      {invalidRange ? (
        <div className="ms-card" role="alert">
          The end date must be on or after the start date.
        </div>
      ) : query.error ? (
        <div className="ms-card" role="alert">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry reports
          </Button>
        </div>
      ) : !r ? (
        <div className="ms-card">
          <TableShimmer columns={4} />
        </div>
      ) : (
        <>
          <div className="ms-report-metrics">
            {Object.entries(metrics).map(([k, v]) => (
              <div className="ms-card ms-report-metric" key={k}>
                <small>{k}</small>
                <strong>{String(v)}</strong>
              </div>
            ))}
          </div>
          <div className="ms-report-grid">
            <section className="ms-card">
              <h2>Revenue by service</h2>
              <p className="ms-report-subtitle">
                Captured payments across marketplace services.
              </p>
              {Object.entries(r.revenuePaise).map(([k, v]) => (
                <div className="ms-revenue-service" key={k}>
                  <div>
                    <span>
                      {(
                        {
                          LEAD: "Lead purchases",
                          SUBSCRIPTION: "Subscriptions",
                          PROTECTION: "Buyer protection",
                        } as Record<string, string>
                      )[k] || k}
                    </span>
                    <strong>{money(Number(v) / 100)}</strong>
                  </div>
                  <progress
                    aria-label={k + " share of revenue"}
                    max={Math.max(1, r.totalRevenuePaise)}
                    value={Number(v)}
                  />
                </div>
              ))}
              {!Object.keys(r.revenuePaise).length && (
                <p className="ms-list-empty">
                  No service revenue in this period.
                </p>
              )}
            </section>
            <section className="ms-card">
              <h2>Monthly revenue</h2>
              <p className="ms-report-subtitle">
                Revenue collected each month in the selected period.
              </p>
              {Object.keys(r.monthlyRevenuePaise).length ? (
                <div className="ms-table-wrap">
                  <table className="ms-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(r.monthlyRevenuePaise)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([k, v]) => (
                          <tr key={k}>
                            <td>{k}</td>
                            <td>
                              <strong>{money(Number(v) / 100)}</strong>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ms-list-empty">
                  No payment revenue recorded in this period.
                </div>
              )}
            </section>
          </div>
          <div className="ms-card ms-report-export">
            <div>
              <h2>Download report</h2>
              <p className="ms-report-subtitle">
                Export the metrics for your selected date range.
              </p>
            </div>
            <Button
              onClick={() => {
                const rows = [
                  "Metric,Value",
                  ...Object.entries(r.revenuePaise).map(
                    ([k, v]) => `"${k}","${Number(v) / 100}"`,
                  ),
                  ...Object.entries(r.monthlyRevenuePaise).map(
                    ([k, v]) => `"${k}","${Number(v) / 100}"`,
                  ),
                  ...Object.entries(metrics).map(
                    ([k, v]) => `"${k}","${String(v).replaceAll('"', '""')}"`,
                  ),
                ];
                const url = URL.createObjectURL(
                  new Blob([rows.join("\n")], { type: "text/csv" }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "roxodeal-report.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
export function ServiceSettings() {
  const q = useQuery<Record<string, boolean>>({
    queryKey: ["system-status"],
    queryFn: () => api("/admin/system-status"),
    refetchInterval: 30000,
  });
  const services = [
    {
      key: "smtpConfigured",
      title: "Email delivery",
      Icon: Mail,
      description: "Account messages and marketplace email notifications.",
      href: "/admin/notifications",
      action: "View notifications",
    },
    {
      key: "smsConfigured",
      title: "SMS messaging",
      Icon: MessageSquare,
      description: "Mobile messages and account verification alerts.",
      href: "/admin/notifications",
      action: "View notifications",
    },
    {
      key: "paymentsConfigured",
      title: "Payment gateway",
      Icon: CreditCard,
      description: "Payments for subscriptions, leads, and buyer protection.",
      href: "/admin/payments",
      action: "View payment history",
    },
  ];
  return (
    <>
      <PageHeading
        title="Service settings"
        description="Monitor the services that keep your marketplace running."
        action={
          <Button
            variant="outline"
            disabled={q.isFetching}
            onClick={() => void q.refetch()}
          >
            <RefreshCw size={16} />
            {q.isFetching ? "Checking..." : "Refresh status"}
          </Button>
        }
      />
      {q.error && (
        <div className="ms-card" role="alert">
          <p>{q.error.message}</p>
          <Button variant="outline" onClick={() => void q.refetch()}>
            Retry connection
          </Button>
        </div>
      )}
      <div className="ms-service-grid" aria-busy={q.isFetching}>
        {services.map(({ key, title, Icon, description, href, action }) => (
          <section className="ms-card ms-service-card" key={key}>
            <div className="ms-service-card-heading">
              <span className="ms-service-icon">
                <Icon size={24} />
              </span>
              {q.isPending ? (
                <span
                  className="ms-shimmer ms-service-status-shimmer"
                  aria-label="Checking service status"
                />
              ) : q.data ? (
                <Badge tone={q.data[key] ? "green" : "amber"}>
                  {q.data[key] ? "Configured" : "Setup required"}
                </Badge>
              ) : (
                <Badge>Status unavailable</Badge>
              )}
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
            <div className="ms-service-status-note">
              {q.isPending
                ? "Checking connection settings..."
                : q.data
                  ? q.data[key]
                    ? "Connection settings are present."
                    : "Service connection settings are missing. Contact your system administrator to complete setup."
                  : "Refresh to check this service."}
            </div>
            <Link className="ms-service-link" href={href}>
              {action}
            </Link>
          </section>
        ))}
      </div>
      <section className="ms-card ms-service-rules">
        <h2>Marketplace rules</h2>
        <ul>
          <li>One lead credit unlocks one buyer contact.</li>
          <li>Up to five suppliers can unlock each lead.</li>
          <li>KYC submissions and claims require admin review.</li>
        </ul>
      </section>
    </>
  );
}
