import { supabase } from "../lib/supabaseClient";
import axios from "axios";

interface Message {
  id: string;
  created_at: string;
  prompt: string | null;
  response: string | null;
  loading?: boolean;
}

interface SendMessageParams {
  message: string;
  userId: string;
  workspaceId: string;
  AIModelId: string;
  chatId: string | null;
  systemPrompt?: string;
  isValidForImageGen?: boolean;
  imageUrl?: string | null;
  uploadedFiles?: string[];
}

export async function sendMessage({
  message,
  userId,
  workspaceId,
  AIModelId,
  chatId,
  systemPrompt,
  isValidForImageGen = false,
  imageUrl = null,
}: SendMessageParams): Promise<{ chatId: string; message: Message } | null> {
  try {
    let finalChatId = chatId;

    // 1️⃣ Create new chat if necessary
    if (!chatId || chatId === "new") {
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          ai_model_id: AIModelId,
          title: message.slice(0, 50) || "New Chat",
        })
        .select()
        .single();

      if (chatError || !newChat) throw new Error("Failed to create chat.");
      finalChatId = newChat.id;
    }

    // 2️⃣ Handle message generation / image
    let result: string | null = imageUrl || null;

    if (!result) {
      const aiRes = await axios.post("/api/ai", {
        prompt: message,
        userId,
        workspaceId,
        AIModelId,
        chatId: finalChatId,
        system_prompt: systemPrompt,
        isValidForImageGen,
      });

      const generatedUrl = aiRes.data.result || null;

      if (isValidForImageGen && generatedUrl) {
        // Save generated image
        const saveRes = await axios.post("/api/saveGeneratedImage", {
          imageUrl: generatedUrl,
          userId,
          workspaceId,
          chatId: finalChatId,
        });
        result = saveRes.data.url || generatedUrl;
      } else {
        result = generatedUrl;
      }
    }

    // 3️⃣ Insert message into Supabase
    const { data: insertedMessage, error: insertError } = await supabase
      .from("messages")
      .insert({
        chat_id: finalChatId,
        user_id: userId,
        workspace_id: workspaceId,
        ai_model_id: AIModelId,
        prompt: message,
        response: result,
      })
      .select()
      .single();

    if (insertError || !insertedMessage)
      throw new Error("Failed to insert message.");

    return { chatId: finalChatId, message: insertedMessage };
  } catch (err: any) {
    console.error("Send failed:", err.message || err);
    return null;
  }
}