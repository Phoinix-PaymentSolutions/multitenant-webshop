import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const path = url.pathname;
  
  console.log('📄 Middleware:', { hostname, path, search: url.search });

  // Skip API routes, static files, and Next.js internals
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/admin') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Handle different environments
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isVercel = hostname.includes('vercel.app');
  const isFirebaseApp = hostname.includes('.web.app') || hostname.includes('.firebaseapp.com');
  
  // For localhost development - use query parameter or path
  if (isLocalhost) {
    const storeParam = url.searchParams.get('store');
    if (storeParam && path === '/') {
      console.log('✅ Localhost rewrite:', storeParam);
      url.pathname = `/store/${storeParam}`;
      url.search = '';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }
  
  // YOUR_MAIN_DOMAIN should be your actual domain (e.g., 'ordernow.com')
  const YOUR_MAIN_DOMAIN = 'maal-tijd.com'; // Change this to your actual domain
  const isMainDomain = hostname === YOUR_MAIN_DOMAIN || hostname === `www.${YOUR_MAIN_DOMAIN}`;
  const isSubdomain = hostname.endsWith(`.${YOUR_MAIN_DOMAIN}`) && !isMainDomain;
  const isCustomDomain = !isLocalhost && !isVercel && !isFirebaseApp && !isMainDomain && !isSubdomain;
  
  // PRIORITY 1: Custom Domain (highest priority)
  if (isCustomDomain) {
    // Use the full domain as the store identifier
    let storeId: string;
    const domainParts = hostname.split('.');
    
    // Use full domain or just the main part
    if (domainParts.length >= 2) {
      storeId = domainParts[0]; // Gets 'soulfoodmama' from 'soulfoodmama.com'
    } else {
      storeId = hostname;
    }
    
    if (path === '/') {
      console.log('✅ Custom domain rewrite:', `${hostname} -> store/${storeId}`);
      url.pathname = `/store/${storeId}`;
      return NextResponse.rewrite(url);
    }
    
    if (!path.startsWith('/store/')) {
      console.log('✅ Custom domain route rewrite:', `${hostname}${path} -> store/${storeId}${path}`);
      url.pathname = `/store/${storeId}${path}`;
      return NextResponse.rewrite(url);
    }
    
    return NextResponse.next();
  }
  
  // PRIORITY 2: Subdomain (fallback if no custom domain)
  if (isSubdomain) {
    const domainParts = hostname.split('.');
    const subdomain = domainParts[0]; // Gets 'soulfoodmama' from 'soulfoodmama.yourdomain.com'
    
    if (path === '/') {
      console.log('✅ Subdomain rewrite:', `${hostname} -> store/${subdomain}`);
      url.pathname = `/store/${subdomain}`;
      return NextResponse.rewrite(url);
    }
    
    if (!path.startsWith('/store/')) {
      console.log('✅ Subdomain route rewrite:', `${hostname}${path} -> store/${subdomain}${path}`);
      url.pathname = `/store/${subdomain}${path}`;
      return NextResponse.rewrite(url);
    }
    
    return NextResponse.next();
  }
  
  // PRIORITY 3: Main domain - regular path-based routing
  // URLs like yourdomain.com/store/soulfood-mama work normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};