import menuData from './data.json';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: 'kitchen' | 'bar' | 'hotel';
  stock: number;
  description: string;
}

export const menuItems: MenuItem[] = menuData.menu as MenuItem[];

export const menu = () => menuItems;

export const getItemsByType = (type: MenuItem['type']) => {
  return menuItems.filter(item => item.type === type);
};

export const getItemsByCategory = (category: string) => {
  return menuItems.filter(item => item.category === category);
};

export const categories = Array.from(new Set(menuItems.map(item => item.category)));
