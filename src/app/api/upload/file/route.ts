import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".mp3",
  ".wav",
  ".m4a",
  ".zip",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
]);

const FORBIDDEN_MIME_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "application/javascript",
  "text/javascript",
  "application/x-msdownload",
  "application/x-sh",
]);

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    // 0. Require authenticated user session
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise pour téléverser un fichier." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "document";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Le fichier dépasse la taille maximale autorisée (50 Mo)." },
        { status: 400 }
      );
    }

    const rawExt = (path.extname(file.name) || (type === "pdf" ? ".pdf" : "")).toLowerCase();
    const mimeType = (file.type || "application/octet-stream").toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(rawExt) || FORBIDDEN_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error: `Type de fichier non autorisé (${rawExt || mimeType}). Formats acceptés : PDF, images (PNG, JPG, WEBP), documents Office, ZIP, audio et vidéo.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine target subfolder
    let subfolder = "documents";
    if (type === "image" || mimeType.startsWith("image/")) {
      subfolder = "images";
    } else if (
      type === "video" ||
      mimeType.startsWith("video/") ||
      type === "audio" ||
      mimeType.startsWith("audio/")
    ) {
      subfolder = "media";
    }

    // Generate safe unique filename
    const baseName = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^\w\s-]/gi, "")
      .replace(/\s+/g, "_")
      .slice(0, 50);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const finalFilename = `${baseName || "file"}_${uniqueId}${rawExt}`;
    const storagePath = `${subfolder}/${finalFilename}`;

    // 1. Try Supabase Storage first if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseConfig =
      supabaseUrl &&
      !supabaseUrl.includes("placeholder") &&
      !supabaseUrl.includes("example.com");

    if (hasSupabaseConfig) {
      try {
        const supabase = getSupabaseAdmin();
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some((b) => b.name === bucketName);

        if (!bucketExists) {
          await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: MAX_UPLOAD_SIZE_BYTES,
          });
        }

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
          if (urlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: urlData.publicUrl,
              filename: file.name,
              size: file.size,
              mimeType,
              storage: "supabase",
            });
          }
        } else {
          console.warn("[Upload] Supabase Storage upload error:", uploadError.message);
        }
      } catch (sbErr: any) {
        console.warn("[Upload] Supabase Storage error, trying fallback:", sbErr?.message || sbErr);
      }
    }

    // 2. Try Local Filesystem Storage
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, finalFilename);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${subfolder}/${finalFilename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: file.name,
        size: file.size,
        mimeType,
        storage: "local",
      });
    } catch (fsErr: any) {
      console.warn(
        "[Upload] Local filesystem write failed (Serverless read-only filesystem):",
        fsErr.message
      );

      // 3. Serverless fallback: Convert to Data URI for files <= 4.5MB
      if (file.size <= 4.5 * 1024 * 1024) {
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({
          success: true,
          url: dataUrl,
          filename: file.name,
          size: file.size,
          mimeType,
          storage: "data-url",
        });
      }

      throw new Error(
        "Impossible d'enregistrer le fichier sur le serveur. Veuillez configurer Supabase Storage pour les fichiers volumineux."
      );
    }
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'enregistrement du fichier." },
      { status: 500 }
    );
  }
}
