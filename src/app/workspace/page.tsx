"use client";
import {
  Suspense,
  useEffect,
  useState,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GitBranch,
  LayoutDashboard,
  FileUp,
  Inbox,
  Activity,
  Settings,
  ArrowUpRight,
  LogOut,
  FileText,
  CheckCircle2,
  Clock3,
  AlertCircle,
  RefreshCcw,
  Plus,
} from "lucide-react";
import { createAuthClient } from "better-auth/react";
import { blank, type Quotation, type Extraction } from "@/lib/quotation";
type User = {
  id: string;
  name: string;
  role: string;
  email?: string;
  active?: boolean;
};
type Category = { id: string; name: string; active: boolean };
type RequestRow = {
  id: string;
  number: number;
  title: string;
  state: string;
  version: number;
  ownerId: string;
  owner: { name: string };
  createdAt: string;
  updatedAt: string;
  purchase?: { id: string; number: number; total: string } | null;
  assignments: {
    reviewerId: string;
    version?: number;
    reviewer?: { name: string };
  }[];
};
type Attempt = {
  id: string;
  state: string;
  detail: string;
  startedAt: string;
  attempt: number;
};
type Job = {
  id: string;
  state: string;
  attempts: number;
  maxAttempts: number;
  requestId: string;
  lastError: string | null;
  attemptsLog: Attempt[];
};
type Outbox = {
  id: string;
  state: string;
  attempts: number;
  maxAttempts: number;
  destination: string;
  lastError: string | null;
  deliveries: {
    id: string;
    status: number | null;
    outcome: string;
    createdAt: string;
  }[];
};
type Detail = RequestRow & {
  originalName: string;
  category: Category;
  currentData: Quotation | null;
  pageText: { page: number; text: string }[] | null;
  originalExtraction: Extraction | null;
  extractionProvider: string | null;
  validation: string[] | null;
  requiredApprovals: number;
  submittedVersion: number | null;
  decisions: {
    id: string;
    action: string;
    reason: string;
    version: number;
    reviewer: { name: string };
    reviewerId: string;
  }[];
  events: { id: string; stage: string; detail: string; createdAt: string }[];
  jobs: Job[];
  purchase: (NonNullable<RequestRow["purchase"]> & { outbox: Outbox[] }) | null;
  revisions: {
    id: string;
    version: number;
    reason: string;
    createdAt: string;
  }[];
};
type Boot = {
  user: User;
  requests: RequestRow[];
  categories: Category[];
  notifications: { id: string; message: string; requestId: string }[];
  baseCurrency: string;
  provider: string;
  publicDemo: boolean;
};
type AdminData = {
  users: User[];
  categories: Category[];
  policy: {
    threshold: string;
    reviewerIds: string[];
    webhookUrl: string | null;
    simulationFailures: number;
  };
  jobs: Job[];
  outbox: Outbox[];
  events: { id: string; stage: string; detail: string; createdAt: string }[];
  receiver: { eventId: string }[];
  simulationEnabled: boolean;
};
const auth = createAuthClient();
const label = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const date = (s: string) =>
  new Date(s).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
