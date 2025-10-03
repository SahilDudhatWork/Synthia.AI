import { supabase } from "../../lib/supabaseClient";

export interface SaveImageParams {
  userId: string;
  workspaceId: string;
  chatId?: string | null;
  file: { name: string; buffer: Buffer; type: string };
}

export interface SaveImageResponse {
  success: boolean;
  image?: {
    id: string;
    url: string;
    storage_path: string;
    file_name: string;
    user_id: string;
    workspace_id: string;
    chat_id: string | null;
    created_at: string;
  };
  error?: string;
}

export async function saveImage({ userId, workspaceId, chatId, file }: SaveImageParams): Promise<SaveImageResponse> {
  try {
    // Validate inputs
    if (!userId || !workspaceId) {
      return { success: false, error: "userId and workspaceId are required" };
    }

    if (!file || !file.buffer || !file.name) {
      return { success: false, error: "Valid file object is required" };
    }

    // Create file path with user and workspace organization
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${workspaceId}/${timestamp}-${safeFileName}`;

    console.log(`Uploading image to path: ${filePath}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file.buffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    if (!publicUrl) {
      return { success: false, error: "Failed to generate public URL" };
    }

    console.log(`Image uploaded successfully. Public URL: ${publicUrl}`);

    // Insert metadata into database
    const { data: dbData, error: dbError } = await supabase
      .from("images")
      .insert([{
        user_id: userId,
        workspace_id: workspaceId,
        chat_id: chatId || null,
        url: publicUrl,
        storage_path: filePath,
        file_name: file.name,
        file_size: file.buffer.length,
        mime_type: file.type
      }])
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);

      // Try to delete the uploaded file if DB insert fails
      await supabase.storage
        .from("images")
        .remove([filePath]);

      return { success: false, error: `Database error: ${dbError.message}` };
    }

    return {
      success: true,
      image: {
        id: dbData.id,
        url: dbData.url,
        storage_path: dbData.storage_path,
        file_name: dbData.file_name,
        user_id: dbData.user_id,
        workspace_id: dbData.workspace_id,
        chat_id: dbData.chat_id,
        created_at: dbData.created_at
      }
    };

  } catch (err: any) {
    console.error("Unexpected error in saveImage:", err);
    return {
      success: false,
      error: err.message || "Unexpected error occurred while saving image"
    };
  }
}