"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, action } from "@/lib/api";
import { useMarketplace } from "@/lib/store";
import { PageHeading } from "./page-heading";
import { Button } from "./ui/button";
const defaults = [
  "home",
  "about",
  "contact",
  "faq",
  "terms",
  "privacy",
  "refund-policy",
  "buyer-protection-policy",
  "claim-policy",
  "dispute-policy",
  "seller-agreement",
  "blog",
  "banners",
  "testimonials",
  "social-links",
];
export function CmsEditor() {
  const { state, refresh, notify } = useMarketplace();
  const [slug, setSlug] = useState("about");
  const q = useQuery({
    queryKey: ["cms-editor", slug],
    queryFn: () => api("/cms/" + encodeURIComponent(slug)),
  });
  return (
    <>
      <PageHeading
        title="Website content"
        description="Publish pages and their search metadata. Legal content should use your approved business policies."
      />
      <div className="ms-card">
        <label className="ms-field">
          Page
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {Array.from(new Set([...defaults, ...Object.keys(state.cms)])).map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
        <label className="ms-field">
          Custom page slug
          <input
            placeholder="blog/company-news"
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (value) setSlug(value);
            }}
          />
        </label>
      </div>
      {q.error ? (
        <p>{q.error.message}</p>
      ) : (
        q.data && (
          <form
            key={slug + q.data.updatedAt}
            className="ms-card ms-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await action(
                  "CMS_UPDATE",
                  slug,
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                await refresh();
                await q.refetch();
                notify("Page published.");
              } catch (error) {
                notify((error as Error).message);
              }
            }}
          >
            <label className="ms-field">
              Page / SEO title
              <input
                name="title"
                defaultValue={q.data.title}
                maxLength={200}
                required
              />
            </label>
            <label className="ms-field">
              SEO description
              <textarea
                name="seoDescription"
                defaultValue={q.data.seoDescription || ""}
                maxLength={500}
              />
            </label>
            <label className="ms-field">
              Content
              <textarea
                name="content"
                rows={12}
                defaultValue={q.data.content}
              />
            </label>
            <Button>Publish content</Button>
          </form>
        )
      )}
    </>
  );
}