async function api<T>(
  url: string,
  data?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(
    "/api/" + url,
    data === undefined
      ? { cache: "no-store" }
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "AUTH_REQUIRED"
        : (result.error ?? "Request failed."),
    );
  return result;
}
function Badge({ state }: { state: string }) {
  return (
    <span className={"pill status-" + state.toLowerCase()}>{label(state)}</span>
  );
}
export default function Workspace() {
  return (
    <Suspense
      fallback={
        <main id="main" className="empty">
          Loading workspace…
        </main>
      }
    >
      <Desk />
    </Suspense>
  );
}
function Desk() {
  const router = useRouter(),
    params = useSearchParams(),
    view = params.get("view") ?? "overview",
    id = params.get("id");
  const [boot, setBoot] = useState<Boot | null>(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [adminData, setAdmin] = useState<AdminData | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState("");
  const generation = useRef(0);
  const load = useCallback(async () => {
    const current = ++generation.current;
    try {
      const b = await api<Boot>("bootstrap");
      const d = id ? await api<Detail>("requests/" + id) : null;
      const a =
        b.user.role === "ADMIN" && ["runs", "settings"].includes(view)
          ? await api<AdminData>("admin")
          : null;
      if (current !== generation.current) return;
      setBoot(b);
      setDetail(d);
      if (a) setAdmin(a);
    } catch (e) {
      if (current !== generation.current) return;
      const message = e instanceof Error ? e.message : "Unable to load.";
      if (message === "AUTH_REQUIRED") router.replace("/login");
      else setError(message);
    }
  }, [id, router, view]);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      await load();
      if (active) timer = setTimeout(() => void run(), 4000);
    };
    void run();
    return () => {
      active = false; // This numeric counter invalidates in-flight responses; it is not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      if (timer) clearTimeout(timer);
    };
  }, [load]);
  async function mutate(url: string, data: unknown, method = "POST") {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await api(url, data, method);
      setNotice("Saved. The workflow has been updated.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  if (!boot)
    return (
      <main id="main" className="empty">
        <GitBranch size={30} />
        <h1>Opening your workspace</h1>
        <p role="status">{error || "Checking your session…"}</p>
        <Link href="/login">Return to sign-in</Link>
      </main>
    );
  const { user, requests } = boot;
  const rows = requests.filter(
    (r) =>
      (r.title + " " + r.number + " " + r.owner.name)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (view !== "approvals" || r.state === "PENDING_APPROVAL"),
  );
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="logo">
            <GitBranch size={23} />
          </span>
          FlowOps
        </Link>
        <div className="org">
          <span className="avatar">NS</span>
          <div>
            <strong>Northstar Studio</strong>
            <small>Fictional organisation</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {[
            [LayoutDashboard, "overview", "Overview"],
            ...(user.role === "REQUESTER"
              ? [[FileUp, "upload", "Upload quotation"]]
              : []),
            ...(user.role === "REVIEWER"
              ? [[Inbox, "approvals", "Approval inbox"]]
              : []),
            ...(user.role === "ADMIN"
              ? [
                  [Activity, "runs", "Automation runs"],
                  [Settings, "settings", "Administration"],
                ]
              : []),
          ].map(([Icon, key, text]) => {
            const I = Icon as typeof GitBranch;
            return (
              <Link
                key={String(key)}
                className={!id && view === key ? "nav active" : "nav"}
                href={"/workspace?view=" + key}
              >
                <I size={18} />
                {String(text)}
                {key === "approvals" && (
                  <span className="count">
                    {
                      requests.filter((r) => r.state === "PENDING_APPROVAL")
                        .length
                    }
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <span className="pill mock">DEMONSTRATION</span>
          <p>
            Fictional data only.
            <br />
            No orders or payments.
          </p>
          <Link href="/case-study">
            About this project <ArrowUpRight size={13} />
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <div className="breadcrumb">
            Workspace <span>/</span> {id ? "Quotation review" : label(view)}
          </div>
          <div className="profile">
            <span className="avatar">
              {user.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{label(user.role)}</small>
            </div>
            <button
              className="icon secondary"
              aria-label="Sign out"
              onClick={async () => {
                await auth.signOut();
                router.replace("/login");
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main id="main" className="content">
          {error && (
            <div className="alert danger" role="alert">
              {error}
              <button className="secondary" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}
          {notice && (
            <p className="alert success" role="status">
              {notice}
            </p>
          )}
          <div className="provider-note">
            <span className="dot" />
            {boot.provider}
            <span>Base currency: {boot.baseCurrency}</span>
          </div>
          {id ? (
            detail ? (
              <>
                <div className="title-row">
                  <div>
                    <Link href="/workspace">← All quotations</Link>
                    <p className="eyebrow">
                      QUOTATION / Q-{String(detail.number).padStart(4, "0")}
                    </p>
                    <h1>{detail.title}</h1>
                    <p>
                      {detail.owner.name} · Revision {detail.version} ·{" "}
                      <Badge state={detail.state} />
                    </p>
                  </div>
                  <a
                    className="button secondary"
                    href={"/api/requests/" + id + "/file"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open original PDF <ArrowUpRight size={16} />
                  </a>
                </div>
                {detail.state === "PROCESSING" ? (
                  <section className="card pad">
                    <RefreshCcw size={28} />
                    <h2>Processing your quotation</h2>
                    <p>
                      The separate worker is extracting and validating the PDF.
                      This page refreshes automatically. Start npm run worker if
                      it remains queued.
                    </p>
                  </section>
                ) : (
                  <Review
                    key={detail.id + "-" + detail.version + "-" + detail.state}
                    detail={detail}
                    user={user}
                    busy={busy}
                    mutate={mutate}
                  />
                )}
                <section className="card pad timeline">
                  <h2>Every step, on record.</h2>
                  {detail.events.map((event) => (
                    <div className="timeline-row" key={event.id}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>{label(event.stage)}</strong>
                        <p>{event.detail}</p>
                      </div>
                      <time>{date(event.createdAt)}</time>
                    </div>
                  ))}
                </section>
                <RunPanels
                  jobs={detail.jobs}
                  outbox={detail.purchase?.outbox ?? []}
                  admin={user.role === "ADMIN"}
                  busy={busy}
                  mutate={mutate}
                />
              </>
            ) : (
              <p role="status">Loading quotation…</p>
            )
          ) : view === "upload" ? (
            <>
              <PageTitle
                eyebrow="START A WORKFLOW"
                title="A quotation. A clear next step."
                text="Upload a fictional supplier quotation. We will propose the fields; you make the final checks."
              />
              <Upload
                categories={boot.categories}
                onUploaded={(id) => router.push("/workspace?id=" + id)}
                onError={setError}
              />
            </>
          ) : view === "settings" && adminData ? (
            <>
              <PageTitle
                eyebrow="PROTECTED SETTINGS"
                title="Keep the rules clear."
                text="Thresholds, independent reviewers and controlled destinations."
              />
              <AdminSettings
                key={
                  adminData.policy.threshold +
                  JSON.stringify(adminData.policy.reviewerIds) +
                  adminData.policy.webhookUrl
                }
                data={adminData}
                user={user}
                busy={busy}
                mutate={mutate}
                publicDemo={boot.publicDemo}
              />
            </>
          ) : view === "runs" && adminData ? (
            <>
              <PageTitle
                eyebrow="AUTOMATION HEALTH"
                title="Know what happened. Know what is next."
                text="Waiting for human review is not a failed job. Terminal failures need an explicit retry."
              />
              <RunPanels
                jobs={adminData.jobs}
                outbox={adminData.outbox}
                admin
                busy={busy}
                mutate={mutate}
              />
              <section className="card pad">
                <h2>Controlled test receiver</h2>
                <p>
                  {adminData.receiver.length} unique event(s) recorded. Repeated
                  deliveries have one receiver effect.
                </p>
                {adminData.simulationEnabled && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      mutate("admin", { action: "simulation", failures: 2 })
                    }
                  >
                    Simulate two receiver failures (development only)
                  </button>
                )}
                <h3>Audit history</h3>
                {adminData.events.slice(0, 30).map((e) => (
                  <p key={e.id}>
                    <small>
                      {date(e.createdAt)} · {e.stage}
                    </small>
                    <br />
                    {e.detail}
                  </p>
                ))}
              </section>
            </>
          ) : (
            <>
              <div className="title-row">
                <PageTitle
                  eyebrow={
                    view === "approvals"
                      ? "YOUR REVIEW DESK"
                      : "WORKFLOW OVERVIEW"
                  }
                  title={
                    view === "approvals"
                      ? "Your independent perspective."
                      : "Keep good work moving."
                  }
                  text={
                    view === "approvals"
                      ? "Review the original. Check the numbers. Record your decision."
                      : "From first upload to recorded decision, nothing gets lost in the handover."
                  }
                />
                {user.role === "REQUESTER" && (
                  <Link className="button" href="/workspace?view=upload">
                    <Plus size={17} />
                    New quotation
                  </Link>
                )}
              </div>
              <div className="stats">
                {[
                  [
                    FileText,
                    "Your quotations",
                    requests.length,
                    "In your permitted workspace",
                  ],
                  [
                    Clock3,
                    "Awaiting approval",
                    requests.filter((r) => r.state === "PENDING_APPROVAL")
                      .length,
                    "Waiting for an independent review",
                  ],
                  [
                    CheckCircle2,
                    "Completed",
                    requests.filter((r) => r.state === "COMPLETED").length,
                    "Recorded and notified",
                  ],
                  [
                    AlertCircle,
                    "Needs attention",
                    requests.filter((r) =>
                      ["PROCESSING_FAILED", "CHANGES_REQUESTED"].includes(
                        r.state,
                      ),
                    ).length,
                    "A clear next step",
                  ],
                ].map(([Icon, title, value, text]) => {
                  const I = Icon as typeof FileText;
                  return (
                    <section className="stat" key={String(title)}>
                      <div>
                        {String(title)}
                        <I size={18} />
                      </div>
                      <strong>{String(value)}</strong>
                      <small>{String(text)}</small>
                    </section>
                  );
                })}
              </div>
              <section className="card">
                <div className="card-head">
                  <h2>
                    {view === "approvals"
                      ? "Approval inbox"
                      : "Quotation workspace"}{" "}
                    <span className="count">{rows.length}</span>
                  </h2>
                  <span className="muted">Stored data · most recent 100</span>
                </div>
                <div className="toolbar">
                  <label className="search">
                    Search quotations
                    <input
                      type="search"
                      placeholder="Title, number or requester…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <button className="secondary" onClick={() => void load()}>
                    <RefreshCcw size={16} />
                    Refresh
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Quotation</th>
                        <th>Requester</th>
                        <th>Status</th>
                        <th>Updated</th>
                        <th>
                          <span className="sr-only">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <Link href={"/workspace?id=" + r.id}>
                              <small className="mono">
                                Q-{String(r.number).padStart(4, "0")}
                              </small>
                              <strong>{r.title}</strong>
                            </Link>
                          </td>
                          <td>{r.owner.name}</td>
                          <td>
                            <Badge state={r.state} />
                          </td>
                          <td className="muted">{date(r.updatedAt)}</td>
                          <td>
                            <Link
                              aria-label={"Open " + r.title}
                              href={"/workspace?id=" + r.id}
                            >
                              <ArrowUpRight size={18} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!rows.length && (
                    <div className="empty">
                      <Inbox size={30} />
                      <h3>Nothing here yet.</h3>
                      <p>
                        {user.role === "REQUESTER"
                          ? "Upload a quotation to begin your first workflow."
                          : "Assigned requests will appear here."}
                      </p>
                    </div>
                  )}
                </div>
              </section>
              {boot.notifications.length > 0 && (
                <section className="card pad">
                  <h2>Your updates</h2>
                  {boot.notifications.map((n) => (
                    <p key={n.id}>
                      <Link href={"/workspace?id=" + n.requestId}>
                        {n.message}
                      </Link>
                    </p>
                  ))}
                </section>
              )}
            </>
          )}
          <footer>
            Northstar Studio is fictional. Use sample data only. · FlowOps /
            AI-assisted portfolio
          </footer>
        </main>
      </div>
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="muted">{text}</p>
    </div>
  );
}
function Upload({
  categories,
  onUploaded,
  onError,
}: {
  categories: Category[];
  onUploaded: (id: string) => void;
  onError: (e: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="card pad upload-form"
      encType="multipart/form-data"
      method="post"
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setBusy(true);
        try {
          const response = await fetch("/api/requests", {
            method: "POST",
            body: new FormData(e.currentTarget),
          });
          const result = await response.json();
          if (!response.ok) throw Error(result.error ?? "Upload failed.");
          onUploaded(result.id);
        } catch (e) {
          onError(e instanceof Error ? e.message : "Upload failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="dropzone">
        <FileUp size={35} />
        <h2>The document starts here.</h2>
        <p>Selectable-text PDF · Up to 5 MB · Maximum 10 pages</p>
        <label>
          Choose PDF
          <input
            name="document"
            type="file"
            accept="application/pdf"
            required
          />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Request title
          <input
            name="title"
            placeholder="e.g. Studio equipment quotation"
            minLength={3}
            maxLength={160}
            required
          />
        </label>
        <label>
          Category
          <select name="categoryId" aria-label="Category" required>
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">
        <small>
          Files stay private. PDF text is untrusted data and cannot control
          approvals or destinations. Scanned or unsupported PDFs can be
          completed manually after processing fails.
        </small>
      </p>
      <button disabled={busy}>
        {busy ? "Uploading…" : "Upload & start processing"}
        <ArrowUpRight size={16} />
      </button>
    </form>
  );
}
type Mutate = (url: string, data: unknown, method?: string) => Promise<void>;
function Review({
  detail: r,
  user,
  busy,
  mutate,
}: {
  detail: Detail;
  user: User;
  busy: boolean;
  mutate: Mutate;
}) {
  const [data, setData] = useState<Quotation>(
      r.currentData ?? structuredClone(blank),
    ),
    [sourceView, setSourceView] = useState<"text" | "pdf">(
      r.pageText?.length ? "text" : "pdf",
    ),
    [reason, setReason] = useState(""),
    [decision, setDecision] = useState("APPROVE");
  const editable =
    user.id === r.ownerId &&
    [
      "NEEDS_REVIEW",
      "CHANGES_REQUESTED",
      "PENDING_APPROVAL",
      "PROCESSING_FAILED",
    ].includes(r.state);
  const update = (key: keyof Quotation, value: string) =>
    setData({ ...data, [key]: value || null });
  return (
    <>
      <div className="review-grid">
        <section className="card document-panel">
          <div className="card-head">
            <h2>Original quotation</h2>
            <span className="pill">PRIVATE PDF</span>
          </div>
          <div className="actions source-controls">
            <button
              type="button"
              className="secondary"
              aria-pressed={sourceView === "text"}
              disabled={!r.pageText?.length}
              onClick={() => setSourceView("text")}
            >
              Source text
            </button>
            <button
              type="button"
              className="secondary"
              aria-pressed={sourceView === "pdf"}
              onClick={() => setSourceView("pdf")}
            >
              PDF view
            </button>
          </div>
          {sourceView === "text" && r.pageText?.length ? (
            <div
              className="source-reader"
              role="region"
              aria-label="Original PDF text"
            >
              {r.pageText.map((page) => (
                <article className="source-page" key={page.page}>
                  <span className="pill">Page {page.page}</span>
                  <pre>{page.text}</pre>
                </article>
              ))}
            </div>
          ) : (
            <iframe
              title="Original quotation PDF"
              src={"/api/requests/" + r.id + "/file"}
            />
          )}
          <p className="muted">
            Source text comes directly from the PDF parser, not AI. For
            formatting or an unsupported preview, use “Open original PDF”.
          </p>
        </section>
        <section className="card pad">
          <div className="card-head">
            <h2>
              {editable ? "Check the proposed fields" : "Reviewed quotation"}
            </h2>
            <span className="pill mock">
              {r.extractionProvider?.startsWith("mock")
                ? "MOCK"
                : "REVIEW REQUIRED"}
            </span>
          </div>
          {r.state === "PROCESSING_FAILED" && (
            <p className="alert danger">
              Processing failed. You can enter the quotation manually, or ask an
              administrator to retry.
            </p>
          )}
          <form
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              void mutate(
                "requests/" + r.id,
                { action: "edit", input: { data, version: r.version, reason } },
                "PATCH",
              );
            }}
          >
            <div className="form-grid">
              {(["supplier", "reference", "date", "currency"] as const).map(
                (key) => (
                  <label key={key}>
                    {
                      {
                        supplier: "Supplier name",
                        reference: "Quotation reference",
                        date: "Quotation date",
                        currency: "Currency",
                      }[key]
                    }
                    <input
                      value={data[key] ?? ""}
                      onChange={(e) => update(key, e.target.value)}
                      disabled={!editable}
                      type={key === "date" ? "date" : "text"}
                      maxLength={200}
                    />
                  </label>
                ),
              )}
            </div>
            <h3>Line items</h3>
            {data.items.map((line, i) => (
              <fieldset key={i} disabled={!editable}>
                <legend>Item {i + 1}</legend>
                <label>
                  Description
                  <input
                    value={line.description ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        items: data.items.map((x, j) =>
                          j === i ? { ...x, description: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
                <div className="form-grid three">
                  {(["quantity", "unitPrice", "lineTotal"] as const).map(
                    (key) => (
                      <label key={key}>
                        {
                          {
                            quantity: "Quantity",
                            unitPrice: "Unit price",
                            lineTotal: "Line total",
                          }[key]
                        }
                        <input
                          inputMode="decimal"
                          value={line[key] ?? ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              items: data.items.map((x, j) =>
                                j === i ? { ...x, [key]: e.target.value } : x,
                              ),
                            })
                          }
                        />
                      </label>
                    ),
                  )}
                </div>
                {editable && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setData({
                        ...data,
                        items: data.items.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Remove item {i + 1}
                  </button>
                )}
              </fieldset>
            ))}
            {editable && (
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setData({
                    ...data,
                    items: [
                      ...data.items,
                      {
                        description: "",
                        quantity: "",
                        unitPrice: "",
                        lineTotal: "",
                      },
                    ],
                  })
                }
              >
                + Add line item
              </button>
            )}
            <div className="form-grid three">
              {(["subtotal", "tax", "grandTotal"] as const).map((key) => (
                <label key={key}>
                  {
                    {
                      subtotal: "Subtotal",
                      tax: "Tax",
                      grandTotal: "Grand total",
                    }[key]
                  }
                  <input
                    inputMode="decimal"
                    value={data[key] ?? ""}
                    onChange={(e) => update(key, e.target.value)}
                    disabled={!editable}
                  />
                </label>
              ))}
            </div>
            {editable && (
              <>
                <label>
                  Review / correction reason
                  <textarea
                    value={reason}
                    minLength={5}
                    maxLength={500}
                    required
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What did you check or correct?"
                  />
                </label>
                <p className="muted">
                  <small>
                    Saving creates a new revision and invalidates any previous
                    approval. Values are never silently recalculated.
                  </small>
                </p>
                <button disabled={busy}>Save review & validate</button>
              </>
            )}
          </form>
          {r.validation?.length ? (
            <div className="alert danger">
              <strong>Resolve before submission</strong>
              <ul>
                {r.validation.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : (
            r.currentData && (
              <p className="alert success">
                Stored validation passed. Human review is still required.
              </p>
            )
          )}
          {user.id === r.ownerId && r.state === "NEEDS_REVIEW" && (
            <button
              disabled={busy || !!r.validation?.length}
              onClick={() =>
                mutate("requests/" + r.id, { action: "submit" }, "PATCH")
              }
            >
              Submit for independent approval <ArrowUpRight size={16} />
            </button>
          )}
        </section>
      </div>
      <section className="card pad">
        <h2>Evidence & original extraction</h2>
        <p className="muted">
          Original proposals are kept unchanged. Corrections are separate
          revisions. Missing evidence is not a confidence score.
        </p>
        <details>
          <summary>Show field evidence and original proposals</summary>
          {r.originalExtraction ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Page</th>
                      <th>Supporting text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.originalExtraction.evidence.map((e, i) => (
                      <tr key={i}>
                        <td className="mono">{e.field}</td>
                        <td>{e.page ?? "Unavailable"}</td>
                        <td>{e.excerpt ?? "No verified excerpt"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <pre>{JSON.stringify(r.originalExtraction.data, null, 2)}</pre>
            </>
          ) : (
            <p>
              No original extraction is available. Any saved fields are manual
              entries.
            </p>
          )}
        </details>
        <h3>Review history</h3>
        {r.revisions.map((v) => (
          <p key={v.id}>
            Revision {v.version} · {date(v.createdAt)} — {v.reason}
          </p>
        ))}
        {!r.revisions.length && (
          <p className="muted">No human review saved yet.</p>
        )}
      </section>
      <section className="card pad">
        <h2>Independent approval</h2>
        <p>
          {r.requiredApprovals} approval(s) required for submitted revision{" "}
          {r.submittedVersion ?? "—"}. Assigned:{" "}
          {r.assignments
            .filter((a) => a.version === r.version)
            .map((a) => a.reviewer?.name)
            .join(", ") || "Not submitted"}
          .
        </p>
        {r.decisions.map((d) => (
          <p key={d.id}>
            <Badge state={d.action} /> {d.reviewer.name} · Revision {d.version}
            <br />
            {d.reason}
          </p>
        ))}
        {user.role === "REVIEWER" &&
          r.state === "PENDING_APPROVAL" &&
          r.assignments.some(
            (a) => a.reviewerId === user.id && a.version === r.version,
          ) &&
          !r.decisions.some(
            (d) => d.reviewerId === user.id && d.version === r.version,
          ) && (
            <form
              method="post"
              onSubmit={(e) => {
                e.preventDefault();
                void mutate(
                  "requests/" + r.id,
                  {
                    action: "decide",
                    input: { action: decision, reason, version: r.version },
                  },
                  "PATCH",
                );
              }}
            >
              <label>
                Decision
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <option value="APPROVE">Approve</option>
                  <option value="CHANGES">Request changes</option>
                  <option value="REJECT">Reject</option>
                </select>
              </label>
              <label>
                Decision reason
                <textarea
                  required
                  minLength={5}
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button disabled={busy}>Record decision</button>
            </form>
          )}
        {r.purchase && (
          <div className="alert success">
            <strong>
              PR-{r.purchase.number} · {data.currency}{" "}
              {Number(r.purchase.total).toLocaleString("en-GB", {
                minimumFractionDigits: 2,
              })}
            </strong>
            <p>
              One internal purchase-request record. No order was placed and no
              payment was made.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
function RunPanels({
  jobs,
  outbox,
  admin,
  busy,
  mutate,
}: {
  jobs: Job[];
  outbox: Outbox[];
  admin: boolean;
  busy: boolean;
  mutate: Mutate;
}) {
  return (
    <section className="card pad">
      <h2>Processing & delivery runs</h2>
      {jobs.map((j) => (
        <article className="run" key={j.id}>
          <div>
            <strong>PDF extraction</strong>
            <Badge state={j.state} />
          </div>
          <p>
            Attempts {j.attempts}/{j.maxAttempts} ·{" "}
            {j.lastError ??
              "Persisted job; technical retries are separate from human review."}
          </p>
          {j.attemptsLog.map((a) => (
            <p className="muted" key={a.id}>
              <small>
                {date(a.startedAt)} · Attempt {a.attempt} · {a.state}:{" "}
                {a.detail}
              </small>
            </p>
          ))}
          {admin && j.state === "FAILED" && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                mutate("admin", {
                  action: "retry",
                  input: { kind: "job", id: j.id },
                })
              }
            >
              Retry failed extraction
            </button>
          )}
        </article>
      ))}
      {outbox.map((o) => (
        <article className="run" key={o.id}>
          <div>
            <strong>Signed notification</strong>
            <Badge state={o.state} />
          </div>
          <p>
            {o.destination === "test://flowops"
              ? "Controlled test receiver"
              : o.destination}{" "}
            · Attempts {o.attempts}/{o.maxAttempts}
          </p>
          {o.deliveries.map((d) => (
            <p key={d.id}>
              <small>
                {date(d.createdAt)} · {d.status ?? "Transport error"} ·{" "}
                {d.outcome}
              </small>
            </p>
          ))}
          {o.lastError && <p className="danger-text">{o.lastError}</p>}
          {admin && o.state === "FAILED" && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                mutate("admin", {
                  action: "retry",
                  input: { kind: "outbox", id: o.id },
                })
              }
            >
              Retry failed delivery
            </button>
          )}
        </article>
      ))}
      {!jobs.length && !outbox.length && (
        <p className="muted">No technical runs yet.</p>
      )}
    </section>
  );
}
function AdminSettings({
  data,
  user,
  busy,
  mutate,
  publicDemo,
}: {
  data: AdminData;
  user: User;
  busy: boolean;
  mutate: Mutate;
  publicDemo: boolean;
}) {
  const [threshold, setThreshold] = useState(String(data.policy.threshold)),
    [reviewers, setReviewers] = useState(data.policy.reviewerIds),
    [url, setUrl] = useState(data.policy.webhookUrl ?? "");
  return (
    <>
      <section className="card pad">
        <h2>Approval policy</h2>
        <p>
          LKR only. Totals below the threshold require one independent reviewer;
          totals at or above it require two distinct reviewers. Policy is
          snapshotted through each submission&apos;s assignments.
        </p>
        {publicDemo && (
          <p className="alert">
            Public demo configuration changes are disabled.
          </p>
        )}
        <form
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            void mutate("admin", {
              action: "policy",
              threshold,
              reviewerIds: reviewers,
              webhookUrl: url || null,
            });
          }}
        >
          <label>
            Two-reviewer threshold (LKR)
            <input
              value={threshold}
              inputMode="decimal"
              onChange={(e) => setThreshold(e.target.value)}
              required
            />
          </label>
          <fieldset>
            <legend>Independent reviewers</legend>
            {data.users
              .filter((u) => u.role === "REVIEWER" && u.active)
              .map((u) => (
                <label className="check" key={u.id}>
                  <input
                    type="checkbox"
                    checked={reviewers.includes(u.id)}
                    onChange={(e) =>
                      setReviewers(
                        e.target.checked
                          ? [...reviewers, u.id]
                          : reviewers.filter((id) => id !== u.id),
                      )
                    }
                  />
                  {u.name}
                </label>
              ))}
          </fieldset>
          <label>
            Webhook destination
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Leave blank for the controlled test receiver"
            />
          </label>
          <p className="muted">
            External destinations must use public HTTPS DNS names.
            Private/reserved addresses and redirects are blocked. A blank field
            uses the signed in-process test receiver.
          </p>
          <button disabled={busy || publicDemo}>Save approval policy</button>
        </form>
      </section>
      <section className="card pad">
        <h2>Categories</h2>
        {data.categories.map((c) => (
          <div className="setting-row" key={c.id}>
            <span>
              {c.name} · {c.active ? "Active" : "Archived"}
            </span>
            <button
              className="secondary"
              disabled={busy || publicDemo}
              onClick={() =>
                mutate("admin", {
                  action: "category",
                  id: c.id,
                  name: c.name,
                  active: !c.active,
                })
              }
            >
              {c.active ? "Archive" : "Restore"}
            </button>
          </div>
        ))}
        <form
          className="inline"
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void mutate("admin", {
              action: "category",
              name: String(f.get("name")),
            });
            e.currentTarget.reset();
          }}
        >
          <label>
            New category
            <input name="name" required minLength={2} maxLength={80} />
          </label>
          <button disabled={busy || publicDemo}>Add category</button>
        </form>
      </section>
      <section className="card pad">
        <h2>People & permissions</h2>
        <p className="muted">
          Role changes revoke existing sessions. You cannot change your own
          role.
        </p>
        {data.users.map((u) => (
          <div className="setting-row" key={u.id}>
            <div>
              <strong>{u.name}</strong>
              <small>{u.email}</small>
            </div>
            <label>
              <span className="sr-only">Role for {u.name}</span>
              <select
                value={u.role}
                disabled={busy || u.id === user.id || publicDemo}
                onChange={(e) =>
                  mutate("admin", {
                    action: "role",
                    id: u.id,
                    role: e.target.value,
                  })
                }
              >
                <option>REQUESTER</option>
                <option>REVIEWER</option>
                <option>ADMIN</option>
              </select>
            </label>
          </div>
        ))}
      </section>
    </>
  );
}
