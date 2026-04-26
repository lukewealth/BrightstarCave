/**
 * Brightstar Cave - SQL Connect Type Definitions
 * These interfaces match the Data Connect schema and GraphQL operations.
 */

export type UserRole = 'admin' | 'staff_kitchen' | 'staff_bar' | 'staff_waiter' | 'guest';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type DepartmentType = 'KITCHEN' | 'BAR' | 'HOTEL';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: DepartmentType;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: Category;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface Inventory {
  item: MenuItem;
  stockLevel: number;
  reorderLevel: number;
  lastRestocked?: string;
}

export interface Order {
  id: string;
  customer?: User;
  tableNumber?: string;
  status: OrderStatus;
  totalAmount: number;
  staffAttribution?: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order: Order;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
}

// --- Operation Responses ---

export interface CreateOrderResponse {
  order_insert: {
    id: string;
    createdAt: string;
  };
}

export interface SearchMenuResponse {
  menuItems_descriptionEmbedding_similarity: MenuItem[];
}

export interface GetActiveOrdersResponse {
  orders: Array<{
    id: string;
    tableNumber: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    orderItems_on_order: Array<{
      quantity: number;
      unitPrice: number;
      menuItem: {
        name: string;
        category: {
          type: DepartmentType;
        };
      };
    }>;
  }>;
}

export interface GetLowStockItemsResponse {
  inventories: Array<{
    stockLevel: number;
    item: {
      name: string;
      price: number;
    };
  }>;
}
