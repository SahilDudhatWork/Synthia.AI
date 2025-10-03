import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // service key since we’re reading auth.users
);

export default async function handler(req, res) {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const email = session.customer_details?.email;
    if (!email) return res.status(400).json({ error: "No email found" });

    const { data: users } = await supabase
      .from("app_users")
      .select("*")
      .eq("email", email)
      .single();

    res.json({ email, user: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
