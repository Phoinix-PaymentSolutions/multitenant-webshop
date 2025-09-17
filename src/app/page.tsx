
// src/app/page.tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Hero section */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Multi-Tenant
            <span className="text-blue-600"> Webshop</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            A powerful platform for creating beautiful, custom online stores. 
            Each client gets their own subdomain and fully customizable storefront.
          </p>

          {/* Demo section */}
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">🚀 Try the Demo</h2>
            
            <div className="space-y-4">
              <div className="text-left">
                <h3 className="font-medium text-gray-900 mb-2">Demo Store:</h3>
                <a 
                  href="?store=pizza-palace"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  🍕 Visit Pizza Palace Demo
                </a>
              </div>
              
              <div className="text-sm text-gray-500 pt-4 border-t">
                <p><strong>Local Testing:</strong> Add <code>?store=pizza-palace</code> to the URL</p>
                <p><strong>Production:</strong> Each store gets their own subdomain like <code>pizza-palace.yourapp.com</code></p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="text-lg font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-gray-600 text-sm">Each client gets their own customizable store with unique branding</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="text-lg font-semibold mb-2">Payments</h3>
              <p className="text-gray-600 text-sm">Integrated with Mollie for secure payment processing</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-semibold mb-2">Responsive</h3>
              <p className="text-gray-600 text-sm">Beautiful, mobile-first design that works on all devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}