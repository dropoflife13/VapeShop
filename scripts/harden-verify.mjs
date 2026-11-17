import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

// 1. BN-00: All 8 core agents + brain/ must exist
const requiredAgents = [
  "productmanageragent.md",
  "uiuxagent.md",
  "growthagent.md",
  "systemsdesignagent.md",
  "integrationagent.md",
  "dbaagent.md",
  "securityagent.md",
  "researchagent.md",
];
for (const agent of requiredAgents) {
  check(
    existsSync(join(ROOT, "agents", agent)),
    `BN-00 FAIL: Missing agents/${agent}`
  );
}
check(existsSync(join(ROOT, "brain")), "BN-00 FAIL: Missing brain/ directory");

// 2. Collect all migrations & src files
function walk(dir, extFilter) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, extFilter));
    } else if (extFilter(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const migrations = walk(join(ROOT, "supabase", "migrations"), (n) =>
  n.endsWith(".sql")
);
const srcFiles = walk(
  join(ROOT, "src"),
  (n) => n.endsWith(".ts") || n.endsWith(".tsx")
);

check(migrations.length >= 5, `Expected >= 5 SQL migrations, found ${migrations.length}`);

// 3. Zero user_metadata trust anywhere in src/ or supabase/migrations/
for (const file of [...migrations, ...srcFiles]) {
  const content = readFileSync(file, "utf8");
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/--.*$/gm, "");
  check(
    !/user_metadata/i.test(stripped),
    `SEC-01 FAIL: Forbidden user_metadata reference in ${file}`
  );
}

// 4. SQL Forensics: FORCE RLS, P0001 append-only, SECURITY DEFINER search_path = ''
const allSql = migrations
  .map((f) => readFileSync(f, "utf8").replace(/--.*$/gm, ""))
  .join("\n");

const rlsTables = [
  "shops",
  "staff_members",
  "ph_legal_id_types",
  "ph_banned_products",
  "system_settings",
  "system_repairs",
  "suppliers",
  "products",
  "sales_ledger",
  "sales_ledger_items",
  "inventory_movements",
  "product_serials",
  "reservations",
];

for (const table of rlsTables) {
  check(
    new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i").test(allSql),
    `F-26 FAIL: Missing ENABLE ROW LEVEL SECURITY on ${table}`
  );
  check(
    new RegExp(`ALTER TABLE public\\.${table} FORCE ROW LEVEL SECURITY`, "i").test(allSql),
    `F-26 FAIL: Missing FORCE ROW LEVEL SECURITY on ${table}`
  );
}

for (const ledger of ["sales_ledger", "sales_ledger_items", "inventory_movements"]) {
  check(
    new RegExp(`REVOKE UPDATE, DELETE, TRUNCATE ON public\\.${ledger}`, "i").test(allSql),
    `F-20 FAIL: Missing REVOKE UPDATE, DELETE, TRUNCATE on ${ledger}`
  );
  check(
    new RegExp(`BEFORE UPDATE OR DELETE ON public\\.${ledger}`, "i").test(allSql),
    `F-20 FAIL: Missing immutable trigger on ${ledger}`
  );
}

check(/ERRCODE = 'P0001'/.test(allSql), "F-20 FAIL: Missing P0001 error code in append-only trigger");

// Every SECURITY DEFINER must have SET search_path = ''
const secDefinerMatches = [...allSql.matchAll(/SECURITY DEFINER[\s\S]{0,80}/gi)];
for (const match of secDefinerMatches) {
  check(
    /SET search_path = ''/i.test(match[0]),
    `F-31 FAIL: SECURITY DEFINER without SET search_path = '': ${match[0].slice(0, 60)}`
  );
}

// 5. SEC-15: Every API route must use jsonNoStore or no-store, private
const apiRoutes = walk(join(ROOT, "src", "app", "api"), (n) => n === "route.ts");
for (const route of apiRoutes) {
  const content = readFileSync(route, "utf8");
  check(
    content.includes("jsonNoStore") || content.includes("no-store, private"),
    `SEC-15 FAIL: Missing no-store, private cache control in ${route}`
  );
}

if (failures.length > 0) {
  console.error("HARDEN VERIFY FAILED:");
  for (const f of failures) {
    console.error(` - ${f}`);
  }
  process.exit(1);
}

console.log(
  `GATE: PASS — BN-00 (8 agents), ${migrations.length} migrations (FORCE RLS, P0001, F-31), ${apiRoutes.length} API routes (SEC-15), 0 user_metadata references.`
);
