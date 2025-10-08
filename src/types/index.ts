export interface Store {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  subdomain: string;
  customDomain?: string;
  brandColor?: string;
  textColor?: string;
  accentColor?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  minimumOrder?: number;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  contactEmail?: string;
  contactPhone?: string;
  backgroundImageUrl?: string;
  ownerId: string;
  // Social media
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  // Contact info
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
  };
}

export interface UpdatedProduct {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  category: string;
  inventory: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isSale?: boolean;
  salePrice?: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  category: string;
  inventory: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isSale?: boolean;
  salePrice?: number;
}

export interface CartItem extends Product {
  quantity: number;
  deliveryFee?: number;
  minimumOrder?: number;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  storeId: string;
  customer: Customer;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  molliePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryFee?: number;
  minimumOrder?: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  btwamount: number;
  btwrate: number;
  inkkoopprijs: number;
  quantity: number;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OperatingHoursTakeaway {
  takeaway: {
    monday: DayHours;
    tuesday: DayHours;
    wednesday: DayHours;
    thursday: DayHours;
    friday: DayHours;
    saturday: DayHours;
    sunday: DayHours;
  };
}
export interface OperatingHoursDelivery {
  delivery: {
    monday: DayHours;
    tuesday: DayHours;
    wednesday: DayHours;
    thursday: DayHours;
    friday: DayHours;
    saturday: DayHours;
    sunday: DayHours;
  };
}