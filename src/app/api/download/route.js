// NOVA — Download proxy
// Streams a remote media file through our server so the user gets a real
// "Save As" download instead of the browser opening the video in a new tab.
// This also bypasses CORS restrictions some CDNs have for direct downloads.

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "download";

    if (!targetUrl) {
      return Response.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Validate it's a real URL
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Allow only http(s) — prevent SSRF to internal services
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return Response.json({ error: "Unsupported protocol" }, { status: 400 });
    }

    // Block internal/private IPs
    const hostname = parsed.hostname.toLowerCase();
    const blocked = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "169.254.169.254", // AWS metadata
    ];
    if (
      blocked.includes(hostname) ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return Response.json({ error: "Blocked host" }, { status: 400 });
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: parsed.origin,
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return Response.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    // Determine extension from content type
    let ext = "bin";
    if (contentType.includes("mp4") || contentType.includes("video"))
      ext = "mp4";
    else if (contentType.includes("mpeg") || contentType.includes("audio"))
      ext = "mp3";
    else if (contentType.includes("webm")) ext = "webm";
    else if (contentType.includes("jpeg") || contentType.includes("jpg"))
      ext = "jpg";
    else if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";

    // Sanitize filename
    const cleanName =
      String(filename)
        .replace(/[^\w\u0600-\u06FF.\- ]/g, "")
        .slice(0, 80)
        .trim() || "download";

    const finalName = cleanName.includes(".")
      ? cleanName
      : `${cleanName}.${ext}`;

    const headers = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="download.${ext}"; filename*=UTF-8''${encodeURIComponent(finalName)}`,
      "Cache-Control": "no-store",
    };
    if (contentLength) headers["Content-Length"] = contentLength;

    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    console.error("Download proxy error:", err);
    return Response.json(
      { error: err.message || "Proxy failed" },
      { status: 500 },
    );
  }
}
