// Cloudflare Worker - RtNetdisk API
// 部署到 Cloudflare Workers，绑定 R2 bucket

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

// Supabase JWT 验证
async function verifyToken(token, supabaseUrl, supabaseAnonKey) {
  try {
    const res = await fetch(supabaseUrl + "/auth/v1/user", {
      headers: {
        "Authorization": "Bearer " + token,
        "apikey": supabaseAnonKey
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "") || url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "未授权" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    const user = await verifyToken(token, supabaseUrl, supabaseAnonKey);
    if (!user) {
      return new Response(JSON.stringify({ error: "无效的 token" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    const userId = user.id;
    const bucket = env.R2_BUCKET;

    if (path === "/api/files" && request.method === "GET") {
      const list = await bucket.list({ prefix: userId + "/" });
      const files = list.objects.map(obj => ({
        name: obj.key.replace(userId + "/", ""),
        size: obj.size,
        uploaded: obj.uploaded
      }));
      return new Response(JSON.stringify({ files }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    if (path === "/api/upload" && request.method === "POST") {
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      const ext = contentType.split("/")[1] || "bin";
      const filename = userId + "/" + Date.now() + "." + ext;
      
      await bucket.put(filename, request.body, {
        httpMetadata: { contentType: contentType }
      });

      return new Response(JSON.stringify({ ok: true, name: filename.replace(userId + "/", "") }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    if (path.startsWith("/api/file/") && request.method === "GET") {
      const name = decodeURIComponent(path.replace("/api/file/", ""));
      const obj = await bucket.get(userId + "/" + name);
      if (!obj) {
        return new Response(JSON.stringify({ error: "文件不存在" }), {
          status: 404,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }
      return new Response(obj.body, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
          "Content-Disposition": "attachment; filename=" + encodeURIComponent(name)
        }
      });
    }

    if (path.startsWith("/api/file/") && request.method === "DELETE") {
      const name = decodeURIComponent(path.replace("/api/file/", ""));
      await bucket.delete(userId + "/" + name);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
};