import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function AuthForm({ type }: { type: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action =
      type === 'login'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;
    if (error) alert(error.message);
    else router.push(type === 'login' ? '/dashboard' : '/auth/login');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">{type === 'login' ? 'Login' : 'Register'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input className="border px-4 py-2" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="border px-4 py-2" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-2" type="submit">{type === 'login' ? 'Login' : 'Register'}</button>
        {type === 'login' && <a href="/auth/reset" className="text-blue-500">Forgot Password?</a>}
      </form>
    </div>
  );
}