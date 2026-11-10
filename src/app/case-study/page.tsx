import Link from "next/link";
export default function CaseStudy() {
  return (
    <main id="main" className="article">
      <Link href="/">← FlowOps</Link>
      <span className="eyebrow">PROJECT CASE STUDY</span>
      <h1>A decision should have a trail.</h1>
      <p className="lead">
        FlowOps turns a fictional supplier quotation into an internal purchase
        request through human review and independent approval.
      </p>
      <h2>What I am practising</h2>
      <p>
        Business rules, private files, persistent background work, validation,
        signed webhook delivery, and truthful testing evidence. AI assisted the
        code, design and documentation. This is a learning project, not customer
        work.
      </p>
      <h2>How it works</h2>
      <p>
        Next.js serves the interface and protected APIs. Prisma stores records
        in PostgreSQL. A durable worker leases persistent jobs, extracts
        selectable PDF text and validates proposed fields. Humans correct and
        approve. The final approval creates exactly one internal record and an
        outbox event in the same transaction.
      </p>
      <h2>Where AI stops</h2>
      <p>
        The mock parser supports labelled sample quotations. An optional
        structured-output provider can propose fields from bounded text. Neither
        provider can assign reviewers, approve a request or send a notification.
        Server rules remain responsible for every decision.
      </p>
      <h2>Honest limitations</h2>
      <p>
        No OCR, payments, supplier communication, real orders or multi-currency
        conversion. Local PGlite is a development PostgreSQL-compatible engine;
        the hosted demo uses Neon PostgreSQL for records and private PDFs, and
        Vercel Workflow for queued processing. Live AI, OCR and production load
        capacity remain unverified.
      </p>
      <h2>Evidence</h2>
      <p>
        The GitHub repository includes fictional fixtures, expected values,
        evaluations and automated tests. Login details remain private.
      </p>
      <p>
        <a href="https://github.com/mrabishekraj2004-cpu/flowops-portfolio">
          GitHub source
        </a>{" "}
        ·{" "}
        <a href="/evidence/evaluation-results.json">Mock evaluation data</a>
      </p>
      <Link className="button" href="/login">
        Open workspace
      </Link>
    </main>
  );
}
