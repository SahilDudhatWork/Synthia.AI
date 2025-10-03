import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { saveImage, SaveImageResponse } from "./storeImage";

interface ApiResponse {
  success?: boolean;
  url?: string;
  error?: string;
  imageId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageUrl, userId, workspaceId, chatId } = req.body as {
      imageUrl?: string;
      userId?: string;
      workspaceId?: string;
      chatId?: string;
    };

    // Validate inputs
    if (!imageUrl || !userId || !workspaceId) {
      return res.status(400).json({
        error: "Missing required fields: imageUrl, userId, and workspaceId are required"
      });
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: "Invalid imageUrl format" });
    }

    console.log(`Downloading image from: ${imageUrl}`);

    // Download the image with better error handling
    let response;
    try {
      response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000, // 30 second timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        validateStatus: (status) => status === 200,
      });
    } catch (downloadError: any) {
      console.error("Download error:", downloadError);
      return res.status(400).json({
        error: `Failed to download image: ${downloadError.message}`
      });
    }

    // Validate content type
    const contentType = response.headers["content-type"];
    if (!contentType?.startsWith("image/")) {
      return res.status(400).json({ error: "URL does not point to a valid image" });
    }

    // Determine file extension
    const fileExtension = contentType.split("/")[1]?.toLowerCase() || "png";
    const validExtensions = ["png", "jpeg", "jpg", "webp", "gif", "bmp", "svg"];

    if (!validExtensions.includes(fileExtension)) {
      return res.status(400).json({
        error: `Unsupported image format: ${fileExtension}. Supported formats: ${validExtensions.join(", ")}`
      });
    }

    // Create file object
    const file = {
      name: `generated-${Date.now()}.${fileExtension}`,
      buffer: Buffer.from(response.data),
      type: contentType,
    };

    console.log(`Image downloaded successfully. Size: ${file.buffer.length} bytes, Type: ${contentType}`);

    // Save to Supabase
    const result: SaveImageResponse = await saveImage({
      userId,
      workspaceId,
      chatId: chatId || null,
      file
    });

    if (!result.success || !result.image?.url) {
      console.error("saveImage failed:", result.error);
      return res.status(500).json({
        error: result.error || "Failed to save image to storage"
      });
    }

    console.log(`Image saved successfully. ID: ${result.image.id}, URL: ${result.image.url}`);

    return res.status(200).json({
      success: true,
      url: result.image.url,
      imageId: result.image.id
    });

  } catch (err: unknown) {
    console.error("saveGeneratedImage unexpected error:", err);

    const errorMessage = err instanceof Error
      ? err.message.includes("violates row-level security")
        ? "Permission denied: Check if user has access to the workspace"
        : err.message.includes("timeout")
          ? "Request timeout: Image download took too long"
          : err.message
      : "Internal server error";

    return res.status(500).json({ error: errorMessage });
  }
}