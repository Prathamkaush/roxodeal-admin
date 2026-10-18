"use client";
import type { Lead } from "@/lib/data";
import { useMarketplace } from "@/lib/store";
import { action } from "@/lib/api";
import { Button } from "./ui/button";
export function LeadEditor({ lead }: { lead: Lead }) {
  const { state, notify, refresh } = useMarketplace();
  if (lead.purchases.length) return null;
  return (
    <details>
      <summary>Edit requirement details</summary>
      <form
        className="ms-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await action("LEAD_UPDATE", lead.id, {
              ...d,
              quantity: Number(d.quantity),
              budget: Number(d.budget),
            });
            await refresh();
            notify("Requirement updated.");
          } catch (error) {
            notify((error as Error).message);
          }
        }}
      >
        <div className="ms-form-grid">
          {(
            [
              "title",
              "quantity",
              "unit",
              "budget",
              "city",
              "description",
              "subcategory",
            ] as const
          ).map((k) => (
            <label className="ms-field" key={k}>
              {k}
              <input
                name={k}
                type={["quantity", "budget"].includes(k) ? "number" : "text"}
                defaultValue={lead[k] || ""}
                required={k !== "subcategory"}
              />
            </label>
          ))}
          <label className="ms-field">
            Category
            <select
              name="categoryId"
              defaultValue={
                state.categories.find((c) => c.name === lead.category)?.id
              }
            >
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="ms-field">
            Required by
            <input
              type="date"
              name="requiredBy"
              defaultValue={lead.date}
              required
            />
          </label>
        </div>
        <Button>Save details</Button>
      </form>
    </details>
  );
}
