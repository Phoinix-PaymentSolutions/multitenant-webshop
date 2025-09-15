import React from 'react';
import { Store } from '../../types';

// Define the props for the Footer component
interface FooterProps {
    store: Store;
}

// The Footer component for the website.
// It includes sections for branding, company information, and legal links.
const Footer: React.FC<FooterProps> = ({ store }) => {
    return (
        <footer className="bg-gray-800 text-gray-300 py-10 rounded-t-3xl shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Brand and Logo */}
                    <div className="flex flex-col items-start space-y-4">
                        <div className="flex items-center">
                            <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="ml-2 text-xl font-bold text-white">{store.name}</span>
                        </div>
                        <p className="text-sm">
                            {store.description}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold uppercase tracking-wider">Quick Links</h3>
                        <ul className="text-sm space-y-2">
                            <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Shop</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold uppercase tracking-wider">Legal</h3>
                        <ul className="text-sm space-y-2">
                            <li><a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                            <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                    
                    {/* Store Info */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold uppercase tracking-wider">Store Info</h3>
                        <ul className="text-sm space-y-2">
                            <li><p>Name: {store.name}</p></li>
                            {store.contactEmail && <li><p>Email: {store.contactEmail}</p></li>}
                            {store.contactPhone && <li><p>Phone: {store.contactPhone}</p></li>}
                        </ul>
                    </div>
                    
                    {/* Social Media and Contact */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold uppercase tracking-wider">Follow Us</h3>
                        <div className="flex space-x-4">
                            <a href="#" aria-label="Twitter" className="hover:text-white transition-colors">
                                {/* Twitter Icon (SVG) */}
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.007-.531A8.349 8.349 0 0022 5.92a8.196 8.196 0 01-2.357.646 4.113 4.113 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.45-4.288 4.104 4.104 0 001.275 5.467 4.089 4.089 0 01-1.858-.513c-.042 1.983 1.121 3.865 2.946 4.29-1.84.5-3.834.185-5.514-.633a4.12 4.12 0 003.824 2.894 8.292 8.292 0 01-5.143 1.77c-.33-.016-.65-.038-.97-.074a11.642 11.642 0 006.29 1.84"></path></svg>
                            </a>
                            <a href="#" aria-label="Facebook" className="hover:text-white transition-colors">
                                {/* Facebook Icon (SVG) */}
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 10H12v2h2v2h-2v4h-2v-4H8v-2h2V8H8V6h2V4h2v2h2V4h2v2h2v2h-2v2h2v2h-2v2h2v2h-2V16h-2V14h2v-2h-2v-2h2V8h-2V6h2V4h-2V2h-2v2h-2v2h-2v2h-2V6h-2V4h-2V2h-2v2h-2v2h-2V8h2V6h2V4h-2V2h-2v2h-2v2h-2v2h-2v2h-2v2h-2v2h-2V16h-2v-2h2v-2h-2v-2h2V8h-2V6h2V4h-2V2h-2v2h-2v2h-2v2h-2v2h-2v2h-2v2h-2V16h-2v-2h2v-2h2v-2h2V6h2V4h-2V2h2V0h2v2h2V4h2V6h2V8h2V6h2V4h-2V2h2V0z"></path></svg>
                            </a>
                            <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">
                                {/* Instagram Icon (SVG) */}
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.232 5.53l1.838 1.838a1 1 0 010 1.414l-1.838 1.838a1 1 0 01-1.414 0l-1.838-1.838a1 1 0 010-1.414l1.838-1.838a1 1 0 011.414 0zM12 12a3 3 0 100-6 3 3 0 000 6z"></path></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-8 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} {store.name}. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
