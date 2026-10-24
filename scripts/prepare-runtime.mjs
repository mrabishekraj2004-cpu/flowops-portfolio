import { mkdir, lstat, symlink, realpath } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
const root = process.cwd(),
  link = path.join(root, ".flowops-runtime");
async function junction(target, location) {
  let existing;
  try {
    existing = await lstat(location);
  } catch {}
  if (existing) {
    if (
      !existing.isSymbolicLink() ||
      path.resolve(await realpath(location)).toLowerCase() !==
        path.resolve(target).toLowerCase()
    )
      throw Error("Refusing to replace an existing runtime path.");
  } else await symlink(target, location, "junction");
}
if (process.platform === "win32" && /onedrive/i.test(root)) {
  const base = path.join(
    os.tmpdir(),
    "flowops-runtime-" +
      createHash("sha256")
        .update(root.toLowerCase())
        .digest("hex")
        .slice(0, 12),
  );
  const target = path.join(base, "build");
  await mkdir(target, { recursive: true });
  await junction(
    path.join(root, "node_modules"),
    path.join(base, "node_modules"),
  );
  await junction(target, link);
  console.log(
    "Generated output uses a dedicated local cache outside OneDrive; source and private data remain in FlowOps.",
  );
} else await mkdir(link, { recursive: true });
