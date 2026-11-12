import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);

const headers = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
};

const list = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users?per_page=50`, { headers });
const json = await list.json();
const targets = (json.users ?? []).filter((u) => u.email?.endsWith("@mailto.plus"));
console.log("test users found:", targets.length);
for (const user of targets) {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers,
  });
  console.log("deleted", user.email, res.status);
}
