import { mkdir, writeFile, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
await mkdir(".local", { recursive: true });
try {
  await access(".env");
  console.log("Existing .env preserved.");
} catch {
  await writeFile(
    ".env",
    `DATABASE_URL="postgresql://postgres@127.0.0.1:54330/flowops"\nBETTER_AUTH_URL="http://127.0.0.1:3100"\nBETTER_AUTH_SECRET="${randomBytes(48).toString("base64url")}"\nSTORAGE_DIR=".local/documents"\nEXTRACTION_PROVIDER="mock"\nWEBHOOK_SECRET="${randomBytes(48).toString("base64url")}"\nPUBLIC_DEMO="false"\nALLOW_DEV_SIMULATION="true"\n`,
    { mode: 0o600 },
  );
  console.log("Created private local configuration. No secrets displayed.");
}
