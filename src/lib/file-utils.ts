/**
 * Utility to safely view or download student submissions and files.
 * Handles data: URLs (base64) by converting them to Blob URLs, which avoids
 * modern browsers (Chrome, Edge, Safari) blocking top-level navigation to data: URLs.
 */
export function viewOrDownloadSubmission(
  fileUrl: string,
  fileName = "devoir-etudiant.pdf",
  action: "view" | "download" = "view"
) {
  if (!fileUrl) return;

  // Standard web URLs
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    if (action === "download") {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
    return;
  }

  // Base64 Data URLs
  if (fileUrl.startsWith("data:")) {
    try {
      const commaIndex = fileUrl.indexOf(",");
      if (commaIndex === -1) {
        window.open(fileUrl, "_blank");
        return;
      }

      const meta = fileUrl.substring(0, commaIndex);
      const b64Data = fileUrl.substring(commaIndex + 1);
      const mimeMatch = meta.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/pdf";

      const byteCharacters = atob(b64Data);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      const safeFileName = fileName.endsWith(".pdf") || fileName.includes(".") 
        ? fileName 
        : `${fileName}.${mimeType.includes("pdf") ? "pdf" : mimeType.includes("image") ? "png" : "bin"}`;

      if (action === "download") {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      } else {
        // Open the blob URL in a new tab.
        // Modern browsers natively render Blob URLs with their built-in PDF viewer without security blocks.
        const newWindow = window.open(blobUrl, "_blank");
        if (!newWindow) {
          // If popup blocker intervened, trigger download fallback
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = safeFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
      return;
    } catch (err) {
      console.error("[viewOrDownloadSubmission] Error handling base64 file:", err);
      window.open(fileUrl, "_blank");
    }
  }

  // Fallback
  window.open(fileUrl, "_blank");
}

/**
 * Converts a data URL to a temporary Blob URL for iframe/embedded previews
 */
export function dataUrlToBlobUrl(dataUrl: string): string | null {
  if (!dataUrl) return null;
  if (!dataUrl.startsWith("data:")) return dataUrl;

  try {
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) return dataUrl;
    const meta = dataUrl.substring(0, commaIndex);
    const b64Data = dataUrl.substring(commaIndex + 1);
    const mimeMatch = meta.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "application/pdf";

    const byteCharacters = atob(b64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("[dataUrlToBlobUrl] Failed to convert data URL:", err);
    return null;
  }
}
