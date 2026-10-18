"use client";
import Link from "next/link";
import { Heart, MapPin, ShieldCheck, ArrowRight, Package } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import type { Product } from "@/lib/data";
import { money } from "@/lib/utils";
import { Button } from "./ui/button";
export function Badge({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"ms-badge " + tone}>{children}</span>;
}
export function ProductGrid({ products }: { products?: Product[] }) {
  const { state, save } = useMarketplace();
  const list = products || state.products.filter((p) => p.status === "Active");
  return (
    <div className="ms-product-grid">
      {list.map((p) => {
        const s = state.sellers.find((s) => s.id === p.sellerId);
        return (
          <article className="ms-product-card" key={p.id}>
            <div className="ms-product-image">
              <Link href={"/products/" + p.id}>
                <img src={p.image} alt={p.name} loading="lazy" />
              </Link>
              <button
                className={
                  "ms-save " + (state.saved.includes(p.id) ? "selected" : "")
                }
                onClick={() => save(p.id)}
                aria-label={
                  state.saved.includes(p.id)
                    ? "Unsave " + p.name
                    : "Save " + p.name
                }
              >
                <Heart
                  size={18}
                  fill={state.saved.includes(p.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <div className="ms-product-body">
              <small>{p.category}</small>
              <Link href={"/products/" + p.id}>
                <h3>{p.name}</h3>
              </Link>
              <p className="ms-product-price">
                {money(p.price)} <span>/ {p.unit}</span>
              </p>
              <p>
                MOQ: {p.moq.toLocaleString("en-IN")} {p.unit}s
              </p>
              <Link
                href={"/suppliers/" + p.sellerId}
                className="ms-supplier-line"
              >
                {s?.kyc === "Approved" && <ShieldCheck size={15} />}{" "}
                {s?.company}
              </Link>
              <small className="ms-location">
                <MapPin size={12} />
                {s?.city}, India
              </small>
              <Button asChild variant="outline">
                <Link
                  href={
                    "/buyer/requirements/create?product=" +
                    encodeURIComponent(p.name)
                  }
                >
                  Request a quote <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </article>
        );
      })}
      {!list.length && (
        <div className="ms-empty">
          <Package />
          <h3>No matching products</h3>
          <p>Try a different category, location, or search term.</p>
        </div>
      )}
    </div>
  );
}
export function SupplierGrid({ compact = false }: { compact?: boolean }) {
  const { state } = useMarketplace();
  return (
    <div className={compact ? "ms-suppliers-compact" : "ms-supplier-grid"}>
      {state.sellers.map((s) => (
        <Link
          href={"/suppliers/" + s.id}
          key={s.id}
          className="ms-supplier-card"
        >
          <div className="ms-avatar">
            {s.company
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <h3>{s.company}</h3>
            <p>
              <MapPin size={13} /> {s.city} · {s.years} years in business
            </p>
            {s.kyc === "Approved" ? (
              <Badge tone="green">
                <ShieldCheck size={12} />
                Verified Supplier
              </Badge>
            ) : (
              <Badge>KYC under review</Badge>
            )}
            {!compact && <p>{s.category}</p>}
          </div>
          <ArrowRight size={16} />
        </Link>
      ))}
    </div>
  );
}
