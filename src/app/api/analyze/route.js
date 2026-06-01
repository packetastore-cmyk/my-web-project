// NOVA — Universal link analyzer
// Strategy (in order):
// 1. TikTok  → tikwm.com
// 2. YouTube → Piped (api.piped.private.coffee, pipedapi.tokhmi.xyz) then Invidious
// 3. Everything else → Cobalt community instances (apicobalt.mgytr.top, cobaltapi.kittycat.boo, dog.kittycat.boo)
// 4. Last resort → snapany.com (may be unavailable)

import { scrapeMovieSite } from './puppeteer_engine.js';

function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("arabseed") || u.includes("asd.") || u.includes("mycima") || u.includes("wecima") || u.includes("egybest") || u.includes("egbest") || u.includes("akwam") || u.includes("fasel") || u.includes("fushaar") || u.includes("cima4u") || u.includes("shahid") || u.includes("moviz") || u.includes("cimalight")) return "moviesite";
  if (
    u.includes("facebook.com") ||
    u.includes("fb.watch") ||
    u.includes("fb.com")
  )
    return "facebook";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("pinterest.")) return "pinterest";
  if (u.includes("reddit.com")) return "reddit";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("dailymotion.com")) return "dailymotion";
  if (u.includes("twitch.tv")) return "twitch";
  if (u.includes("soundcloud.com")) return "soundcloud";
  if (u.includes("t.me") || u.includes("telegram.")) return "telegram";
  if (u.includes("snapchat.com")) return "snapchat";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("threads.net")) return "threads";
  return "generic";
}

const PLATFORM_NAMES = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  pinterest: "Pinterest",
  reddit: "Reddit",
  vimeo: "Vimeo",
  dailymotion: "Dailymotion",
  twitch: "Twitch",
  soundcloud: "SoundCloud",
  telegram: "Telegram",
  snapchat: "Snapchat",
  linkedin: "LinkedIn",
  threads: "Threads",
  moviesite: "Movies & TV",
  generic: "Web",
};

// ───────────────────────────────────────────────
// 1. TikTok via tikwm.com
// ───────────────────────────────────────────────
async function fetchTikTok(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://www.tikwm.com/",
      },
      body: `url=${encodeURIComponent(url)}&hd=1`,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`TikWM returned ${res.status}`);
    const data = await res.json();
    if (data?.code !== 0 || !data?.data) {
      throw new Error(data?.msg || "TikTok extraction failed");
    }
    const d = data.data;
    const formats = [];
    if (d.hdplay)
      formats.push({
        label: "HD (No watermark)",
        url: d.hdplay.startsWith("http") ? d.hdplay : `https://www.tikwm.com${d.hdplay}`,
        type: "video",
        size: d.hd_size ? `${(d.hd_size / 1024 / 1024).toFixed(1)} MB` : null,
        quality: "HD",
      });
    if (d.play)
      formats.push({
        label: "SD (No watermark)",
        url: d.play.startsWith("http") ? d.play : `https://www.tikwm.com${d.play}`,
        type: "video",
        size: d.size ? `${(d.size / 1024 / 1024).toFixed(1)} MB` : null,
        quality: "SD",
      });
    if (d.wmplay)
      formats.push({
        label: "With watermark",
        url: d.wmplay.startsWith("http") ? d.wmplay : `https://www.tikwm.com${d.wmplay}`,
        type: "video",
        size: d.wm_size ? `${(d.wm_size / 1024 / 1024).toFixed(1)} MB` : null,
        quality: "SD",
      });
    if (d.music)
      formats.push({
        label: "Audio MP3",
        url: d.music.startsWith("http") ? d.music : `https://www.tikwm.com${d.music}`,
        type: "audio",
        size: null,
        quality: "128kbps",
      });
    if (Array.isArray(d.images) && d.images.length > 0) {
      d.images.forEach((img, i) =>
        formats.push({ label: `Image ${i + 1}`, url: img, type: "image", size: null, quality: "Original" })
      );
    }
    return {
      title: d.title || "TikTok Video",
      author: d.author?.nickname || d.author?.unique_id || null,
      duration: d.duration || null,
      views: d.play_count || null,
      thumbnail: d.cover ? (d.cover.startsWith("http") ? d.cover : `https://www.tikwm.com${d.cover}`) : null,
      sourceUrl: url,
      platform: { id: "tiktok", name: "TikTok" },
      formats,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ───────────────────────────────────────────────
// 2. YouTube via Piped (primary) + Invidious (fallback)
// ───────────────────────────────────────────────
// Verified working instances (tested 2026-06-01)
const PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.tokhmi.xyz",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.leptons.xyz",
];

