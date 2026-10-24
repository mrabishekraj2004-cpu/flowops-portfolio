import Link from "next/link";
import {
  ArrowUpRight,
  GitBranch,
  FileCheck2,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";
export default function Home() {
  return (
    <main id="main" className="landing">
      <nav>
        <Link className="brand" href="/">
          <span className="logo">
            <GitBranch size={22} />
          </span>
          FlowOps<span className="muted"> / portfolio 02</span>
        </Link>
        <Link className="button" href="/login">
          Open workspace <ArrowUpRight size={16} />
        </Link>
      </nav>
      <section className="hero">
        <div>
          <span className="eyebrow">FROM DOCUMENT TO DECISION</span>
          <h1>
            Less chasing.
            <br />
            More <em>flow.</em>
          </h1>
          <p>
            A quotation arrives. The details are checked. The right people
            approve. Every step leaves a trail.
          </p>
          <div className="actions">
            <Link className="button" href="/login">
              Explore the workspace <ArrowUpRight size={17} />
            </Link>
            <a className="button secondary" href="/case-study">
              Behind the project
            </a>
          </div>
          <small>
            Fictional organisation · Human approvals · No orders or payments
          </small>
        </div>
        <aside className="pipeline">
          <div className="card-head">
            <strong>One clear path</strong>
            <span className="pill">WORKFLOW</span>
          </div>
          {[
            "01 / Upload a quotation",
            "02 / Extract & validate",
            "03 / Review the evidence",
            "04 / Independent approval",
            "05 / Record & notify",
          ].map((s, i) => (
            <div className="flow-step" key={s}>
              <span className={i === 2 ? "step active" : "step"}>{i + 1}</span>
              <div>
                <strong>{s.slice(5)}</strong>
                <small>
                  {
                    [
                      "Private PDF storage",
                      "Mock or optional live AI",
                      "People remain in control",
                      "One or two reviewers",
                      "Durable, traceable delivery",
                    ][i]
                  }
                </small>
              </div>
              <span className="muted">↗</span>
            </div>
          ))}
        </aside>
      </section>
      <section className="landing-grid">
        {[
          [
            FileCheck2,
            "Evidence beside every proposal",
            "Keep the original PDF, extraction, corrections and decision history.",
          ],
          [
            ShieldCheck,
            "Clear boundaries",
            "Private requester documents and independent assigned reviewers.",
          ],
          [
            RefreshCcw,
            "Failure is part of the workflow",
            "Persistent jobs, bounded retries, safe recovery and signed notifications.",
          ],
        ].map(([Icon, title, description]) => {
          const I = Icon as typeof FileCheck2;
          return (
            <article className="card pad" key={String(title)}>
              <I size={25} />
              <h2>{String(title)}</h2>
              <p>{String(description)}</p>
            </article>
          );
        })}
      </section>
      <section className="card pad contribution">
        <span className="eyebrow">BUILT TO LEARN, OPEN TO INSPECTION</span>
        <h2>An honest portfolio project.</h2>
        <p>
          Abishek Akash · Seeking a first IT opportunity in Colombo. Built with
          AI assistance to practise workflow design, access control, testing and
          troubleshooting. No customers, employment or business results are
          claimed.
        </p>
        <p>
          Public portfolio demo hosted on Vercel with private PostgreSQL storage
          and durable processing. Extraction uses a deterministic mock, not AI.
          Live AI is optional and remains unverified.
        </p>
        <a href="/case-study">Read the implementation and limitations →</a>
      </section>
      <footer>FlowOps · Fictional quotations. Real workflow rules.</footer>
    </main>
  );
}
