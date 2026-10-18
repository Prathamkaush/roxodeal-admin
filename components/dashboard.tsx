"use client";
import { appHref } from "@/lib/app-links";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  ArrowRight,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Package,
  Clock3,
  TrendingUp,
} from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { type Role } from "@/lib/data";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/marketplace";
import { PageHeading } from "@/components/page-heading";
export function AdminDashboard() {
  const role = "admin" as Role;
  const { state } = useMarketplace();
  const pendingKyc = state.sellers.filter(
    (s) => s.kyc === "Under Review",
  ).length;
  const stats = [
    {
      label: "Registered suppliers",
      value: state.sellers.length,
      detail: `${state.sellers.filter((s) => s.kyc === "Approved").length} verified businesses`,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Total requirements",
      value: state.leads.length,
      detail: `${state.leads.filter((l) => l.status === "Pending").length} awaiting review`,
      icon: FileText,
      tone: "amber",
    },
    {
      label: "Active listings",
      value: state.products.filter((p) => p.status === "Active").length,
      detail: "Across all suppliers",
      icon: Package,
      tone: "green",
    },
    {
      label: "Pending reviews",
      value:
        pendingKyc +
        state.claims.filter((c) => c.status === "Under Review").length,
      detail: "KYC and protection claims",
      icon: ShieldCheck,
      tone: "violet",
    },
  ];
  return (
    <>
      <PageHeading
        title={"Marketplace overview"}
        description={
          "A clear view of your marketplace, business activity, and pending reviews."
        }
        action={
          <Button asChild>
            <Link href={"/admin/reports"}>
              {<BarIcon />} {"View reports"}
            </Link>
          </Button>
        }
      />
      <div className="ms-stat-grid">
        {stats.map((s) => (
          <div className="ms-stat" key={s.label}>
            <div className="ms-stat-label">
              {s.label}
              <span className={"ms-stat-icon " + s.tone}>
                <s.icon size={19} />
              </span>
            </div>
            <strong>{s.value}</strong>
            <small>{s.detail}</small>
          </div>
        ))}
      </div>
      <div className="ms-dashboard-grid">
        <div>
          <section className="ms-card">
            <div className="ms-card-heading">
              <div>
                <h2>{"Requirement activity"}</h2>
                <p>{"Keep your sourcing and supplier connections in view."}</p>
              </div>
              <Link href={"/admin/leads"}>
                View all <ArrowRight size={15} />
              </Link>
            </div>
            {
              <div className="ms-table-wrap">
                <table className="ms-table">
                  <thead>
                    <tr>
                      <th>Requirement</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Connections</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.leads
                      .filter((l) => true)
                      .slice(0, 4)
                      .map((l) => (
                        <tr key={l.id}>
                          <td>
                            <Link href={"/admin/leads"}>
                              <strong>{l.title}</strong>
                              <small>
                                {l.id} · {l.city}
                              </small>
                            </Link>
                          </td>
                          <td>{money(l.budget)}</td>
                          <td>
                            <Badge
                              tone={l.status === "Pending" ? "amber" : "green"}
                            >
                              {l.status}
                            </Badge>
                          </td>
                          <td>{l.purchases.length} / 5</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            }
          </section>
          <section className="ms-card ms-activity-card">
            <div className="ms-card-heading">
              <h2>Recent activity</h2>
              <Badge>Preview</Badge>
            </div>
            {state.activity.slice(0, 4).map((a, i) => (
              <div className="ms-activity" key={i}>
                <span>
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <p>{a}</p>
                  <small>Marketplace update</small>
                </div>
              </div>
            ))}
          </section>
        </div>
        <div className="ms-dashboard-aside">
          {
            <section className="ms-plan-card">
              <ShieldCheck size={34} />
              <h2>{"Review centre"}</h2>
              <p>
                {"Give every business and claim a considered, manual review."}
              </p>
              <Button asChild>
                <Link href={"/admin/kyc"}>
                  {"Review seller KYC"}
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </section>
          }
          <section className="ms-card">
            <h2>{"Needs your attention"}</h2>
            {
              <>
                <Link
                  className="ms-attention"
                  href={appHref("admin", "/admin/kyc")}
                >
                  <Clock3 size={17} /> Pending KYC{" "}
                  <Badge tone="amber">{pendingKyc}</Badge>
                </Link>
                <Link
                  className="ms-attention"
                  href={appHref("admin", "/admin/claims")}
                >
                  <ShieldCheck size={17} /> Open claims{" "}
                  <Badge tone="amber">
                    {
                      state.claims.filter((c) => c.status === "Under Review")
                        .length
                    }
                  </Badge>
                </Link>
                <Link
                  className="ms-attention"
                  href={appHref("admin", "/admin/leads")}
                >
                  <FileText size={17} /> Pending leads{" "}
                  <Badge tone="amber">
                    {state.leads.filter((l) => l.status === "Pending").length}
                  </Badge>
                </Link>
              </>
            }
          </section>
          <div className="ms-help-card">
            <div className="ms-help-icon">
              <TrendingUp />
            </div>
            <h3>Grow together with Roxodeal</h3>
            <p>Direct connections. Relevant opportunities. Better business.</p>
            <Link href={appHref("buyer", "/suppliers")}>
              Explore the marketplace →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
function BarIcon() {
  return <ArrowUpRight size={17} />;
}
