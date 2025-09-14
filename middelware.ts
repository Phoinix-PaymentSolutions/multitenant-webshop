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
  
  // Extract subdomain for production
  const parts = hostname.split('.');
  
  // Skip if www or main domain (no subdomain)
  if (parts[0] === 'www' || parts.length < 3) {
    return NextResponse.next();
  }
  
  const subdomain = parts[0];
  
  // Reserved subdomains
  const reserved = ['api', 'admin', 'www', 'mail', 'blog', 'help', 'support'];
  if (reserved.includes(subdomain)) {
    return NextResponse.next();
  }
  
  // Rewrite subdomain to store page
  if (path === '/') {
    console.log('✅ Subdomain rewrite:', subdomain);
    url.pathname = `/store/${subdomain}`;
    return NextResponse.rewrite(url);
  }
  
  // Handle other routes under subdomain
  if (!path.startsWith('/store/')) {
    console.log('✅ Subdomain route rewrite:', `${subdomain}${path}`);
    url.pathname = `/store/${subdomain}${path}`;
    return NextResponse.rewrite(url);
  }
  
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