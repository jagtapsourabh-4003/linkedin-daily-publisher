/**
 * linkedin-post.js - Direct LinkedIn API poster (no Make.com needed)
 * Required env: LINKEDIN_TOKEN, LINKEDIN_PERSON_ID
 * Get token: https://www.linkedin.com/developers/apps
 * Get person ID: curl -H "Authorization: Bearer TOKEN" https://api.linkedin.com/v2/userinfo
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const LINKEDIN_TOKEN = process.env.LINKEDIN_TOKEN || "";
const LINKEDIN_PERSON_ID = process.env.LINKEDIN_PERSON_ID || "";
const HISTORY_FILE = path.join(__dirname, "docs", "data", "history.json");

function getISTDate() {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return istDate.toISOString().split("T")[0];
}

function httpsReq(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d), raw: d }); }
        catch (_) { resolve({ status: res.statusCode, body: null, raw: d }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  if (!LINKEDIN_TOKEN) {
    console.error("ERROR: LINKEDIN_TOKEN env var not set!");
    console.error("Get your token from: https://www.linkedin.com/developers/");
    process.exit(1);
  }

  const today = getISTDate();
  console.log("[LinkedIn Direct] Date:", today);

  let history = [];
  try {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch (e) {
    console.error("Cannot read history.json:", e.message);
    process.exit(1);
  }

  const entry = history.find((h) => h.date === today);
  if (!entry || !entry.posts || !entry.posts.length) {
    console.log("No posts found for", today);
    process.exit(0);
  }

  const post = entry.posts[0];
  const text =
    (post.postContent && post.postContent.content) || post.content || "";
  if (!text) {
    console.error("Post text is empty");
    process.exit(1);
  }

  console.log("[LinkedIn Direct] Post preview:", text.substring(0, 80) + "...");

  // Get personId from userinfo if not provided
  let personId = LINKEDIN_PERSON_ID;
  if (!personId) {
    console.log("[LinkedIn Direct] Fetching person ID from /v2/userinfo...");
    const r = await httpsReq({
      hostname: "api.linkedin.com",
      path: "/v2/userinfo",
      method: "GET",
      headers: {
        Authorization: "Bearer " + LINKEDIN_TOKEN,
        Accept: "application/json",
      },
    });
    if (r.status === 200 && r.body && r.body.sub) {
      personId = r.body.sub;
      console.log("[LinkedIn Direct] Person ID:", personId, "| Name:", r.body.name);
    } else {
      console.error(
        "[LinkedIn Direct] Failed to get person ID:",
        r.status,
        r.raw
      );
      process.exit(1);
    }
  }

  const bodyObj = {
    author: "urn:li:person:" + personId,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const bodyStr = JSON.stringify(bodyObj);
  console.log("[LinkedIn Direct] Posting to LinkedIn API...");

  const r = await httpsReq(
    {
      hostname: "api.linkedin.com",
      path: "/v2/ugcPosts",
      method: "POST",
      headers: {
        Authorization: "Bearer " + LINKEDIN_TOKEN,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
        "X-Restli-Protocol-Version": "2.0.0",
      },
    },
    bodyStr
  );

  if (r.status === 201) {
    console.log("[LinkedIn Direct] SUCCESS! Post created!");
    console.log("[LinkedIn Direct] Post ID:", r.body && r.body.id);
  } else if (r.status === 401) {
    console.error("[LinkedIn Direct] UNAUTHORIZED - Token is expired!");
    console.error("[LinkedIn Direct] Please generate a new access token.");
    console.error("[LinkedIn Direct] Details:", r.raw);
    process.exit(1);
  } else if (r.status === 422) {
    console.error("[LinkedIn Direct] VALIDATION ERROR:", r.raw);
    process.exit(1);
  } else {
    console.error("[LinkedIn Direct] FAILED:", r.status, r.raw);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[LinkedIn Direct] FATAL:", e.message);
  process.exit(1);
});
