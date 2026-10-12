export interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  cost: number;
  price: number;
  stock_quantity: number;
  unit: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleReport {
  total_sales: number;
  transaction_count: number;
  payment_method: string;
}

export interface TransactionDetail {
  sale_id: number;
  detail_id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  subtotal: number;
  unit_price?: number;
  payment_method: string;
  seller_name: string;
  user_id?: number;
  sale_total?: number;
  created_at: string;
}

export interface SaleFullDetail {
  id: number;
  total: number;
  payment_method: string;
  user_id: number | null;
  seller_name: string;
  created_at: string;
  items: {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    subtotal: number;
    price: number;
    unit?: string;
  }[];
  payments: {
    id?: number;
    method: string;
    amount: number;
  }[];
}

export interface User {
  id: number;
  name: string;
  role: 'admin' | 'empleado';
  password?: string;
}

export interface Promotion {
  id: number;
  product_id: number;
  product_name?: string;
  quantity_threshold: number;
  promo_price: number;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  payment_method: string;
  created_at: string;
}

export interface AppSettings {
  // Negocio / General
  business_name: string;
  business_subtitle: string;
  business_address: string;
  business_phone: string;
  currency_symbol: string;
  low_stock_threshold: number;
  tax_info?: string;

  // Impresora y Comandera
  paper_width: '80mm' | '58mm';
  auto_print: boolean;
  ticket_copies: number;
  printer_target_notes: string;
  show_logo: boolean;
  logo_url: string;
  header_title: string;
  header_subtitle: string;
  footer_message: string;
  show_seller: boolean;
  show_payment_details: boolean;

  // Tipografía & Tamaño de fuente
  font_family: 'mono' | 'sans' | 'serif' | 'courier';
  font_size: 'small' | 'normal' | 'large';
  font_weight: 'normal' | 'bold';
  line_spacing: 'compact' | 'normal' | 'spacious';
}

export interface PosPoint {
  id: number;
  name: string;
  label: string;
  description: string;
  active: number | boolean;
  created_at?: string;
}

export interface CashShift {
  id: number;
  pos_point_id: number;
  pos_point_name: string;
  user_id: number;
  user_name: string;
  opened_at: string;
  closed_at?: string | null;
  initial_cash: number;
  final_cash?: number | null;
  expected_cash?: number | null;
  difference?: number | null;
  total_cash_sales: number;
  total_card_sales: number;
  total_transfer_sales: number;
  total_expenses: number;
  total_sales: number;
  transaction_count: number;
  status: 'open' | 'closed';
  notes?: string;
}

