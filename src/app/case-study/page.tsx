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
        in PostgreSQL. A separate Node worker leases persistent jobs, extracts
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
        a hosted app needs ordinary persistent PostgreSQL, private shared
        storage and a separately running worker. Live extraction and a public
        deployment require separate verification.
      </p>
      <h2>Evidence</h2>
      <p>
        The local repository includes fictional fixtures, expected values,
        evaluations, automated tests and docs/test-results.md. Only executed
        checks are reported there. Login details remain private.
      </p>
      <p>
        <a href="/evidence/test-results.md">Executed test results</a> ·{" "}
        <a href="/evidence/evaluation-results.json">Mock evaluation data</a> ·{" "}
        <a href="/evidence/automation.md">Automation design</a>
      </p>
      <Link className="button" href="/login">
        Open workspace
      </Link>
    </main>
  );
}
