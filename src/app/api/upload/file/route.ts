import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

    // Determine target subfolder
    let subfolder = "documents";
    if (type === "image" || file.type.startsWith("image/")) {
      subfolder = "images";
    } else if (type === "video" || file.type.startsWith("video/") || type === "audio" || file.type.startsWith("audio/")) {
      subfolder = "media";
    }

    // Generate safe unique filename
    const originalExt = path.extname(file.name) || (type === "pdf" ? ".pdf" : "");
    const baseName = path.basename(file.name, originalExt).replace(/[^\w\s-]/gi, "").replace(/\s+/g, "_").slice(0, 50);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const finalFilename = `${baseName || "file"}_${uniqueId}${originalExt}`;
    const storagePath = `${subfolder}/${finalFilename}`;

    // 1. Try Supabase Storage first if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseConfig = supabaseUrl && !supabaseUrl.includes("placeholder") && !supabaseUrl.includes("example.com");

    if (hasSupabaseConfig) {
      try {
        const supabase = getSupabaseAdmin();
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

        // Check/ensure bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some((b) => b.name === bucketName);

        if (!bucketExists) {
          await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 52428800, // 50MB
          });
        }

        // Upload buffer
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType: file.type || "application/octet-stream",
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
              mimeType: file.type,
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

    // 2. Try Local Filesystem Storage (works in local dev & persistent servers)
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
        mimeType: file.type,
        storage: "local",
      });
    } catch (fsErr: any) {
      console.warn("[Upload] Local filesystem write failed (Serverless read-only filesystem /var/task):", fsErr.message);

      // 3. Serverless fallback: Convert to Data URI for images, audio, documents <= 4.5MB
      if (file.size <= 4.5 * 1024 * 1024) {
        const mime = file.type || "application/octet-stream";
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${mime};base64,${base64}`;

        return NextResponse.json({
          success: true,
          url: dataUrl,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          storage: "data-url",
        });
      }

      throw new Error(
        "Impossible d'enregistrer le fichier sur le serveur. En environnement Serverless (Vercel/AWS), veuillez configurer Supabase Storage ou un stockage cloud pour les fichiers volumineux."
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

