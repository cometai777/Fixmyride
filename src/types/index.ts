import React from 'react';

export interface FixMyRideUser {
  id: string;
  email?: string;
  /** Set when the user has confirmed their email (Supabase Auth). */
  email_confirmed_at?: string | null;
  user_metadata?: {
    full_name?: string;
  };
}

export interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

export interface DashboardStats {
  bookings: number;
  services: number;
  revenue: number;
  parts: number;
}

export interface TableColumn {
  key: string;
  label: string;
  formatter?: (val: any, row?: any, update?: (data: any) => void) => React.ReactNode;
}

export interface GenericTableViewProps {
  title: string;
  tableName: string;
  columns: TableColumn[];
  fields?: any[];
  primaryKey?: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
  hideDelete?: boolean;
  /** Pin the first column while scrolling horizontally (wide tables). */
  stickyFirstColumn?: boolean;
  /** Opens when a table row is clicked; use for full record details. */
  renderRowDetail?: (row: any, onClose: () => void) => React.ReactNode;
}

export type ToastType = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}
