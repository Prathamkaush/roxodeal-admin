"use client";
import { action } from "@/lib/api";
import { useMarketplace } from "@/lib/store";
import { Button } from "./ui/button";
export function CreateRecord({
  kind,
}: {
  kind: "plan" | "category" | "seller" | "lead" | "announcement";
}) {
  const { state, notify, refresh } = useMarketplace();
  const fields =
    kind === "plan"
      ? ["name", "price", "listings", "credits", "durationDays"]
      : kind === "category"
        ? ["name", "leadPrice"]
        : kind === "seller"
          ? ["name", "email", "phone", "password"]
          : kind === "lead"
            ? [
                "title",
                "quantity",
                "unit",
                "budget",
                "city",
                "date",
                "description",
              ]
            : ["message"];
  return (
    <details className="ms-card">
      <summary>
        {kind === "announcement" ? "Send an announcement" : "Create " + kind}
      </summary>
      <form
        className="ms-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data: Record<string, any> = Object.fromEntries(
            new FormData(form),
          );
          for (const key of [
            "price",
            "listings",
            "credits",
            "durationDays",
            "leadPrice",
            "quantity",
            "budget",
          ])
            if (key in data) data[key] = Number(data[key]);
          try {
            if (kind === "seller") data.role = "SELLER";
            await action(
              {
                plan: "PLAN_CREATE",
                category: "CATEGORY_CREATE",
                seller: "ACCOUNT_CREATE",
                lead: "LEAD_CREATE",
                announcement: "ANNOUNCEMENT",
              }[kind],
              undefined,
              data,
            );
            await refresh();
            notify(
              kind === "seller"
                ? "Seller account created. Email verification is required before login."
                : "Record saved.",
            );
            form.reset();
          } catch (error) {
            notify((error as Error).message);
          }
        }}
      >
        <div className="ms-form-grid">
          {fields.map((key) => (
            <label className="ms-field" key={key}>
              {key}
              <input
                name={key}
                type={
                  key === "password"
                    ? "password"
                    : key === "email"
                      ? "email"
                      : key === "date"
                        ? "date"
                        : [
                              "price",
                              "listings",
                              "credits",
                              "durationDays",
                              "leadPrice",
                              "quantity",
                              "budget",
                            ].includes(key)
                          ? "number"
                          : "text"
                }
                min={0}
                minLength={key === "password" ? 10 : undefined}
                required
              />
            </label>
          ))}
          {kind === "lead" && (
            <>
              <label className="ms-field">
                Buyer
                <select name="buyerId" required>
                  {state.buyers
                    .filter((b) => b.active)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} · {b.email}
                      </option>
                    ))}
                </select>
              </label>
              <label className="ms-field">
                Category
                <select name="category" required>
                  {state.categories.map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {kind === "announcement" && (
            <label className="ms-field">
              Audience
              <select name="audience">
                <option>ALL</option>
                <option>BUYER</option>
                <option>SELLER</option>
              </select>
            </label>
          )}
        </div>
        <Button>Save</Button>
      </form>
    </details>
  );
}
