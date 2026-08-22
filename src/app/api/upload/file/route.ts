import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "document";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine target directory
    let subfolder = "documents";
    if (type === "image" || file.type.startsWith("image/")) {
      subfolder = "images";
    } else if (type === "video" || file.type.startsWith("video/") || type === "audio" || file.type.startsWith("audio/")) {
      subfolder = "media";
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generate safe unique filename
    const originalExt = path.extname(file.name) || (type === "pdf" ? ".pdf" : "");
    const baseName = path.basename(file.name, originalExt).replace(/[^\w\s-]/gi, "").replace(/\s+/g, "_").slice(0, 50);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const finalFilename = `${baseName || "file"}_${uniqueId}${originalExt}`;

    const filePath = path.join(uploadDir, finalFilename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${subfolder}/${finalFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'enregistrement du fichier." }, { status: 500 });
  }
}
