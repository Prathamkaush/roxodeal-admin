"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import type { Lead } from "@/lib/data";
import { action } from "@/lib/api";
import { money } from "@/lib/utils";
import { Badge } from "./marketplace";
import { Button } from "./ui/button";
import { RecordList } from "./list-tools";
import { LeadEditor } from "./lead-editor";

const reviewStatuses = ["Active", "Pending", "Rejected"];
const leadPrice = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
const date = (value: string) =>
  new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function LeadDetails({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { notify, refresh } = useMarketplace();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="ms-lead-dialog"
      aria-labelledby="lead-detail-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            event.currentTarget.close();
        }
      }}
    >
      <header className="ms-lead-dialog-heading">
        <div>
          <small>{lead.id}</small>
          <h2 id="lead-detail-title">{lead.title}</h2>
          <Badge
            tone={
              lead.status === "Active"
                ? "green"
                : lead.status === "Pending"
                  ? "amber"
                  : ""
            }
          >
            {lead.status}
          </Badge>
        </div>
        <button
          type="button"
          autoFocus
          className="ms-dialog-close"
          aria-label="Close lead details"
          onClick={() => dialog.current?.close()}
        >
          <X size={22} />
        </button>
      </header>
      <dl className="ms-lead-detail-grid">
        {[
          ["Buyer", lead.buyerName],
          ["Email", lead.email],
          ["Phone", lead.phone],
          ["Category", lead.category],
          ["Subcategory", lead.subcategory],
          ["City", lead.city],
          ["Quantity", `${lead.quantity.toLocaleString("en-IN")} ${lead.unit}`],
          ["Buyer budget", money(lead.budget)],
          ["Required by", date(lead.date)],
          ["Lead price", leadPrice(lead.price)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Not provided"}</dd>
          </div>
        ))}
      </dl>
      <section className="ms-lead-detail-description">
        <h3>Requirement</h3>
        <p>{lead.description || "No description provided."}</p>
      </section>
      <p className="ms-lead-slot-note">
        {lead.purchases.length} of 5 supplier contact slots unlocked
      </p>
      <LeadEditor lead={lead} />
      <form
        className="ms-form ms-lead-review"
        onSubmit={async (event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          const status = String(fields.get("status") || "");
          setSaving(true);
          setError("");
          try {
            await action("LEAD_REVIEW", lead.id, {
              price: Number(fields.get("price")),
              ...(status && status !== lead.status ? { status } : {}),
            });
            await refresh();
            notify("Lead review saved.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <h3>Admin review</h3>
        <div className="ms-form-grid">
          <label className="ms-field">
            Lead price (INR)
            <input
              key={lead.price}
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={lead.price}
              required
              disabled={saving}
            />
          </label>
          <label className="ms-field">
            Review status
            <select
              key={lead.status}
              name="status"
              defaultValue={
                reviewStatuses.includes(lead.status) ? lead.status : ""
              }
              disabled={saving}
            >
              <option value="">Keep current status</option>
              {reviewStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p role="alert" className="ms-error">
            {error}
          </p>
        )}
        <div className="ms-lead-dialog-actions">
          <Button disabled={saving}>
            {saving ? "Saving..." : "Save review"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => dialog.current?.close()}
          >
            Close
          </Button>
        </div>
      </form>
    </dialog>
  );
}

export function AdminLeadList({
  purchased = false,
  limit,
}: {
  purchased?: boolean;
  limit?: number;
}) {
  const { state, ready } = useMarketplace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const leads = state.leads
    .filter((lead) => !purchased || lead.purchases.length > 0)
    .slice(0, limit);
  const selected = state.leads.find((lead) => lead.id === selectedId);
  return (
    <>
      <RecordList
        label="Leads"
        items={leads}
        loading={!ready}
        columns={7}
        searchText={(lead) =>
          [
            lead.id,
            lead.title,
            lead.buyerName,
            lead.email,
            lead.city,
            lead.category,
          ].join(" ")
        }
        filters={[
          {
            label: "Status",
            value: (lead) => lead.status,
            options: reviewStatuses,
          },
          { label: "Category", value: (lead) => lead.category },
        ]}
      >
        {(rows) => (
          <table className="ms-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Buyer</th>
                <th>Category / city</th>
                <th>Lead price</th>
                <th>Required by</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.title}</strong>
                    <small>{lead.id}</small>
                  </td>
                  <td>{lead.buyerName}</td>
                  <td>
                    {lead.category}
                    <small>{lead.city}</small>
                  </td>
                  <td>{leadPrice(lead.price)}</td>
                  <td>{date(lead.date)}</td>
                  <td>
                    <Badge
                      tone={
                        lead.status === "Active"
                          ? "green"
                          : lead.status === "Pending"
                            ? "amber"
                            : ""
                      }
                    >
                      {lead.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedId(lead.id)}
                    >
                      View details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </RecordList>
      {selected && (
        <LeadDetails
          key={selected.id}
          lead={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