function extractYouTubeId(url) {
  const m = url.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

async function fetchYouTubeViaPiped(videoId) {
  let lastError = null;
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: controller.signal,
        headers: { "User-Agent": "NOVA-Downloader/2.0", Accept: "application/json" },
      });
      clearTimeout(timeout);
      if (!res.ok) { lastError = new Error(`${instance} returned ${res.status}`); continue; }
      const data = await res.json();
      const formats = [];
      const videoStreams = data.videoStreams || [];
      const audioStreams = data.audioStreams || [];
      videoStreams.filter((s) => !s.videoOnly).forEach((s) =>
        formats.push({ label: `${s.quality}`, url: s.url, type: "video", size: null, quality: s.quality })
      );
      videoStreams.filter((s) => s.videoOnly).slice(0, 3).forEach((s) =>
        formats.push({ label: `${s.quality} (video only)`, url: s.url, type: "video", size: null, quality: s.quality })
      );
      const bestAudio = [...audioStreams].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      if (bestAudio) {
        const kbps = Math.round((bestAudio.bitrate || 128000) / 1000);
        formats.push({ label: `Audio ${kbps}kbps`, url: bestAudio.url, type: "audio", size: null, quality: `${kbps}kbps` });
      }
      if (formats.length === 0) { lastError = new Error("No formats from Piped"); continue; }
      return {
        title: data.title || "YouTube Video",
        author: data.uploader || null,
        duration: data.duration || null,
        views: data.views || null,
        thumbnail: data.thumbnailUrl || null,
        formats,
      };
    } catch (err) {
      lastError = err;
      console.error(`Piped ${instance} failed:`, err.message);
    }
  }
  throw lastError || new Error("All Piped instances unavailable");
}

// Cobalt community instances (verified 2026-06-01 from cobalt.directory)
// These support YouTube + most platforms at 87–96% service coverage
const COBALT_INSTANCES = [
  "https://apicobalt.mgytr.top",
  "https://cobaltapi.kittycat.boo",
  "https://dog.kittycat.boo",
  "https://melon.clxxped.lol",
  "https://nuko-c.meowing.de",
];

