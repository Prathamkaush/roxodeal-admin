"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import type { Seller, Product, Lead, Claim, Plan, Role } from "./data";
import { api, action, session, setSession } from "./api";
export type State = {
  navigationRecordIds?: Record<string, string[]>;
  kycReviewCount?: number;
  sellers: Seller[];
  products: Product[];
  leads: Lead[];
  claims: Claim[];
  plans: Plan[];
  saved: string[];
  profile: {
    name: string;
    company: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    address: string;
  };
  activity: string[];
  cms: Record<string, string>;
  categories: Array<{ id: string; name: string; leadPrice: number }>;
  buyers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    city: string;
    active: boolean;
    protectionEligible: boolean;
  }>;
  payments: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    refundRequired: boolean;
    createdAt: string;
    gatewayPaymentId: string | null;
    gatewayOrderId?: string | null;
    payerName?: string;
    payerEmail?: string;
    planName?: string | null;
  }>;
  documents: Array<{
    id: string;
    filename: string;
    ownerId: string;
    purpose: string;
  }>;
  enquiries: Array<{
    id: string;
    message: string;
    response: string | null;
    buyer: { name: string; email: string; phone: string };
    seller: { company: string };
  }>;
  protections: Array<{
    id: string;
    reference: string;
    sellerId: string;
    product: string;
    dealAmount: number;
    fee: number;
    status: string;
    deliveryDate: string;
    documentIds?: string[];
  }>;
};
const empty: State = {
  sellers: [],
  products: [],
  leads: [],
  claims: [],
  plans: [],
  saved: [],
  profile: {
    name: "",
    company: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    address: "",
  },
  activity: [],
  cms: {},
  categories: [],
  buyers: [],
  payments: [],
  documents: [],
  enquiries: [],
  protections: [],
};
type Store = {
  state: State;
  ready: boolean;
  role: Role | null;
  toast: string;
  error: string;
  busy: boolean;
  setRole: (r: Role | null) => void;
  update: (fn: (s: State) => State) => Promise<boolean>;
  notify: (s: string) => void;
  unlock: (id: string) => void;
  save: (id: string) => void;
  refresh: () => Promise<unknown>;
};
const Context = createContext<Store | null>(null);
function mutations(before: State, after: State, role: Role | null) {
  const commands: Array<{ action: string; id?: string; data: any }> = [];
  const push = (action: string, id: string | undefined, data: any) =>
    commands.push({ action, id, data });
  if (JSON.stringify(before.profile) !== JSON.stringify(after.profile))
    push("PROFILE", undefined, after.profile);
  for (const p of after.products) {
    const old = before.products.find((x) => x.id === p.id);
    if (!old) push("PRODUCT_CREATE", p.id, p);
    else if (JSON.stringify(old) !== JSON.stringify(p))
      push("PRODUCT_UPDATE", p.id, p);
  }
  for (const l of after.leads) {
    const old = before.leads.find((x) => x.id === l.id);
    if (!old) push("LEAD_CREATE", l.id, l);
    else if (JSON.stringify(old) !== JSON.stringify(l))
      push("LEAD_REVIEW", l.id, l);
  }
  for (const s of after.sellers) {
    const old = before.sellers.find((x) => x.id === s.id);
    if (old && JSON.stringify(old) !== JSON.stringify(s)) {
      if (role === "admin") {
        const data: Record<string, unknown> = {};
        for (const key of ["kyc", "plan", "credits"] as const)
          if (s[key] !== old[key]) data[key] = s[key];
        push("SELLER_REVIEW", s.id, data);
      } else if (s.kyc !== old.kyc) push("KYC_SUBMIT", s.id, {});
      else push("PROFILE", s.id, s);
    }
  }
  for (const p of after.plans) {
    const old = before.plans.find((x) => x.id === p.id);
    if (old && JSON.stringify(old) !== JSON.stringify(p))
      push("PLAN_UPDATE", p.id, p);
  }
  for (const c of after.claims) {
    const old = before.claims.find((x) => x.id === c.id);
    if (!old) push("CLAIM_CREATE", c.id, c);
    else if (JSON.stringify(old) !== JSON.stringify(c))
      push("CLAIM_UPDATE", c.id, c);
  }
  for (const [id, content] of Object.entries(after.cms))
    if (content !== before.cms[id]) push("CMS_UPDATE", id, { content });
  for (const id of new Set([...before.saved, ...after.saved]))
    if (before.saved.includes(id) !== after.saved.includes(id))
      push("SAVE_PRODUCT", id, { saved: after.saved.includes(id) });
  return commands;
}
export function MarketplaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [role, setCurrentRole] = useState<Role | null>(null);
  const [identity, setIdentity] = useState("public");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const client = useQueryClient();
  const pathname = usePathname();
  const kycView = pathname === "/admin/kyc" || pathname === "/admin/kyc/";
  const workspaceKey = ["workspace", identity, kycView ? "kyc" : "full"];
  useEffect(() => {
    const sync = () => {
      const user = session()?.user;
      setCurrentRole((user?.role.toLowerCase() as Role) || null);
      setIdentity(user?.id || "public");
      setHydrated(true);
    };
    sync();
    window.addEventListener("roxodeal-session", sync);
    return () => window.removeEventListener("roxodeal-session", sync);
  }, []);
  const query = useQuery<State>({
    queryKey: workspaceKey,
    queryFn: async () => {
      const data = await api(identity === "public" ? "/catalogue" : kycView ? "/workspace?view=kyc" : "/workspace");
      return kycView ? { ...empty, ...data } : data;
    },
    enabled: hydrated,
    refetchInterval: 15000,
    retry: 1,
  });
  const state = query.data || empty;
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const refresh = () => query.refetch();
  const notify = (s: string) => setToast(s);
  const setRole = (r: Role | null) => {
    if (r === null) {
      void api("/auth/logout", { method: "POST" }).catch(() => {});
      setSession(null);
      client.removeQueries({ queryKey: ["workspace"] });
    } else if (r !== role) notify("Sign in with the appropriate account.");
  };
  const update = (fn: (s: State) => State): Promise<boolean> => {
    const run = async () => {
      setBusy(true);
      try {
        if (!session()) throw new Error("Sign in before making changes.");
        const before =
          client.getQueryData<State>(workspaceKey) || state;
        const commands = mutations(before, fn(before), role);
        for (const c of commands) await action(c.action, c.id, c.data);
        await refresh();
        notify("Changes saved.");
        return true;
      } catch (e) {
        notify((e as Error).message);
        await refresh();
        return false;
      } finally {
        setBusy(false);
      }
    };
    const task = queue.current.then(run, run);
    queue.current = task;
    return task;
  };
  const unlock = (id: string) => {
    void (async () => {
      try {
        await api("/leads/" + encodeURIComponent(id) + "/unlock", {
          method: "POST",
        });
        await refresh();
        notify("Buyer contact unlocked.");
      } catch (e) {
        notify((e as Error).message);
      }
    })();
  };
  const save = (id: string) => {
    void update((s) => ({
      ...s,
      saved: s.saved.includes(id)
        ? s.saved.filter((x) => x !== id)
        : [...s.saved, id],
    }));
  };
  return (
    <Context.Provider
      value={{
        state,
        ready: hydrated && !query.isPending,
        role,
        toast,
        error: query.error?.message || "",
        busy,
        setRole,
        update,
        notify,
        unlock,
        save,
        refresh,
      }}
    >
      {children}
      {query.error && identity === "public" && (
        <div className="ms-card" role="alert">
          <p>{query.error.message}</p>
          <button onClick={() => void refresh()}>Retry connection</button>
        </div>
      )}
      {toast && (
        <div className="ms-toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export function useMarketplace() {
  const value = useContext(Context);
  if (!value) throw new Error("Marketplace provider is missing");
  return value;
}
