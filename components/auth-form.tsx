"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setSession } from "@/lib/api";
import { Brand } from "./brand";
import { Button } from "./ui/button";
export function AuthForm({
  role = "buyer",
  register = false,
}: {
  role?: "buyer" | "seller" | "admin";
  register?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState(
    params.get("token") ? "reset" : register ? "register" : "login",
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (typeof data.email === "string") setVerificationEmail(data.email);
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ ...data, role: role.toUpperCase() }),
        });
        setVerificationEmail(String(data.email));
        setMode("verify");
        setMessage(
          "Account created. Request an email verification code to continue.",
        );
      } else if (mode === "verify") {
        await api("/auth/email/verify", {
          method: "POST",
          body: JSON.stringify({ email: verificationEmail, code: data.code }),
        });
        setMode("login");
        setMessage("Email verified. Sign in to continue.");
      } else if (mode === "forgot") {
        const r = await api("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify(data),
        });
        setMessage(r.message);
      } else if (mode === "reset") {
        const r = await api("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({
            password: data.password,
            token: params.get("token"),
          }),
        });
        setMode("login");
        setMessage(r.message);
      } else {
        const result = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (result.user.role.toLowerCase() !== role)
          throw new Error(
            "Use the " +
              result.user.role.toLowerCase() +
              " frontend to sign in.",
          );
        setSession(result);
        const next = params.get("next");
        router.push(
          next?.startsWith("/" + role + "/") ? next : "/" + role + "/dashboard",
        );
      }
    } catch (e) {
      setError((e as Error).message);
      if ((e as Error).message.includes("Email verification"))
        setMode("verify");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="ms-auth">
      <section className="ms-card ms-auth-card">
        <Brand />
        <h1>
          {mode === "register"
            ? "Create your Roxodeal account"
            : mode === "verify"
              ? "Verify your email"
              : mode === "forgot"
                ? "Reset your password"
                : "Sign in to Roxodeal " + role}
        </h1>
        <form className="ms-form" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label className="ms-field">
                Name
                <input name="name" minLength={2} required />
              </label>
              <label className="ms-field">
                Mobile number
                <input
                  name="phone"
                  type="tel"
                  placeholder="+919876543210"
                  pattern="[+]?[1-9][0-9]{7,14}"
                  required
                />
              </label>
            </>
          )}
          {mode === "verify" ? (
            <>
              <label className="ms-field">
                Email address
                <input
                  type="email"
                  value={verificationEmail}
                  onChange={(e) => setVerificationEmail(e.target.value)}
                  required
                />
              </label>
              <label className="ms-field">
                Verification code
                <input
                  name="code"
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  required
                />
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await api("/auth/email/send", {
                      method: "POST",
                      body: JSON.stringify({ email: verificationEmail }),
                    });
                    setMessage(r.message);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Send email verification code
              </Button>
            </>
          ) : (
            <>
              {mode !== "reset" && (
                <label className="ms-field">
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
              )}
              {mode !== "forgot" && (
                <label className="ms-field">
                  Password
                  <input
                    name="password"
                    type="password"
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    minLength={mode === "register" ? 10 : undefined}
                    required
                  />
                </label>
              )}
            </>
          )}
          {error && (
            <p className="ms-error" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <Button disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "register"
                ? "Create account"
                : mode === "verify"
                  ? "Verify email"
                  : mode === "forgot"
                    ? "Send reset instructions"
                    : "Sign in"}
          </Button>
        </form>
        <div className="ms-table-actions">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("forgot")}>
                Forgot password?
              </button>
              <button onClick={() => setMode("verify")}>Verify email</button>
            </>
          )}
          {role !== "admin" && mode !== "register" && (
            <button onClick={() => setMode("register")}>
              Create an account
            </button>
          )}
          {mode !== "login" && (
            <button onClick={() => setMode("login")}>Back to sign in</button>
          )}
          {params.get("token") && (
            <button onClick={() => setMode("reset")}>Set new password</button>
          )}
        </div>
      </section>
    </main>
  );
}
