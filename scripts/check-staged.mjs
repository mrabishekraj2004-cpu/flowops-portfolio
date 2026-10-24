import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { parse } from "dotenv";
import { createHash } from "node:crypto";
const args = ["-c", "safe.directory=" + process.cwd().replaceAll("\\", "/")];
const git = (...a) => execFileSync("git", [...args, ...a]);
const paths = git("diff", "--cached", "--name-only", "-z")
  .toString()
  .split("\0")
  .filter(Boolean);
assert.ok(paths.length, "No staged files.");
const secrets = [];
if (existsSync(".env")) {
  const env = parse(readFileSync(".env"));
  for (const key of ["BETTER_AUTH_SECRET", "WEBHOOK_SECRET", "OPENAI_API_KEY"])
    if (env[key]) secrets.push(env[key]);
  try {
    const p = new URL(env.DATABASE_URL).password;
    if (p) secrets.push(decodeURIComponent(p));
  } catch {}
}
if (existsSync(".local/credentials.json"))
  for (const a of Object.values(
    JSON.parse(readFileSync(".local/credentials.json", "utf8")),
  ))
    secrets.push(a.password);
if (existsSync(".local"))
  for (const entry of readdirSync(".local", { withFileTypes: true })) {
    const p = path.join(".local", entry.name, "credentials.json");
    if (entry.name.startsWith("test-") && existsSync(p))
      for (const a of Object.values(JSON.parse(readFileSync(p, "utf8"))))
        secrets.push(a.password);
  }
for (const file of [
  ".local/hosted-credentials.json",
  ".local/hosted-config.json",
]) {
  if (!existsSync(file)) continue;
  const values = JSON.parse(readFileSync(file, "utf8"));
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "object" && value && "password" in value)
      secrets.push(value.password);
    if (key.endsWith("SECRET") && typeof value === "string")
      secrets.push(value);
  }
}
if (existsSync(".local/production.env")) {
  const env = parse(readFileSync(".local/production.env"));
  for (const key of ["POSTGRES_PASSWORD", "PGPASSWORD"])
    if (env[key]) secrets.push(env[key]);
  for (const key of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
    try {
      const pw = new URL(env[key]).password;
      if (pw) secrets.push(decodeURIComponent(pw));
    } catch {}
  }
}
const hash = createHash("sha256");
for (const p of paths) {
  assert.ok(
    !/^(\.local\/|node_modules\/|\.next\/|\.runtime-build\/|\.flowops-runtime\/|src\/generated\/|test-results\/|playwright-report\/)/.test(
      p,
    ),
    "Excluded path staged: " + p,
  );
  assert.ok(
    !p.startsWith(".env") || p === ".env.example",
    "Private environment file staged.",
  );
  const content = git("show", ":" + p);
  for (const secret of secrets)
    assert.ok(
      !content.includes(Buffer.from(secret)),
      "Private value found in " + p,
    );
  assert.ok(
    !/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{25,}/.test(
      content.toString(),
    ),
    "Possible key/token in " + p,
  );
  hash.update(p).update(content);
}
console.log(
  "Reviewed " +
    paths.length +
    " staged files: excluded paths, actual local/demo/test secrets and key patterns absent. Content digest " +
    hash.digest("hex"),
);
