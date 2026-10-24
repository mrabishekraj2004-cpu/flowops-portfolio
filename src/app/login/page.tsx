"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GitBranch, ArrowUpRight } from "lucide-react";
import { createAuthClient } from "better-auth/react";
const auth = createAuthClient();
export default function Login() {
  const router=useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main id="main" className="login">
      <section>
        <Link className="brand" href="/">
          <span className="logo">
            <GitBranch size={24} />
          </span>
          FlowOps
        </Link>
        <div>
          <span className="eyebrow">A LITTLE LESS ADMIN</span>
          <h1>
            Good decisions.
            <br />A clear trail.
          </h1>
          <p>Documents, reviews and approvals in one considered workflow.</p>
        </div>
        <small>Abishek Akash · AI-assisted portfolio project</small>
      </section>
      <section>
        <div className="login-box">
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h1>Welcome back.</h1>
          <p className="muted">Sign in to keep things moving.</p>
          {error && (
            <p role="alert" className="alert danger">
              {error}
            </p>
          )}
          <form
            method="post"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const form = new FormData(e.currentTarget);
              try {
                const result = await auth.signIn.email({
                  email: String(form.get("email")),
                  password: String(form.get("password")),
                });
                if (result.error)
                  setError(result.error.message ?? "Sign-in failed.");
                else router.replace("/workspace");
              } catch {
                setError("Unable to connect. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <p className="muted">
            <small>
              Fictional accounts are created by the explicit local seed. Ask the
              project owner for access. Public sign-up is disabled.
            </small>
          </p>
          <Link href="/">← Back to project overview</Link>
        </div>
      </section>
    </main>
  );
}
