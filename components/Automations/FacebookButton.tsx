import { supabase } from "../../lib/supabaseClient";

export default function FacebookButton() {
  const handleConnect = async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return alert("You must be logged in to connect Facebook");

    const csrf = crypto.randomUUID();
    const state = encodeURIComponent(JSON.stringify({ csrf, userId }));

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/facebook/callback`
    );

    // 🔑 Extended scopes
    const scope = encodeURIComponent(
      "public_profile,email,pages_show_list,pages_manage_posts,pages_read_engagement"
    );

    window.location.href = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&response_type=code`;
  };

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 text-white px-5 py-3 rounded-lg"
    >
      Connect Facebook
    </button>
  );
}
