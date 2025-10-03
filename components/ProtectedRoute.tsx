import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const ProtectedRoute = (Component: any) => {
  return function WithAuth(props: any) {
    const router = useRouter();

    useEffect(() => {
      const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) router.push('/auth/login');
      };
      checkUser();
    }, []);

    return <Component {...props} />;
  };
};

export default ProtectedRoute;
