"use client";
import { useMarketplace } from "@/lib/store";
import { money } from "@/lib/utils";
import { Button } from "./ui/button";
export function AdminPlans() {
  const { state, update } = useMarketplace();
  return (
    <div className="ms-pricing-grid">
      {state.plans.map((p) => (
        <form
          className={
            "ms-pricing-card " + (p.name === "Silver" ? "featured" : "")
          }
          key={p.id}
          onSubmit={async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.currentTarget));
            await update((s) => ({
              ...s,
              plans: s.plans.map((x) =>
                x.id === p.id
                  ? {
                      ...x,
                      price: Number(values.price),
                      listings: Number(values.listings),
                      credits: Number(values.credits),
                      durationDays: Number(values.durationDays),
                      active: values.active === "on",
                    }
                  : x,
              ),
            }));
          }}
        >
          <h2>{p.name}</h2>
          <div className="ms-pricing-price">
            {money(p.price)}
            <small>/ month</small>
          </div>
          {(["price", "listings", "credits"] as const).map((key) => (
            <label className="ms-field" key={key}>
              {key}
              <input
                name={key}
                type="number"
                min={0}
                step={key === "price" ? "0.01" : "1"}
                defaultValue={p[key]}
                required
              />
            </label>
          ))}
          <label className="ms-field">
            Duration (days)
            <input
              name="durationDays"
              type="number"
              min={1}
              defaultValue={p.durationDays || 30}
              required
            />
          </label>
          <label>
            <input
              type="checkbox"
              name="active"
              defaultChecked={p.active !== false}
            />{" "}
            Available to purchase
          </label>
          <Button>Save plan</Button>
        </form>
      ))}
    </div>
  );
}
