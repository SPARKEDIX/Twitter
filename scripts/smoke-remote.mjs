// Smoke-tests the deployed bot endpoints on a Vercel URL.
const base = process.argv[2] ?? "https://twiettfarm.vercel.app";
const secret = process.argv[3] ?? "";

async function probe(label, url) {
  const started = Date.now();
  try {
    const r = await fetch(url);
    const ct = r.headers.get("content-type") ?? "";
    const t = await r.text();
    let json = null;
    try { json = JSON.parse(t); } catch {}
    console.log(`${r.status} ${label}  ct=${ct.split(";")[0]}  ${Date.now() - started}ms`);
    if (json) return json;
    console.log(`   not JSON: ${t.slice(0, 120).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.log(`ERR ${label} -> ${e.message}`);
  }
  return null;
}

console.log(`Target: ${base}\n`);

const feed = await probe("GET /api/bots/feed", `${base}/api/bots/feed?limit=5`);
if (feed) {
  console.log(`   store=${feed.store} tweets=${feed.tweets?.length}`);
  for (const t of feed.tweets ?? []) {
    console.log(`   @${t.bot?.username}: ${t.content?.slice(0, 80)}…`);
  }
}

console.log("");
const convs = await probe("GET /api/bots/conversations", `${base}/api/bots/conversations?limit=5`);
if (convs) {
  console.log(`   store=${convs.store} conversations=${convs.conversations?.length}`);
  for (const c of convs.conversations ?? []) {
    console.log(`   ${c.participants.map((p) => "@" + p.username).join(" <-> ")} (${c.messages.length} msgs)`);
  }
}

console.log("");
const qs = secret ? `?secret=${secret}` : "?force=true";
await probe("GET /api/bots/tick", `${base}/api/bots/tick${qs}`);
