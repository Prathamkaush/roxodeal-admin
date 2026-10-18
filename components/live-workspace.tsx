"use client";
import { useEffect, useState } from "react";
import { api, apiBase, action, session } from "@/lib/api";
import { useMarketplace, type State } from "@/lib/store";
import { money } from "@/lib/utils";
import { Button } from "./ui/button";
import { PageHeading } from "./page-heading";
import { RecordList } from "./list-tools";
declare global {
  interface Window {
    Razorpay?: new (options: any) => {
      open: () => void;
      on: (event: string, cb: (event: any) => void) => void;
    };
  }
}
let checkoutScript: Promise<void> | null = null;
async function checkout() {
  if (window.Razorpay) return;
  if (!checkoutScript)
    checkoutScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => {
        checkoutScript = null;
        reject(new Error("Payment checkout failed to load"));
      };
      document.head.appendChild(script);
    });
  await checkoutScript;
}
export function PayButton({
  type,
  targetId,
  label = "Pay securely",
}: {
  type: "LEAD" | "SUBSCRIPTION" | "PROTECTION";
  targetId: string;
  label?: string;
}) {
  const { notify, refresh } = useMarketplace();
  const [busy, setBusy] = useState(false);
  const [pendingOrder, setPendingOrder] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const storageKey =
    "roxodeal-pending-payment:" +
    session()?.user.id +
    ":" +
    type +
    ":" +
    targetId;
  useEffect(() => {
    try {
      setPendingOrder(sessionStorage.getItem(storageKey) || "");
    } catch {}
  }, [storageKey]);
  const remember = (orderId: string) => {
    setPendingOrder(orderId);
    try {
      if (orderId) sessionStorage.setItem(storageKey, orderId);
      else sessionStorage.removeItem(storageKey);
    } catch {}
  };
  const confirmed = async (result: {
    status: string;
    refundRequired: boolean;
  }) => {
    if (result.status !== "CAPTURED") {
      setMessage(
        "Payment is awaiting confirmation. Use Check payment status before making another payment.",
      );
      return;
    }
    remember("");
    const text = result.refundRequired
      ? "Payment received. This purchase needs a refund review; please contact support."
      : type === "SUBSCRIPTION"
        ? "Payment verified. Your plan and lead credits are now active."
        : type === "LEAD"
          ? "Payment verified. Buyer contact is now unlocked."
          : "Payment verified. Buyer protection is now active.";
    setMessage(text);
    notify(text);
    await refresh();
  };
  return (
    <div>
      <Button
        disabled={busy || !!pendingOrder}
        onClick={async () => {
          setBusy(true);
          setError("");
          setMessage("");
          try {
            const order = await api("/payments/orders", {
              method: "POST",
              body: JSON.stringify({ type, targetId }),
            });
            await checkout();
            const gateway = new window.Razorpay!({
              key: order.keyId,
              order_id: order.orderId,
              amount: order.amount,
              currency: "INR",
              name: "Roxodeal",
              handler: async (response: {
                razorpay_order_id: string;
                razorpay_payment_id: string;
                razorpay_signature: string;
              }) => {
                remember(order.orderId);
                setBusy(true);
                setMessage("Verifying payment…");
                try {
                  await confirmed(
                    await api("/payments/verify", {
                      method: "POST",
                      body: JSON.stringify({
                        orderId: order.orderId,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                      }),
                    }),
                  );
                } catch (e) {
                  setMessage("");
                  setError(
                    (e as Error).message +
                      " Use Check payment status to retry; do not pay again.",
                  );
                } finally {
                  setBusy(false);
                }
              },
              modal: { ondismiss: () => setBusy(false) },
              theme: { color: "#123e60" },
            });
            gateway.on("payment.failed", () => {
              setError("Payment failed. You can retry checkout.");
              setBusy(false);
            });
            gateway.open();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Please wait…" : label}
      </Button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      {pendingOrder && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await confirmed(
                await api(
                  "/payments/orders/" +
                    encodeURIComponent(pendingOrder) +
                    "/status",
                ),
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Check payment status
        </Button>
      )}
    </div>
  );
}
export function Documents({
  ownerId,
  attachment,
  purpose,
  documents,
}: {
  ownerId?: string;
  attachment?: {
    type: "CLAIM" | "LEAD" | "PROTECTION";
    id: string;
    documentIds?: string[];
  };
  purpose?: string;
  documents?: State["documents"];
}) {
  const { state, refresh, notify, role } = useMarketplace();
  const [busy, setBusy] = useState(false);
  return (
    <section className="ms-card">
      <h2>
        {purpose === "KYC"
          ? "Business verification documents"
          : "Private documents"}
      </h2>
      {role !== "admin" && (
        <label className="ms-field">
          Upload PDF or image (up to 10 MB)
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const body = new FormData();
                body.append("file", file);
                if (attachment || purpose)
                  body.append("purpose", attachment?.type || purpose!);
                const doc = await api("/files/private", {
                  method: "POST",
                  body,
                });
                if (attachment)
                  await action("ATTACH_DOCUMENTS", attachment.id, {
                    type: attachment.type,
                    documentIds:
                      attachment.type === "CLAIM"
                        ? [doc.id]
                        : [...(attachment.documentIds || []), doc.id],
                  });
                await refresh();
                notify("Document uploaded privately.");
              } catch (error) {
                notify((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
      )}
      {(documents ?? state.documents)
        .filter(
          (d) =>
            (!ownerId || d.ownerId === ownerId) &&
            (!purpose || d.purpose === purpose) &&
            (!attachment || attachment.documentIds?.includes(d.id)),
        )
        .map((d) => (
          <div className="ms-table-actions" key={d.id}>
            <span>{d.filename}</span>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(
                    apiBase + "/files/private/" + d.id,
                    {
                      headers: {
                        Authorization: "Bearer " + session()?.accessToken,
                      },
                    },
                  );
                  if (!response.ok)
                    throw new Error("Document could not be downloaded");
                  const url = URL.createObjectURL(await response.blob());
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = d.filename;
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (error) {
                  notify((error as Error).message);
                }
              }}
            >
              Download
            </button>
          </div>
        ))}
    </section>
  );
}
export function KycWorkspace() {
  const { state, notify, refresh } = useMarketplace();
  return (
    <>
      <PageHeading
        title="Business verification"
        description="Upload supporting documents and submit your business for manual review."
      />
      <div className="ms-card">
        <h2>{state.sellers[0]?.kyc || "Not Submitted"}</h2>
        <Button
          onClick={async () => {
            try {
              await action("KYC_SUBMIT", undefined, {});
              await refresh();
              notify("KYC submitted for review.");
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        >
          Submit for review
        </Button>
      </div>
      <Documents />
    </>
  );
}
export function FinancialActivity({ section }: { section: string }) {
  const { state, role, notify, refresh, ready } = useMarketplace();
  const [checking, setChecking] = useState("");
  return (
    <>
      <PageHeading
        title={
          section === "payments" ? "Payment history" : "Business enquiries"
        }
        description="Activity from your marketplace account."
      />
      {section === "payments" ? (
        <RecordList
          label="Payments"
          items={state.payments}
          loading={!ready}
          columns={6}
          dateValue={(p) => p.createdAt}
          searchText={(p) =>
            [
              p.id,
              p.gatewayPaymentId,
              p.payerName,
              p.payerEmail,
              p.type,
              p.planName,
            ].join(" ")
          }
          filters={[
            { label: "Status", value: (p) => p.status },
            { label: "Type", value: (p) => p.type },
            {
              label: "Refund",
              value: (p) =>
                p.refundRequired ? "Review required" : "No review required",
            },
          ]}
        >
          {(rows) => (
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  {role === "admin" && <th>Account</th>}
                  <th>Type / plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  {role !== "admin" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>{p.gatewayPaymentId || p.id}</td>
                    {role === "admin" && (
                      <td>
                        <strong>{p.payerName}</strong>
                        <small>{p.payerEmail}</small>
                      </td>
                    )}
                    <td>
                      {p.type}
                      {p.planName && <small>{p.planName}</small>}
                    </td>
                    <td>{money(p.amount / 100)}</td>
                    <td>
                      {p.status}
                      {p.refundRequired ? " · Refund review required" : ""}
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    {role !== "admin" && (
                      <td>
                        {p.status === "PENDING" && p.gatewayOrderId && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!checking}
                            onClick={async () => {
                              setChecking(p.id);
                              try {
                                const result = await api(
                                  "/payments/orders/" +
                                    encodeURIComponent(p.gatewayOrderId!) +
                                    "/status",
                                );
                                notify(
                                  result.status === "CAPTURED"
                                    ? result.refundRequired
                                      ? "Payment received; refund review required."
                                      : "Payment verified and purchase activated."
                                    : "The gateway has not confirmed this payment yet. Please do not pay again if your payment was successful.",
                                );
                                await refresh();
                              } catch (error) {
                                notify((error as Error).message);
                              } finally {
                                setChecking("");
                              }
                            }}
                          >
                            {checking === p.id
                              ? "Checking…"
                              : "Check payment status"}
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </RecordList>
      ) : (
        <div className="ms-card">
          {state.enquiries.map((e) => (
            <article key={e.id}>
              <h2>{e.seller.company}</h2>
              <p>{e.message}</p>
              <p>{e.response || "Awaiting response"}</p>
              {role === "seller" && (
                <>
                  <p>
                    {e.buyer.name} · {e.buyer.email} · {e.buyer.phone}
                  </p>
                  <form
                    className="ms-form"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const response = String(
                        new FormData(event.currentTarget).get("response"),
                      );
                      try {
                        await action("ENQUIRY_RESPONSE", e.id, { response });
                        await refresh();
                        notify("Response sent.");
                      } catch (error) {
                        notify((error as Error).message);
                      }
                    }}
                  >
                    <label className="ms-field">
                      Response
                      <textarea name="response" required minLength={2} />
                    </label>
                    <Button>Send response</Button>
                  </form>
                </>
              )}
            </article>
          ))}
          {!state.enquiries.length && <p>No records yet.</p>}
        </div>
      )}
    </>
  );
}
export function EnquiryForm({
  sellerId,
  productId,
}: {
  sellerId: string;
  productId?: string;
}) {
  const { notify } = useMarketplace();
  return (
    <form
      className="ms-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const message = String(new FormData(e.currentTarget).get("message"));
        try {
          await action("ENQUIRY_CREATE", undefined, {
            sellerId,
            productId,
            message,
          });
          notify("Enquiry sent to supplier.");
        } catch (error) {
          notify((error as Error).message);
        }
      }}
    >
      <label className="ms-field">
        Send a business enquiry
        <textarea name="message" minLength={10} required />
      </label>
      <Button>Send enquiry</Button>
    </form>
  );
}
export function ProtectionWorkspace() {
  const { state, role, notify, refresh } = useMarketplace();
  return (
    <>
      <PageHeading
        title="Buyer Protection"
        description="Record your negotiated deal. Claims are reviewed manually."
      />
      {role === "admin" ? (
        <form
          className="ms-card ms-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await action("PROTECTION_REVIEW", "fee", {
                fee: Number(new FormData(e.currentTarget).get("fee")),
              });
              notify("Protection fee saved.");
            } catch (error) {
              notify((error as Error).message);
            }
          }}
        >
          <label className="ms-field">
            Protection fee (₹)
            <input name="fee" type="number" min={1} required />
          </label>
          <Button>Save fee</Button>
        </form>
      ) : (
        role === "buyer" && (
          <form
            className="ms-card ms-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              try {
                await action("PROTECTION_CREATE", undefined, {
                  ...data,
                  quantity: Number(data.quantity),
                  dealAmount: Number(data.dealAmount),
                });
                await refresh();
                notify(
                  "Transaction recorded. Pay the protection fee to activate it.",
                );
              } catch (error) {
                notify((error as Error).message);
              }
            }}
          >
            <div className="ms-form-grid">
              <label className="ms-field">
                Supplier
                <select name="sellerId" required>
                  {state.sellers.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.company}
                    </option>
                  ))}
                </select>
              </label>
              {[
                "reference",
                "product",
                "quantity",
                "dealAmount",
                "deliveryDate",
              ].map((name) => (
                <label className="ms-field" key={name}>
                  {
                    (
                      {
                        reference: "Deal reference",
                        product: "Product",
                        quantity: "Quantity",
                        dealAmount: "Deal amount (₹)",
                        deliveryDate: "Delivery date",
                      } as Record<string, string>
                    )[name]
                  }
                  <input
                    name={name}
                    type={
                      name === "quantity" || name === "dealAmount"
                        ? "number"
                        : name === "deliveryDate"
                          ? "date"
                          : "text"
                    }
                    min={1}
                    required
                  />
                </label>
              ))}
            </div>
            <label className="ms-field">
              Agreement terms
              <textarea name="terms" minLength={10} required />
            </label>
            <Button>Record protected transaction</Button>
          </form>
        )
      )}
      {state.protections.map((p) => (
        <article className="ms-card" key={p.id}>
          <h2>
            {p.reference} · {p.product}
          </h2>
          <p>
            {money(p.dealAmount / 100)} · {p.status}
          </p>
          {role === "buyer" && p.status === "PENDING" && (
            <PayButton
              type="PROTECTION"
              targetId={p.id}
              label={"Activate protection · " + money(p.fee / 100)}
            />
          )}
          {role === "buyer" && (
            <Documents
              attachment={{
                type: "PROTECTION",
                id: p.id,
                documentIds: p.documentIds,
              }}
            />
          )}
        </article>
      ))}
    </>
  );
}
export function BuyerManagement() {
  const { state, notify, refresh, ready } = useMarketplace();
  return (
    <>
      <PageHeading
        title="Buyer management"
        description="Account access and buyer protection eligibility."
      />
      <RecordList
        label="Buyers"
        items={state.buyers}
        loading={!ready}
        columns={4}
        searchText={(b) =>
          [b.name, b.email, b.phone, b.company, b.city].join(" ")
        }
        filters={[
          {
            label: "Access",
            value: (b) => (b.active ? "Enabled" : "Suspended"),
          },
          {
            label: "Protection",
            value: (b) => (b.protectionEligible ? "Eligible" : "Not eligible"),
          },
          { label: "City", value: (b) => b.city },
        ]}
      >
        {(rows) => (
          <table className="ms-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Company / city</th>
                <th>Access</th>
                <th>Protection</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.name}
                    <small>
                      {b.email} · {b.phone}
                    </small>
                  </td>
                  <td>
                    {b.company} · {b.city}
                  </td>
                  {(["active", "protectionEligible"] as const).map((field) => (
                    <td key={field}>
                      <button
                        onClick={async () => {
                          try {
                            await action("USER_REVIEW", b.id, {
                              [field]: !b[field],
                            });
                            await refresh();
                          } catch (e) {
                            notify((e as Error).message);
                          }
                        }}
                      >
                        {b[field] ? "Enabled" : "Suspended"}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </RecordList>
    </>
  );
}
function CategoryPrice({
  category,
}: {
  category: { id: string; name: string; leadPrice: number };
}) {
  const { notify, refresh } = useMarketplace();
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="ms-category-price"
      onSubmit={async (event) => {
        event.preventDefault();
        const price = Number(new FormData(event.currentTarget).get("price"));
        setSaving(true);
        try {
          await action("CATEGORY_UPDATE", category.id, { leadPrice: price });
          await refresh();
          notify("Category price saved.");
        } catch (error) {
          notify((error as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <input
        key={category.leadPrice}
        name="price"
        aria-label={"Default lead price for " + category.name}
        type="number"
        min={0}
        step="0.01"
        defaultValue={category.leadPrice / 100}
        required
        disabled={saving}
      />
      <Button size="sm" disabled={saving}>
        {saving ? "Saving..." : "Save price"}
      </Button>
    </form>
  );
}
export function CategoryManagement() {
  const { state, ready } = useMarketplace();
  return (
    <>
      <PageHeading
        title="Category lead pricing"
        description="Set the default price for new requirements in each industry."
      />
      <RecordList
        label="Categories"
        items={state.categories}
        loading={!ready}
        columns={3}
        searchText={(category) => category.name}
        filters={[
          {
            label: "Pricing",
            value: (category) => (category.leadPrice > 0 ? "Paid" : "Free"),
            options: ["Free", "Paid"],
          },
        ]}
      >
        {(rows) => (
          <table className="ms-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Default lead price</th>
                <th>Update price (INR)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td>
                    {(category.leadPrice / 100).toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <CategoryPrice category={category} />
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
