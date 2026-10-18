"use client";
import { useState } from "react";
import { action, api, session } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { Seller } from "@/lib/data";
import { useMarketplace, type State } from "@/lib/store";
import { Documents } from "./live-workspace";
import { Badge } from "./marketplace";
import { Button } from "./ui/button";
import { PageHeading } from "./page-heading";

const statuses = ["Not Submitted", "Submitted", "Under Review", "Additional Documents Required", "Approved", "Rejected"];

type KycSeller = Pick<Seller, "id" | "company" | "name" | "city" | "kyc" | "kycNote" | "userId" | "email" | "phone" | "years"> & {
  state: string; address: string; pincode: string; gst: string | null; pan: string | null;
};
type KycDetail = { seller: KycSeller; documents: State["documents"] };
type KycList = { items: Pick<Seller, "id" | "company" | "name" | "city" | "kyc">[]; total: number; page: number; pageSize: number };

function SellerReview({ seller, documents, onSaved }: KycDetail & { onSaved: () => Promise<unknown> }) {
  const { refresh } = useMarketplace();
  const [status, setStatus] = useState(seller.kyc);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const required = status === "Rejected" || status === "Additional Documents Required";
  return (
    <article className="ms-card kyc-admin-review">
      <div className="kyc-admin-heading">
        <div><h2>{seller.company}</h2><p>{seller.name} · {seller.city}</p></div>
        <Badge tone={seller.kyc === "Approved" ? "green" : "amber"}>{seller.kyc}</Badge>
      </div>
      <dl className="kyc-admin-business">
        {[
          ["Email", seller.email], ["Phone", seller.phone],
          ["Business address", [seller.address, seller.city, seller.state, seller.pincode].filter(Boolean).join(", ")],
          ["GST number", seller.gst || "Not provided"], ["PAN number", seller.pan || "Not provided"],
          ["Years in business", String(seller.years)],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <Documents ownerId={seller.userId} purpose="KYC" documents={documents} />
      {!documents.length && <p>No business verification documents uploaded yet.</p>}
      {seller.kycNote && <div className="kyc-admin-note"><strong>Last message sent to seller</strong><p>{seller.kycNote}</p></div>}
      <form onSubmit={async (event) => {
        event.preventDefault();
        setError(""); setSuccess("");
        if (required && note.trim().length < 10) {
          setError("Write at least 10 characters explaining the rejection or which documents the seller must submit.");
          return;
        }
        setBusy(true);
        try {
          await action("SELLER_REVIEW", seller.id, { kyc: status, note: note.trim() });
          setSuccess("Review saved and seller notified.");
          setNote("");
          await Promise.all([refresh(), onSaved()]);
        } catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
      }}>
        <label className="ms-field">Review decision
          <select aria-label={"KYC status for " + seller.company} value={status} disabled={busy} onChange={(event) => { setStatus(event.target.value); setError(""); setSuccess(""); }}>
            {statuses.map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="ms-field" htmlFor={"kyc-note-" + seller.id}>Message to seller {required ? "(required)" : "(optional)"}</label>
        <textarea id={"kyc-note-" + seller.id} aria-describedby={"kyc-help-" + seller.id} className="kyc-admin-message" rows={4} maxLength={2000} required={required} value={note} disabled={busy} onChange={event => { setNote(event.target.value); setError(""); setSuccess(""); }} placeholder={status === "Additional Documents Required" ? "List the missing documents and explain what the seller needs to upload." : "Explain your decision and what the seller should do next."} />
        <p id={"kyc-help-" + seller.id}>This message is visible to the seller on their business verification page and included in their notification. {required && "Enter at least 10 characters."}</p>
        {error && <p role="alert" className="kyc-admin-error">{error}</p>}
        {success && <p role="status">{success}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Saving review…" : status === "Rejected" ? "Reject and notify seller" : status === "Additional Documents Required" ? "Request documents and notify seller" : "Save review and notify seller"}</Button>
      </form>
    </article>
  );
}

export function KycReviews() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const identity = session()?.user.id;
  const list = useQuery<KycList>({
    queryKey: ["admin-kyc-list", identity, page],
    queryFn: () => api("/admin/kyc?page=" + page),
    enabled: !!identity,
    refetchInterval: 15000,
  });
  const detail = useQuery<KycDetail>({
    queryKey: ["admin-kyc-detail", identity, selected],
    queryFn: () => api("/admin/kyc/" + encodeURIComponent(selected!)),
    enabled: !!identity && !!selected,
    staleTime: 0,
  });
  return <>
    <PageHeading title="Seller KYC review" description={selected ? "Review the business details and documents, then send your decision to the seller." : "Select a seller to view their business details, documents and review form."} />
    {selected ? <>
      <Button variant="outline" className="kyc-admin-back" onClick={() => setSelected(null)}>Back to sellers</Button>
      {detail.isPending ? <div className="ms-card" role="status">Loading seller details…</div> : detail.isError ? <div className="ms-card" role="alert"><p>{detail.error.message}</p><Button onClick={() => void detail.refetch()}>Retry loading details</Button></div> : <SellerReview key={selected} {...detail.data} onSaved={async () => { await Promise.all([detail.refetch(), list.refetch()]); }} />}
    </> : list.isPending ? <div className="ms-card" role="status">Loading sellers…</div> : list.isError ? <div className="ms-card" role="alert"><p>{list.error.message}</p><Button onClick={() => void list.refetch()}>Retry loading sellers</Button></div> : <>
      <div className="ms-card kyc-admin-list">
        {list.data.items.length ? list.data.items.map(seller => <div className="kyc-admin-row" key={seller.id}>
          <div><strong>{seller.company}</strong><p>{seller.name} · {seller.city}</p></div>
          <Badge tone={seller.kyc === "Approved" ? "green" : "amber"}>{seller.kyc}</Badge>
          <Button variant="outline" size="sm" aria-label={"View KYC for " + seller.company} onClick={() => setSelected(seller.id)}>View</Button>
        </div>) : <p>No sellers to review.</p>}
      </div>
      {list.data.total > 0 && <div className="kyc-admin-pagination">
        <Button variant="outline" disabled={page <= 1 || list.isFetching} onClick={() => setPage(value => value - 1)}>Previous</Button>
        <span>Page {page} of {Math.max(1, Math.ceil(list.data.total / list.data.pageSize))} · {list.data.total} sellers</span>
        <Button variant="outline" disabled={page * list.data.pageSize >= list.data.total || list.isFetching} onClick={() => setPage(value => value + 1)}>Next</Button>
      </div>}
    </>}
  </>;
}
