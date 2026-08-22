import { NextRequest, NextResponse } from "next/server";

// Temporary memory cache for base64 PDF streams (stores for 15 minutes)
interface CachedPdf {
  buffer: Buffer;
  filename: string;
  expiresAt: number;
}

const pdfCache = new Map<string, CachedPdf>();

// Periodically clean expired items
function cleanExpired() {
  const now = Date.now();
  for (const [key, item] of pdfCache.entries()) {
    if (item.expiresAt < now) {
      pdfCache.delete(key);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const token = crypto.randomUUID();
    const filename = (title || "document").replace(/[^\w\s-]/gi, "") + ".pdf";

    pdfCache.set(token, {
      buffer,
      filename,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 min
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
        return new NextResponse("Document expiré ou introuvable. Veuillez fermer et réouvrir la visionneuse.", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${cached.filename}"`,
          "X-Frame-Options": "SAMEORIGIN",
          "Cache-Control": "public, max-age=1800",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // 2. If served via remote URL (proxying through same-origin)
    if (rawUrl) {
      const decodedUrl = decodeURIComponent(rawUrl);
      if (!decodedUrl.startsWith("http://") && !decodedUrl.startsWith("https://")) {
        return new NextResponse("URL non valide", { status: 400 });
      }

      const response = await fetch(decodedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return new NextResponse("Impossible de récupérer le fichier distant", { status: response.status });
      }

      const arrayBuffer = await response.arrayBuffer();
      const filename = decodedUrl.split("/").pop()?.split("?")[0] || "document.pdf";

      return new NextResponse(new Uint8Array(arrayBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
          "X-Frame-Options": "SAMEORIGIN",
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new NextResponse("Paramètre 'token' ou 'url' manquant", { status: 400 });
  } catch (err: any) {
    return new NextResponse(`Erreur: ${err.message}`, { status: 500 });
  }
}
