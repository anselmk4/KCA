import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CachedPdf {
  buffer: Buffer;
  filename: string;
  expiresAt: number;
}

const pdfCache = new Map<string, CachedPdf>();
const MAX_CACHE_ENTRIES = 25;
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB

function cleanExpired() {
  const now = Date.now();
  for (const [key, item] of pdfCache.entries()) {
    if (item.expiresAt < now) {
      pdfCache.delete(key);
    }
  }
  while (pdfCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = pdfCache.keys().next().value;
    if (!oldestKey) break;
    pdfCache.delete(oldestKey);
  }
}

function isAllowedRemotePdfUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    // Block localhost, loopback, link-local, or private IPv4/IPv6 ranges
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
      hostname === "[::1]"
    ) {
      return false;
    }

    const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let configuredSupabaseHost = "";
    if (configuredSupabaseUrl) {
      try {
        configuredSupabaseHost = new URL(configuredSupabaseUrl).hostname.toLowerCase();
      } catch {}
    }

    if (configuredSupabaseHost && hostname === configuredSupabaseHost) {
      return true;
    }

    return hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.in");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    cleanExpired();
    const body = await req.json();
    const { data, title } = body;

    if (!data || typeof data !== "string") {
      return NextResponse.json({ error: "Contenu PDF manquant" }, { status: 400 });
    }

    let buffer: Buffer;
    if (data.startsWith("data:application/pdf;base64,")) {
      const base64Clean = data.split(";base64,")[1];
      buffer = Buffer.from(base64Clean, "base64");
    } else if (data.startsWith("data:")) {
      const base64Clean = data.split(",")[1];
      buffer = Buffer.from(base64Clean, "base64");
    } else {
      return NextResponse.json({ error: "Format base64 invalide" }, { status: 400 });
    }

    if (buffer.byteLength > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "Le document PDF dépasse la limite autorisée (15 Mo)." },
        { status: 413 }
      );
    }

    const token = crypto.randomUUID();
    const filename = (title || "document").replace(/[^\w\s-]/gi, "") + ".pdf";

    pdfCache.set(token, {
      buffer,
      filename,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return NextResponse.json({
      token,
      streamUrl: `/api/pdf/stream?token=${token}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    cleanExpired();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const rawUrl = searchParams.get("url");

    // 1. If served via token
    if (token) {
      const cached = pdfCache.get(token);
      if (!cached) {
        return new NextResponse(
          "Document expiré ou introuvable. Veuillez fermer et réouvrir la visionneuse.",
          {
            status: 404,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }
        );
      }

      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${cached.filename}"`,
          "X-Frame-Options": "SAMEORIGIN",
          "Cache-Control": "private, max-age=900",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // 2. If served via remote URL (strictly restricted to project's Supabase Storage host to prevent SSRF)
    if (rawUrl) {
      const decodedUrl = decodeURIComponent(rawUrl);
      if (!isAllowedRemotePdfUrl(decodedUrl)) {
        return new NextResponse(
          "Domaine distant non autorisé pour le flux PDF.",
          { status: 403 }
        );
      }

      const response = await fetch(decodedUrl, {
        headers: {
          Accept: "application/pdf,application/octet-stream",
        },
        redirect: "error",
      });

      if (!response.ok) {
        return new NextResponse("Impossible de récupérer le fichier distant", {
          status: response.status,
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_PDF_BYTES * 2) {
        return new NextResponse("Fichier PDF trop volumineux", { status: 413 });
      }

      const filename =
        (decodedUrl.split("/").pop()?.split("?")[0] || "document.pdf").replace(
          /[^\w.-]/g,
          "_"
        );

      return new NextResponse(new Uint8Array(arrayBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
          "X-Frame-Options": "SAMEORIGIN",
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new NextResponse("Paramètre 'token' ou 'url' manquant", { status: 400 });
  } catch (err: any) {
    return new NextResponse(`Erreur: ${err.message}`, { status: 500 });
  }
}
