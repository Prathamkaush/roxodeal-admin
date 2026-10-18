"use client";
import { useMarketplace } from "@/lib/store";
import { action } from "@/lib/api";
import { money } from "@/lib/utils";
import { PageHeading } from "./page-heading";
import { Button } from "./ui/button";
import { Documents } from "./live-workspace";
function Claims() {
  const { state, role, notify, refresh } = useMarketplace();
  return (
    <>
      <PageHeading
        title="Protection claims"
        description="Every claim is manually reviewed. Suppliers can submit responses and evidence."
      />
      {role === "buyer" && (
        <form
          className="ms-card ms-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const fields = Object.fromEntries(new FormData(e.currentTarget));
            try {
              await action("CLAIM_CREATE", crypto.randomUUID(), {
                ...fields,
                amount: Number(fields.amount),
              });
              await refresh();
              notify("Claim submitted for manual review.");
            } catch (error) {
              notify((error as Error).message);
            }
          }}
        >
          <label className="ms-field">
            Protected transaction
            <select name="protectionId" required>
              <option value="">Choose an active protected deal</option>
              {state.protections
                .filter((p) => p.status === "ACTIVE")
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.reference}
                  </option>
                ))}
            </select>
          </label>
          {["title", "amount"].map((name) => (
            <label className="ms-field" key={name}>
              {name === "title" ? "Deal title" : "Requested amount (₹)"}
              <input
                name={name}
                type={name === "amount" ? "number" : "text"}
                min={1}
                required
              />
            </label>
          ))}
          <label className="ms-field">
            Claim explanation
            <textarea name="reason" minLength={10} required />
          </label>
          <Button>Submit claim</Button>
        </form>
      )}
      {state.claims.map((c) => (
        <article className="ms-card" key={c.id}>
          <h2>{c.title}</h2>
          <p>
            {c.reference} · {money(c.amount)} · {c.status}
          </p>
          <h3>Buyer explanation</h3>
          <p>{c.reason}</p>
          <h3>Supplier response</h3>
          <p>{c.response || "Awaiting response"}</p>
          {role === "seller" && (
            <form
              className="ms-form"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await action("CLAIM_UPDATE", c.id, {
                    response: String(
                      new FormData(e.currentTarget).get("response"),
                    ),
                  });
                  await refresh();
                } catch (error) {
                  notify((error as Error).message);
                }
              }}
            >
              <label className="ms-field">
                Your response
                <textarea
                  name="response"
                  minLength={10}
                  defaultValue={c.response}
                  required
                />
              </label>
              <Button>Submit response</Button>
            </form>
          )}
          {role === "admin" && (
            <form
              className="ms-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                try {
                  await action("CLAIM_UPDATE", c.id, {
                    ...data,
                    approvedAmount: data.approvedAmount
                      ? Number(data.approvedAmount)
                      : undefined,
                  });
                  await refresh();
                  notify("Manual decision saved.");
                } catch (error) {
                  notify((error as Error).message);
                }
              }}
            >
              <label className="ms-field">
                Decision
                <select name="status" defaultValue={c.status}>
                  {[
                    "Under Review",
                    "Need More Information",
                    "Approved",
                    "Rejected",
                    "Resolved",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="ms-field">
                Approved compensation (₹)
                <input type="number" name="approvedAmount" min={0} />
              </label>
              <label className="ms-field">
                Refund transaction reference
                <input name="refundReference" />
              </label>
              <label className="ms-field">
                Admin notes
                <textarea name="adminNote" />
              </label>
              <Button>Save review decision</Button>
            </form>
          )}
          <Documents
            attachment={{ type: "CLAIM", id: c.id, documentIds: c.documentIds }}
          />
        </article>
      ))}
    </>
  );
}
export const BuyerClaims = Claims;
export const SellerClaims = Claims;
export const AdminClaims = Claims;
