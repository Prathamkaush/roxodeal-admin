"use client";
import { useMarketplace } from "@/lib/store";
import { Button } from "./ui/button";
export function ProfileForm({ seller = false }: { seller?: boolean }) {
  const { state, update } = useMarketplace();
  const source = seller ? state.sellers[0] : state.profile;
  return (
    <form
      className="ms-card ms-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(e.currentTarget));
        if (seller) {
          const data = { ...values, years: Number(values.years) };
          await update((s) => ({
            ...s,
            sellers: s.sellers.map((x, i) => (i === 0 ? { ...x, ...data } : x)),
          }));
        } else
          await update((s) => ({ ...s, profile: { ...s.profile, ...values } }));
      }}
    >
      <div className="ms-form-grid">
        {[
          "name",
          "company",
          "email",
          "phone",
          "city",
          "state",
          "address",
          ...(seller ? ["pincode", "gst", "pan", "years"] : []),
        ].map((name) => (
          <label className="ms-field" key={name}>
            {name.charAt(0).toUpperCase() + name.slice(1)}
            <input
              name={name}
              defaultValue={
                (source as unknown as Record<string, string | number>)[name] ||
                ""
              }
              readOnly={name === "email" || name === "phone"}
              type={name === "years" ? "number" : "text"}
              min={0}
              required={!["gst", "pan", "years"].includes(name)}
            />
          </label>
        ))}
        {seller && (
          <label className="ms-field">
            Business category
            <select
              name="category"
              defaultValue={state.sellers[0]?.category}
              required
            >
              <option value="">Select category</option>
              {state.categories.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="ms-form-note">
        Email and phone changes require verified account support.
      </p>
      <Button>Save profile</Button>
    </form>
  );
}
