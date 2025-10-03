import { supabase } from '../../lib/supabaseClient';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


// translations
   const t = useTranslations('resetpasswordpage');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('titleh1')}</h1>
        </div>
        {success ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">{t('successmessage')}</p>
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
              {t('backtologin')}
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleReset}>
            {error && (
              <div className="p-2 text-sm text-red-600 bg-red-50 rounded-md mb-4">
                {error}
              </div>
            )}
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('emaillabel')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ?  t('backtologin') : t('sendresetlink') }
              </button>
            </div>
          </form>
        )}
        <div className="mt-6 text-center text-sm text-gray-600">
          <div className="mt-4 flex justify-center space-x-4">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
              {t('backtologin')}
            </Link>
          </div>
          <div className="mt-4 flex justify-center space-x-4 text-xs">
            <a href="#" className="text-blue-600 hover:text-blue-800">{t('links.privacypolicy')}</a>
            <a href="#" className="text-blue-600 hover:text-blue-800">{t('links.termsofuse')}</a>
            <a href="#" className="text-blue-600 hover:text-blue-800">{t('links.cookiepolicy')}</a>
          </div>
        </div>
      </div>
    </div>
  );
}


export async function getStaticProps({locale}: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../../messages/${locale}.json`)).default
    }
  };
}
