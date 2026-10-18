"use client";
import {
  FinancialActivity,
  ProtectionWorkspace,
  KycWorkspace,
  BuyerManagement,
  CategoryManagement,
  Documents,
} from "./live-workspace";
import Link from "next/link";
import { RecordList } from "./list-tools";
import { KycReviews } from "./kyc-review";
import { CmsEditor } from "./cms-editor";
import { CreateRecord } from "./create-record";
import { AdminReports, ServiceSettings } from "./reports";
import { action } from "@/lib/api";
import { ShieldCheck, Download, ArrowRight, CheckCircle2 } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { categories, type Role } from "@/lib/data";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/marketplace";
import { PageHeading } from "@/components/page-heading";
import { Empty } from "@/components/empty";
import { AdminLeadList } from "./leads-list";
import { AdminDashboard } from "./dashboard";
import { AdminClaims } from "./claims";
import { AdminPlans } from "./plans";
export function AdminPanel({ path }: { path: string[] }) {
  const role = "admin" as Role;
  const { state, update, notify, refresh, ready } = useMarketplace();
  const section = path[0] || "dashboard";
  const seller = state.sellers[0];
  if (section === "dashboard") return <AdminDashboard />;
  if (section === "leads")
    return (
      <>
        <PageHeading
          title={"Lead management"}
          description={
            "Approve requirements, set prices, and manage supplier access."
          }
        />

        <CreateRecord kind="lead" />
        <AdminLeadList purchased={path[1] === "purchased"} />
      </>
    );
  if (section === "products") {
    const list = state.products;
    return (
      <>
        <PageHeading
          title={"Product listings"}
          description="Manage catalogue visibility and product information."
        />
        <RecordList
          key="products"
          label="Products"
          items={list}
          loading={!ready}
          columns={6}
          searchText={(p) =>
            [
              p.name,
              p.category,
              state.sellers.find((s) => s.id === p.sellerId)?.company,
              state.sellers.find((s) => s.id === p.sellerId)?.name,
            ].join(" ")
          }
          filters={[
            { label: "Status", value: (p) => p.status },
            { label: "Category", value: (p) => p.category },
            {
              label: "Seller",
              value: (p) =>
                state.sellers.find((s) => s.id === p.sellerId)?.company ||
                "Unknown supplier",
            },
          ]}
        >
          {(rows) => (
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={"/products/" + p.id}
                        className="ms-table-product"
                      >
                        <img src={p.image} alt="" />
                        <strong>{p.name}</strong>
                      </Link>
                    </td>
                    <td>
                      <strong>
                        {state.sellers.find((s) => s.id === p.sellerId)
                          ?.company || "Unknown supplier"}
                      </strong>
                      <small>
                        {state.sellers.find((s) => s.id === p.sellerId)?.name}
                      </small>
                    </td>
                    <td>{p.category}</td>
                    <td>{money(p.price)}</td>
                    <td>
                      <Badge tone={p.status === "Active" ? "green" : ""}>
                        {p.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="ms-table-actions">
                        <button
                          onClick={() =>
                            update((s) => ({
                              ...s,
                              products: s.products.map((x) =>
                                x.id === p.id
                                  ? {
                                      ...x,
                                      status:
                                        x.status === "Active"
                                          ? "Inactive"
                                          : "Active",
                                    }
                                  : x,
                              ),
                            }))
                          }
                        >
                          {p.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </RecordList>
      </>
    );
  }
  if (section === "kyc") return <KycReviews />;
  if (section === "subscription" || section === "subscriptions")
    return (
      <>
        <PageHeading
          title={"Subscription plans"}
          description="Listing limits and lead credits that fit your business. Monthly plans."
        />
        <CreateRecord kind="plan" />
        <AdminPlans />
      </>
    );
  if (section === "sellers")
    return (
      <>
        <PageHeading
          title="Supplier management"
          description="Verification, subscription plans, and business visibility."
        />
        <CreateRecord kind="seller" />
        <RecordList
          key="sellers"
          label="Suppliers"
          items={state.sellers}
          loading={!ready}
          columns={6}
          searchText={(s) =>
            [s.company, s.name, s.city, s.email, s.phone].join(" ")
          }
          filters={[
            { label: "KYC", value: (s) => s.kyc },
            { label: "Category", value: (s) => s.category },
            {
              label: "Account",
              value: (s) => (s.active ? "Active" : "Suspended"),
            },
          ]}
        >
          {(rows) => (
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>KYC</th>
                  <th>Plan</th>
                  <th>Credits</th>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link href={"/suppliers/" + s.id}>
                        <strong>{s.company}</strong>
                        <small>
                          {s.city} · {s.email}
                        </small>
                      </Link>
                    </td>
                    <td>{s.category}</td>
                    <td>
                      <Badge tone="green">{s.kyc}</Badge>
                    </td>
                    <td>
                      {state.plans.find((p) => p.id === s.plan)?.name ||
                        s.plan ||
                        "Free"}
                    </td>
                    <td>
                      <input
                        aria-label={"Credits for " + s.company}
                        className="ms-number-input"
                        min="0"
                        type="number"
                        defaultValue={s.credits}
                        onBlur={(e) => {
                          const credits = Math.max(0, Number(e.target.value));
                          update((st) => ({
                            ...st,
                            sellers: st.sellers.map((x) =>
                              x.id === s.id ? { ...x, credits } : x,
                            ),
                          }));
                        }}
                      />
                    </td>
                    <td>
                      <Button
                        onClick={async () => {
                          try {
                            await action("USER_REVIEW", s.userId, {
                              active: !s.active,
                            });
                            await refresh();
                          } catch (e) {
                            notify((e as Error).message);
                          }
                        }}
                      >
                        {s.active ? "Suspend" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </RecordList>
      </>
    );
  if (section === "buyers") return <BuyerManagement />;
  if (section === "categories")
    return (
      <>
        <CreateRecord kind="category" />
        <CategoryManagement />
      </>
    );
  if (section === "claims") return <AdminClaims />;
  if (section === "protection") return <ProtectionWorkspace />;
  if (section === "refunds")
    return (
      <>
        <PageHeading
          title="Refund tracking"
          description="Track manually approved compensation and processing references."
        />
        <div className="ms-card">
          <table className="ms-table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Approved amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.claims
                .filter((c) => ["Approved", "Resolved"].includes(c.status))
                .map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{money(c.approvedAmount ?? c.amount)}</td>
                    <td>
                      <Badge tone="amber">
                        {c.status === "Resolved"
                          ? "Recorded as resolved"
                          : "Awaiting processing"}
                      </Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!state.claims.some((c) =>
            ["Approved", "Resolved"].includes(c.status),
          ) && (
            <Empty
              title="No approved compensation yet"
              description="Approved claims will appear here. No automatic refunds are issued."
            />
          )}
        </div>
      </>
    );
  if (section === "cms") return <CmsEditor />;
  if (section === "notifications")
    return (
      <>
        <PageHeading
          title="Notifications"
          description="Recent marketplace activity."
        />
        <CreateRecord kind="announcement" />
        <div className="ms-card">
          {state.activity.map((a, i) => (
            <div className="ms-activity" key={i}>
              <CheckCircle2 size={18} />
              <p>{a}</p>
            </div>
          ))}
        </div>
      </>
    );
  if (section === "reports") return <AdminReports />;
  if (section === "settings") return <ServiceSettings />;
  if (section === "payments" || section === "enquiries")
    return <FinancialActivity section={section} />;
  return <Empty title="Page not found" />;
}
