// src/app/store/[subdomain]/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Store Not Found</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          The store you&apos;re looking for doesn&apos;t exist or has been deactivated.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}