// /pages/api/create-user-password.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email in the auth.users table
    const { data: user, error: getUserError } = await supabaseAdmin
      .from("users") // make sure this points to your "auth.users" or custom user table
      .select("id")
      .eq("email", email)
      .single();

    if (getUserError) {
      return res.status(500).json({ error: getUserError.message });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
