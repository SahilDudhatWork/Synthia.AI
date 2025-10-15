import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const form = formidable({ multiples: false, keepExtensions: true });

    const { fields, files }: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const userId = String(fields.userId || "");
    const workspaceId = String(fields.workspaceId || "");
    const chatId = fields.chatId ? String(fields.chatId) : null;
    const fileEntry = files?.file;
    const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;

    if (!userId || !workspaceId) {
      return res.status(400).json({ success: false, error: "userId and workspaceId are required" });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: "file is required" });
    }

    const filePathOnDisk = file.filepath || file.path; // formidable v3 vs v2
    if (!filePathOnDisk) {
      return res.status(400).json({ success: false, error: "uploaded file missing path" });
    }
    const originalName = file.originalFilename || file.name || `upload-${Date.now()}`;
    const mimeType = file.mimetype || "application/octet-stream";
    const buffer = await fs.promises.readFile(filePathOnDisk);

    const timestamp = Date.now();
    const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${userId}/${workspaceId}/${timestamp}-${safeFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("images")
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: "3600",
      });
      
    if (uploadError) {
      return res.status(400).json({ success: false, error: `Upload failed: ${uploadError.message}` });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from("images").getPublicUrl(storagePath);
    const publicUrl = publicUrlData.publicUrl;
    if (!publicUrl) {
      return res.status(500).json({ success: false, error: "Failed to generate public URL" });
    }

    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("images")
      .insert([
        {
          user_id: userId,
          workspace_id: workspaceId,
          chat_id: chatId,
          url: publicUrl,
          storage_path: storagePath,
          file_name: originalName,
          file_size: buffer.length,
          mime_type: mimeType,
        },
      ])
      .select()
      .single();

    if (dbError) {
      // On DB error, try to cleanup the file
      await supabaseAdmin.storage.from("images").remove([storagePath]);
      return res.status(400).json({ success: false, error: `Database error: ${dbError.message}` });
    }

    return res.status(200).json({
      success: true,
      image: {
        id: dbData.id,
        url: dbData.url,
        storage_path: dbData.storage_path,
        file_name: dbData.file_name,
        user_id: dbData.user_id,
        workspace_id: dbData.workspace_id,
        chat_id: dbData.chat_id,
        created_at: dbData.created_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Unexpected error" });
  }
}