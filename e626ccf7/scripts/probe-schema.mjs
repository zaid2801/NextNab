import fs from "node:fs";

const env = {};
for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) continue;
  env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
const ZERO = "00000000-0000-0000-0000-000000000000";

async function get(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  return { status: r.status, body: await r.text() };
}

async function rpc(fn, args) {
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  return { status: r.status, body: await r.text() };
}

function code(body) {
  try {
    return JSON.parse(body).code ?? "";
  } catch {
    return "";
  }
}
function msg(body) {
  try {
    return (JSON.parse(body).message ?? "").slice(0, 90);
  } catch {
    return body.slice(0, 90);
  }
}

console.log("== TABLES (read-only, limit=0) ==");
for (const t of [
  "wishlists",
  "notifications",
  "payouts",
  "orders",
  "products",
  "stores",
  "locations",
  "payments",
  "service_bookings",
  "delivery_assignments",
]) {
  const r = await get(`${t}?select=*&limit=0`);
  const c = code(r.body);
  let verdict;
  if (r.status === 200) verdict = "EXISTS";
  else if (c === "PGRST205" || c === "42P01") verdict = "MISSING";
  else if (c === "42501") verdict = "EXISTS (RLS denied select)";
  else verdict = `UNKNOWN ${r.status}/${c}`;
  console.log(`  ${t.padEnd(22)} ${verdict}`);
}

console.log("\n== COLUMNS added by pending migrations ==");
for (const [t, col] of [
  ["stores", "slug"],
  ["stores", "latitude"],
  ["stores", "area_id"],
  ["locations", "latitude"],
  ["orders", "cancelled_at"],
]) {
  const r = await get(`${t}?select=${col}&limit=0`);
  const c = code(r.body);
  let verdict;
  if (r.status === 200) verdict = "EXISTS";
  else if (c === "PGRST204" || c === "PGRST205") verdict = "MISSING";
  else verdict = `UNKNOWN ${r.status}/${c}`;
  console.log(`  ${t}.${col.padEnd(14)} ${verdict}`);
}

console.log("\n== FUNCTIONS (abort-guaranteed args, read-only in effect) ==");
const probes = [
  ["place_order", { _address_id: ZERO, _delivery_address: "probe", _method: "cod", _items: [] }],
  ["notify_user", { _user_id: ZERO, _title: "probe" }],
  ["cancel_order", { p_order_id: ZERO }],
  ["cancel_booking", { p_booking_id: ZERO }],
  ["admin_set_order_status", { p_order_id: ZERO, p_status: "placed" }],
  ["admin_set_payment_status", { p_payment_id: ZERO, p_status: "pending" }],
  ["admin_set_partner_flag", { p_table: "stores", p_id: ZERO, p_flag: "is_live", p_value: false }],
];
for (const [fn, args] of probes) {
  const r = await rpc(fn, args);
  const c = code(r.body);
  let verdict;
  if (c === "PGRST202") verdict = "MISSING (function not found)";
  else if (c === "PGRST203") verdict = "AMBIGUOUS overloads";
  else if (r.status >= 400) verdict = `EXISTS (raised: ${msg(r.body)})`;
  else verdict = `EXISTS (unexpected success ${r.status})`;
  console.log(`  ${fn.padEnd(24)} ${verdict}`);
}

console.log("\n== BASELINE ROW COUNTS (publicly readable, anon key) ==");
for (const t of ["products", "stores", "locations", "service_categories"]) {
  const r = await fetch(`${URL}/rest/v1/${t}?select=*`, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const cr = r.headers.get("content-range");
  console.log(`  ${t.padEnd(20)} ${r.status === 206 || r.status === 200 ? cr : `HTTP ${r.status}`}`);
}
