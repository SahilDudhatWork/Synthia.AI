import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b shadow p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="space-x-4">
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/auth/login" className="text-gray-700 hover:text-blue-600">
            Login
          </Link>
          <Link href="/auth/register" className="text-gray-700 hover:text-blue-600">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}