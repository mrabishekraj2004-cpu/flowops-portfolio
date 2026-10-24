import {
  test,
  expect,
  type APIRequestContext,
  type BrowserContext,
} from "@playwright/test";
import { readFile } from "node:fs/promises";
const base = "http://127.0.0.1:3100";
const accounts = JSON.parse(
  await readFile(".local/credentials.json", "utf8"),
) as Record<string, { id: string; email: string; password: string }>;
test.setTimeout(180000);
const production = process.env.FLOWOPS_E2E_PRODUCTION === "true";
async function signIn(request: APIRequestContext, role: string) {
  const a = accounts[role];
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await request.post(base + "/api/auth/sign-in/email", {
      data: { email: a.email, password: a.password },
      headers: { Origin: base },
    });
    if (response.status() === 429) {
      await new Promise((resolve) => setTimeout(resolve, 11000));
      continue;
    }
    expect(response.status()).toBe(200);
    return;
  }
  throw Error("Sign-in remained rate limited.");
}

test("HTTP sessions, role boundaries, private files, origin checks and webhook signatures", async ({
  playwright,
}) => {
  const anon = await playwright.request.newContext();
  expect((await anon.get(base + "/api/bootstrap")).status()).toBe(401);
  const requester = await playwright.request.newContext(),
    other = await playwright.request.newContext(),
    admin = await playwright.request.newContext(),
    reviewer = await playwright.request.newContext();
  try {
    await signIn(requester, "requester");
    await signIn(other, "other");
    await signIn(admin, "admin");
    await signIn(reviewer, "reviewer");
    const boot = await (await requester.get(base + "/api/bootstrap")).json();
    const upload = await requester.post(base + "/api/requests", {
      headers: { Origin: base },
      multipart: {
        title: "HTTP security check",
        categoryId: boot.categories[0].id,
        document: {
          name: "clean.pdf",
          mimeType: "application/pdf",
          buffer: await readFile("fixtures/pdfs/clean.pdf"),
        },
      },
    });
    expect(upload.status()).toBe(200);
    const r = await upload.json();
    expect((await other.get(base + "/api/requests/" + r.id)).status()).toBe(
      404,
    );
    expect(
      (await other.get(base + "/api/requests/" + r.id + "/file")).status(),
    ).toBe(404);
    expect(
      (await anon.get(base + "/api/requests/" + r.id + "/file")).status(),
    ).toBe(401);
    expect(
      (await requester.get(base + "/api/requests/" + r.id + "/file")).status(),
    ).toBe(200);
    expect((await requester.get(base + "/api/admin")).status()).toBe(403);
    expect(
      (
        await reviewer.post(base + "/api/requests", {
          headers: { Origin: base },
          multipart: { title: "Forbidden", categoryId: boot.categories[0].id },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await requester.patch(base + "/api/requests/" + r.id, {
          headers: { Origin: "https://wrong.example" },
          data: { action: "submit" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await anon.post(base + "/api/webhooks/test", {
          data: { eventId: "invalid" },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await admin.post(base + "/api/admin", {
          headers: { Origin: base },
          data: { action: "role", id: accounts.admin.id, role: "REQUESTER" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await requester.post(base + "/api/auth/sign-out", {
          data: {},
          headers: { Origin: base },
        })
      ).status(),
    ).toBe(200);
    expect((await requester.get(base + "/api/bootstrap")).status()).toBe(401);
  } finally {
    await Promise.all(
      [anon, requester, other, admin, reviewer].map((c) => c.dispose()),
    );
  }
});
test("browser upload, evidence review, independent approval, notification and responsive UI", async ({
  browser,
}) => {
  let requester: BrowserContext | undefined,
    reviewer: BrowserContext | undefined,
    admin: BrowserContext | undefined;
  try {
    admin = await browser.newContext();
    await signIn(admin.request, "admin");
    expect(
      (
        await admin.request.post(base + "/api/admin", {
          headers: { Origin: base },
          data: { action: "simulation", failures: 2 },
        })
      ).status(),
    ).toBe(production ? 403 : 200);
    requester = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await requester.newPage();
    await page.goto(base + "/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email address").fill(accounts.requester.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(accounts.requester.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/workspace", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: "Keep good work moving." }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "New quotation", exact: true })
      .click();
    await page
      .getByLabel("Choose PDF")
      .setInputFiles("fixtures/pdfs/clean.pdf");
    const title = "Browser quotation " + Date.now();
    await page.getByLabel("Request title").fill(title);
    await page
      .getByLabel("Category", { exact: true })
      .selectOption({ index: 1 });
    await page
      .getByRole("button", { name: "Upload & start processing" })
      .click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Supplier name")).toHaveValue(
      "Cedar Office Supplies",
      { timeout: 90000 },
    );
    await page
      .getByText("Show field evidence and original proposals", { exact: true })
      .click();
    await expect(
      page.getByRole("cell", { name: "supplier", exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Review / correction reason")
      .fill(
        "Checked all quotation labels and totals against the original PDF.",
      );
    await page
      .getByRole("button", { name: "Save review & validate", exact: true })
      .click();
    await expect(page.getByText(/Maya Silva · Revision 2/)).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Original PDF text" }),
    ).toContainText("Supplier: Cedar Office Supplies");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "public/screenshots/review-desktop.png",
      fullPage: true,
    });
    await page
      .getByRole("button", {
        name: "Submit for independent approval",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Pending Approval", { exact: true }),
    ).toBeVisible();
    const requestId = new URL(page.url()).searchParams.get("id")!;
    reviewer = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await signIn(reviewer.request, "reviewer");
    const review = await reviewer.newPage();
    await review.goto(base + "/workspace?id=" + requestId);
    await review
      .getByLabel("Decision reason")
      .fill(
        "Independently compared quotation fields, arithmetic and source evidence.",
      );
    await review
      .getByRole("button", { name: "Record decision", exact: true })
      .click();
    await expect(
      review.getByText(/One internal purchase-request record/),
    ).toBeVisible();
    await expect(review.getByText("Completed", { exact: true })).toBeVisible({
      timeout: 60000,
    });
    const data = await (
      await admin.request.get(base + "/api/requests/" + requestId)
    ).json();
    expect(
      data.purchase.outbox[0].deliveries.map(
        (d: { status: number }) => d.status,
      ),
    ).toEqual(production ? [200] : [503, 503, 200]);
    expect(data.purchase.outbox[0].state).toBe("SUCCEEDED");
    const adminPage = await admin.newPage();
    await adminPage.setViewportSize({ width: 1440, height: 1000 });
    await adminPage.goto(base + "/workspace?view=runs");
    await expect(
      adminPage.getByRole("heading", {
        name: "Know what happened. Know what is next.",
      }),
    ).toBeVisible();
    await adminPage.screenshot({
      path: "public/screenshots/runs-desktop.png",
      fullPage: true,
    });
    await page.goto(base + "/workspace");
    await expect(
      page.getByRole("heading", { name: "Keep good work moving." }),
    ).toBeVisible();
    await page.screenshot({
      path: "public/screenshots/dashboard-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: "public/screenshots/dashboard-mobile.png",
      fullPage: true,
    });
    await page.goto(base + "/");
    await page.screenshot({
      path: "public/screenshots/portfolio-mobile.png",
      fullPage: true,
    });
    await page.goto(base + "/workspace");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
  } finally {
    await Promise.all(
      [requester, reviewer, admin]
        .filter((c): c is BrowserContext => Boolean(c))
        .map((c) => c.close()),
    );
  }
});
test("sign-in does not put passwords in URLs when JavaScript is unavailable", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.route("**/login", async (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 200,
            contentType: "text/html",
            body: "Checked",
          })
        : route.continue(),
    );
    await page.goto(base + "/login");
    await page
      .getByLabel("Email address")
      .fill("fictional-form-check@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill("Fictional-form-check-only");
    const sent = page.waitForRequest((r) => r.method() === "POST");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    expect(new URL((await sent).url()).search).toBe("");
  } finally {
    await context.close();
  }
});
