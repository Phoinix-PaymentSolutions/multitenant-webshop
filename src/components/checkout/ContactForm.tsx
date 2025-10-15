// src/components/checkout/ContactForm.tsx
'use client';

import React from 'react';

interface ContactFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  sectionNumber: number;
}

export const ContactForm = ({ formData, onFormDataChange, sectionNumber }: ContactFormProps) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-gray-800">{sectionNumber}. Contact Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            value={formData.firstName} 
            onChange={(e) => onFormDataChange('firstName', e.target.value)}
            required 
            className="mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 focus:ring-blue-500 transition duration-150"
          />
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input 
            type="text" 
            id="lastName" 
            name="lastName" 
            value={formData.lastName} 
            onChange={(e) => onFormDataChange('lastName', e.target.value)}
            required 
            className="mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 focus:ring-blue-500 transition duration-150"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={(e) => onFormDataChange('email', e.target.value)}
            required 
            className="mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 focus:ring-blue-500 transition duration-150"
          />
        </div>
        
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input 
            type="tel" 
            id="phoneNumber" 
            name="phoneNumber" 
            value={formData.phoneNumber} 
            onChange={(e) => onFormDataChange('phoneNumber', e.target.value)}
            required 
            className="mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 focus:ring-blue-500 transition duration-150"
          />
        </div>
      </div>
    </div>
  );
};