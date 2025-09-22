import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const path = url.pathname;
  
  console.log('🔄 Middleware:', { hostname, path, search: url.search });

  // Skip API routes, static files, and Next.js internals
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/admin') || // Admin routes stay as-is
    path.includes('.') // Static files (favicon.ico, etc.)
  ) {
    return NextResponse.next();
  }
  
  // Handle different environments
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isVercel = hostname.includes('vercel.app');
  const isFirebaseApp = hostname.includes('.web.app') || hostname.includes('.firebaseapp.com');
  
  // For localhost development - use query parameter
  if (isLocalhost) {
    const storeParam = url.searchParams.get('store');
    if (storeParam && path === '/') {
      console.log('✅ Localhost rewrite:', storeParam);
      url.pathname = `/store/${storeParam}`;
      url.search = ''; // Remove query parameter
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }
  
  // Check if this is a custom domain (not development/hosting platforms)
  const isCustomDomain = !isLocalhost && !isVercel && !isFirebaseApp;
  
  if (isCustomDomain) {
    // For custom domains, determine the store ID based on your strategy
    let storeId: string;
    
    // Strategy 1: Use the full domain name without TLD as store ID
    // e.g., 'bakery.com' -> 'bakery', 'johnsshop.net' -> 'johnsshop'
    const domainParts = hostname.split('.');
    if (domainParts.length >= 2) {
      storeId = domainParts[0]; // Gets 'bakery' from 'bakery.com'
    } else {
      storeId = hostname; // Fallback to full hostname
    }
    
    // Strategy 2: Alternative - use a mapping or the full domain
    // You could also maintain a mapping of domains to store IDs
    // or use the full domain as the store ID if that's your setup
    
    if (path === '/') {
      console.log('✅ Custom domain rewrite:', `${hostname} -> store/${storeId}`);
      url.pathname = `/store/${storeId}`;
      return NextResponse.rewrite(url);
    }
    
    // Handle other routes under custom domain
    if (!path.startsWith('/store/')) {
      console.log('✅ Custom domain route rewrite:', `${hostname}${path} -> store/${storeId}${path}`);
      url.pathname = `/store/${storeId}${path}`;
      return NextResponse.rewrite(url);
    }
    
    return NextResponse.next();
  }
  
  // If we get here, it's likely your main development/hosting domain
  // You can choose to either show a landing page or redirect
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file with extension
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};