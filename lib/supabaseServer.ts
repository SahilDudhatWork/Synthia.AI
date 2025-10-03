import { createServerClient } from '@supabase/ssr';

export const getSupabaseServerClient = (req, res) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          res.cookie(name, value, options); // if using something like cookie-parser
        },
        remove(name, options) {
          res.clearCookie(name, options);
        },
      },
    }
  );
};
