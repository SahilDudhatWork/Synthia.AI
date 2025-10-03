import { supabase } from "../../lib/supabaseClient";

export default function LinkedInButton() {
  const handleConnect = () => {
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id; // ✅ Supabase UUID
      if (!userId) return alert("You must be logged in to connect LinkedIn");

      const csrf = crypto.randomUUID(); // CSRF protection
      const state = encodeURIComponent(JSON.stringify({ csrf, userId }));

      // Optional: store state to verify later
      sessionStorage.setItem("linkedin_oauth_state", state);

      const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/api/linkedin/callback`);

      // ✅ Use LinkedIn Graph API scopes (not OIDC)
      const scope = encodeURIComponent("openid profile email w_member_social");

      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    });
  };

  return (
    <button
      onClick={handleConnect}
      className="bg-slate-400 text-black px-5 py-4 m-4 rounded-lg"
    >
      Connect LinkedIn
    </button>
  );
}
