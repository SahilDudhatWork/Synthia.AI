import Link from "next/link";
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';



function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        // style={{ backgroundImage: "url('/bg.jpg')" }}
      />

      <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/60 to-transparent" />
      <div className="absolute inset-0 hidden sm:block bg-gradient-to-b from-transparent via-transparent to-black/60" />

      <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}

export default function Home() {



   const t = useTranslations('indexpage');
   
  return (
    <div className="relative min-h-screen text-white flex flex-col bg-black">
      <Background />

      <main className="flex flex-1 items-center justify-center text-center px-6 z-10">
        <div>
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg animate-fadeIn">
            {t('titleh1')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mt-6 max-w-2xl mx-auto leading-relaxed">
          {t('subitile')} </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              {t('signup')}
            </Link>
            <Link
              href="/auth/login"
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              {t('signin')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}



export async function getStaticProps({locale}: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../messages/${locale}.json`)).default
    }
  };
}