// cobalt v10 API — returns tunnel URL or picker
async function fetchViaCobalt(url, options = {}) {
  let lastError = null;
  const body = JSON.stringify({ url, videoQuality: "1080", ...options });

  for (const instance of COBALT_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${instance}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = new Error(`${instance} returned ${res.status}: ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await res.json();

      if (data.status === "error") {
        lastError = new Error(data.error?.code || data.text || "Cobalt error");
        continue;
      }

      // "tunnel" status → single direct download
      if (data.status === "tunnel" && data.url) {
        return { tunnelUrl: data.url, filename: data.filename || null };
      }

      // "redirect" status → direct CDN URL
      if (data.status === "redirect" && data.url) {
        return { tunnelUrl: data.url, filename: data.filename || null };
      }

      // "picker" status → multiple items (e.g. Instagram carousel)
      if (data.status === "picker" && Array.isArray(data.picker)) {
        return { picker: data.picker };
      }

      lastError = new Error(`Unexpected cobalt status: ${data.status}`);
    } catch (err) {
      lastError = err;
      console.error(`Cobalt ${instance} failed:`, err.message);
    }
  }
  throw lastError || new Error("All Cobalt instances unavailable");
}

async function fetchYouTube(url) {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  // Try Piped first (gives structured format list)
  try {
    const result = await fetchYouTubeViaPiped(videoId);
    return { ...result, sourceUrl: url, platform: { id: "youtube", name: "YouTube" } };
  } catch (pipedErr) {
    console.error("Piped failed, trying Cobalt for YouTube:", pipedErr.message);
  }

  try {
    // Fallback: Cobalt — fetch multiple qualities
    const [res1080, res720, resAudio] = await Promise.all([
      fetchViaCobalt(url, { videoQuality: "1080" }).catch(() => null),
      fetchViaCobalt(url, { videoQuality: "720" }).catch(() => null),
      fetchViaCobalt(url, { downloadMode: "audio" }).catch(() => null),
    ]);

    const formats = [];
    const addedUrls = new Set();

    function processResult(res, defaultLabel, defaultType, defaultQuality) {
      if (!res || !res.tunnelUrl || addedUrls.has(res.tunnelUrl)) return;
      addedUrls.add(res.tunnelUrl);
      
      let type = defaultType;
      let label = defaultLabel;
      const fn = (res.filename || "").toLowerCase();
      
      if (/\.(jpg|jpeg|png|webp|gif)$/.test(fn)) {
        type = "image";
        label = "Image";
      } else if (/\.(mp3|wav|m4a|ogg)$/.test(fn)) {
        type = "audio";
        label = label.includes("Audio") ? label : "Audio";
      }
      
      formats.push({ label, url: res.tunnelUrl, type, size: null, quality: defaultQuality });
    }

    processResult(res1080, "HD Quality (1080p)", "video", "1080p");
    processResult(res720, "SD Quality (720p)", "video", "720p");
    processResult(resAudio, "Audio MP3", "audio", "Best");

    if (formats.length === 0) {
      // One last try
      const fallback = await fetchViaCobalt(url);
      if (fallback.tunnelUrl) {
        formats.push({ label: "Best quality", url: fallback.tunnelUrl, type: "video", size: null, quality: "Best" });
      } else {
        throw new Error("No formats from Cobalt");
      }
    }

    const bestResult = res1080 || res720 || resAudio || {};
    return {
      title: bestResult.filename?.replace(/\.[^.]+$/, "") || "YouTube Video",
      author: null,
      duration: null,
      views: null,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      sourceUrl: url,
      platform: { id: "youtube", name: "YouTube" },
      formats,
    };
  } catch (cobaltErr) {
    throw new Error(
      `YouTube extraction failed. All services are currently unavailable. Please try again in a few minutes.`,
    );
  }
}

// ───────────────────────────────────────────────
// 3. Universal handler via Cobalt for other platforms
// ───────────────────────────────────────────────
async function fetchViaCobalUniversal(url, platformId) {
  const platformName = PLATFORM_NAMES[platformId] || "Media";
  const formats = [];
  const isAudio = url.includes("soundcloud");

  if (isAudio) {
    const audioResult = await fetchViaCobalt(url);
    if (audioResult.tunnelUrl) {
      formats.push({ label: "Audio", url: audioResult.tunnelUrl, type: "audio", size: null, quality: "Best" });
    }
  } else {
    // Fetch multiple qualities concurrently to provide options
    const [res1080, res720, resAudio] = await Promise.all([
      fetchViaCobalt(url, { videoQuality: "1080" }).catch(() => null),
      fetchViaCobalt(url, { videoQuality: "720" }).catch(() => null),
      fetchViaCobalt(url, { downloadMode: "audio" }).catch(() => null),
    ]);

    const addedUrls = new Set();

    function processResult(res, defaultLabel, defaultType, defaultQuality) {
      if (!res || !res.tunnelUrl || addedUrls.has(res.tunnelUrl)) return;
      addedUrls.add(res.tunnelUrl);
      
      let type = defaultType;
      let label = defaultLabel;
      const fn = (res.filename || "").toLowerCase();
      
      if (/\.(jpg|jpeg|png|webp|gif)$/.test(fn)) {
        type = "image";
        label = "Image";
      } else if (/\.(mp3|wav|m4a|ogg)$/.test(fn)) {
        type = "audio";
        label = label.includes("Audio") ? label : "Audio";
      }
      
      formats.push({ label, url: res.tunnelUrl, type, size: null, quality: defaultQuality });
    }

    processResult(res1080, "HD Quality (1080p/Best)", "video", "1080p");
    processResult(res720, "SD Quality (720p)", "video", "720p");
    processResult(resAudio, "Audio MP3", "audio", "Best");

    // Handle pickers (e.g. Instagram carousel) from the 1080 request
    if (res1080 && res1080.picker && res1080.picker.length > 0) {
      res1080.picker.forEach((item, i) => {
        const isPhoto = item.type === "photo";
        formats.push({
          label: isPhoto ? `Image ${i + 1}` : item.filename || `Video ${i + 1}`,
          url: item.url,
          type: isPhoto ? "image" : "video",
          size: null,
          quality: "Original",
        });
      });
    }
  }

  if (formats.length === 0) {
    // Try one last time with default parameters if everything failed
    const fallback = await fetchViaCobalt(url);
    if (fallback.tunnelUrl) {
      formats.push({ label: "Best quality", url: fallback.tunnelUrl, type: "video", size: null, quality: "Best" });
    } else if (fallback.picker && fallback.picker.length > 0) {
      fallback.picker.forEach((item, i) => {
        formats.push({
          label: item.type === "photo" ? `Image ${i + 1}` : `Video ${i + 1}`,
          url: item.url,
          type: item.type === "photo" ? "image" : "video",
          size: null,
          quality: "Original",
        });
      });
    } else {
      throw new Error("No media found");
    }
  }

  return {
    title: `${platformName} Media`,
    author: null,
    duration: null,
    views: null,
    thumbnail: null,
    sourceUrl: url,
    platform: { id: platformId, name: platformName },
    formats,
  };
}

// ───────────────────────────────────────────────
// 4. SnapAny fallback (may return 404 sometimes)
// ───────────────────────────────────────────────
async function fetchSnapAny(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("https://api.snapany.com/v1/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Origin: "https://snapany.com",
        Referer: "https://snapany.com/",
      },
      body: JSON.stringify({ link: url }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`SnapAny returned ${res.status}`);
    const data = await res.json();
    if (!data?.medias || data.medias.length === 0) throw new Error("No media found");
    const formats = [];
    data.medias.forEach((m, i) => {
      if (!m.resource_url) return;
      const isAudio = m.media_type === "audio";
      const isImage = m.media_type === "image";
      formats.push({
        label: m.quality || (isAudio ? "Audio MP3" : isImage ? `Image ${i + 1}` : `Video ${i + 1}`),
        url: m.resource_url,
        type: isAudio ? "audio" : isImage ? "image" : "video",
        size: null,
        quality: m.quality || null,
      });
    });
    return {
      title: data.text || "Media",
      author: null,
      duration: null,
      views: null,
      thumbnail: data.preview_url || data.medias[0]?.preview_url || null,
      sourceUrl: url,
      formats,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ───────────────────────────────────────────────
// Main POST handler
// ───────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const rawUrl = (body?.url || "").trim();

    if (!rawUrl) return Response.json({ error: "Missing URL" }, { status: 400 });

    let cleanUrl = rawUrl;
    // Extract URL if it's mixed with text (e.g. from mobile share sheet)
    const urlMatch = cleanUrl.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      cleanUrl = urlMatch[0];
    } else if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch {
      return Response.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const platformId = detectPlatform(cleanUrl);

    if (cleanUrl.toLowerCase().includes("whatsapp.com")) {
      return Response.json(
        { error: "WhatsApp Status cannot be downloaded — it uses end-to-end encryption with no public links.", code: "UNSUPPORTED_WHATSAPP" },
        { status: 400 },
      );
    }

    if (platformId === "facebook" && (cleanUrl.includes("photo.php") || cleanUrl.includes("/photo") || cleanUrl.includes("/photos/") || cleanUrl.includes("/posts/") || cleanUrl.includes("/stories/") || cleanUrl.includes("story.php"))) {
      return Response.json(
        { error: "عذراً، بسبب سياسات فيسبوك لا يمكن سحب الصور والقصص (Stories) والمنشورات العادية عبر الموقع. يمكنك حفظ الصور مباشرة من فيسبوك بالضغط عليها مطولاً ثم 'حفظ'. (تحميل فيديوهات وريلز فيسبوك ما زال مدعوماً ويعمل بشكل طبيعي!)" },
        { status: 400 },
      );
    }

    let result = null;
    let primaryError = null;

    // ── Primary fetch ──
    try {
      if (platformId === "moviesite") {
        result = await scrapeMovieSite(cleanUrl);
      } else if (platformId === "tiktok") {
        result = await fetchTikTok(cleanUrl);
      } else if (platformId === "youtube") {
        result = await fetchYouTube(cleanUrl);
      } else {
        // Cobalt handles Instagram, Facebook, Twitter, Reddit, Vimeo, etc.
        result = await fetchViaCobalUniversal(cleanUrl, platformId);
      }
    } catch (err) {
      primaryError = err;
      console.error(`Primary fetch failed for ${platformId}:`, err.message);
    }

    // ── Fallback 1: for non-YouTube, try SnapAny ──
    if (!result && platformId !== "youtube") {
      try {
        result = await fetchSnapAny(cleanUrl);
        result.platform = { id: platformId, name: PLATFORM_NAMES[platformId] };
      } catch (err) {
        console.error("SnapAny fallback failed:", err.message);
      }
    }

    // ── Fallback 2: for TikTok failures, try Cobalt ──
    if (!result && platformId === "tiktok") {
      try {
        result = await fetchViaCobalUniversal(cleanUrl, platformId);
      } catch (err) {
        console.error("Cobalt TikTok fallback failed:", err.message);
      }
    }

    // ── Fallback 3: Universal Web Scraper for any Unknown Site ──
    if (!result && platformId === "generic") {
      try {
        result = await scrapeMovieSite(cleanUrl);
        if (result && result.formats) {
          result.platform = { id: "generic", name: "Web Link" };
        } else {
          result = null;
        }
      } catch (err) {
        console.error("Puppeteer generic fallback failed:", err.message);
      }
    }

    if (!result) {
      return Response.json(
        {
          error: `فشل في جلب الرابط. الخدمات المتاحة مشغولة حالياً أو الرابط غير مدعوم. يرجى المحاولة مجدداً بعد لحظات. (${primaryError?.message || "Service unavailable"})`,
        },
        { status: 502 },
      );
    }

    return Response.json(result);
  } catch (err) {
    console.error("Analyze route error:", err);
    return Response.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}
