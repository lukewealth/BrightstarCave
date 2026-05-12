export const ADMIN_EMAILS = [
  'contact@tricode.pro',
  'brightstarcave@gmail.com',
  'okaghaluke@gmail.com'
];

export const STAFF_EMAILS = [
  'lukeokagha@gmail.com'
];

export const CATEGORIES = [
  "Mocktails",
  "Cocktails",
  "Brandy & Cognac",
  "Whiskey",
  "Tequila",
  "Wine",
  "Beer",
  "Soft Drinks",
  "Kitchen Menu",
  "Exotic Kitchen",
  "Apartments",
  "Leisure"
];

export const DEPARTMENTS = {
  BAR: "bar",
  KITCHEN: "kitchen",
  HOTEL: "hotel",
  ALL: "all"
};

export const DEPARTMENT_CATEGORIES = {
  [DEPARTMENTS.BAR]: ["Mocktails", "Cocktails", "Brandy & Cognac", "Whiskey", "Tequila", "Wine", "Beer", "Soft Drinks"],
  [DEPARTMENTS.KITCHEN]: ["Kitchen Menu", "Exotic Kitchen"],
  [DEPARTMENTS.HOTEL]: ["Apartments"],
  [DEPARTMENTS.ALL]: CATEGORIES
};
