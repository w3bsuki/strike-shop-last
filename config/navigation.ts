export type NavItem = {
  title: string;
  titleKey?: string; // Translation key for i18n
  href: string;
  description?: string;
  badge?: string;
  badgeKey?: string; // Translation key for badge
  external?: boolean;
};

export type NavCategory = {
  title: string;
  titleKey?: string; // Translation key for i18n
  items: NavItem[];
};

export const mainNavItems: NavItem[] = [
  {
    title: "Men",
    titleKey: "nav.men",
    href: "/men",
  },
  {
    title: "Women", 
    titleKey: "nav.women",
    href: "/women",
  },
  {
    title: "Kids",
    titleKey: "nav.kids", 
    href: "/kids",
  },
  {
    title: "Sale",
    titleKey: "nav.sale",
    href: "/sale",
    badge: "HOT",
  },
];

export const categoryNavItems: NavCategory[] = [
  {
    title: "Men",
    items: [
      { title: "All Men's", href: "/men" },
      { title: "Clothing", href: "/men/clothing" },
      { title: "Shoes", href: "/men/shoes" },
      { title: "Accessories", href: "/men/accessories" },
      { title: "Sale", href: "/men/sale", badge: "SALE" },
    ],
  },
  {
    title: "Women",
    items: [
      { title: "All Women's", href: "/women" },
      { title: "Clothing", href: "/women/clothing" },
      { title: "Shoes", href: "/women/shoes" },
      { title: "Accessories", href: "/women/accessories" },
      { title: "Sale", href: "/women/sale", badge: "SALE" },
    ],
  },
  {
    title: "Kids",
    items: [
      { title: "All Kids", href: "/kids" },
      { title: "Boys", href: "/kids/boys" },
      { title: "Girls", href: "/kids/girls" },
      { title: "Baby", href: "/kids/baby" },
      { title: "Sale", href: "/kids/sale", badge: "SALE" },
    ],
  },
];

export const footerNavItems: NavCategory[] = [
  {
    title: "Customer Care",
    items: [
      { title: "Contact Us", href: "/contact" },
      { title: "Shipping Info", href: "/shipping" },
      { title: "Returns", href: "/returns" },
      { title: "Size Guide", href: "/size-guide" },
      { title: "Track Order", href: "/track-order" },
    ],
  },
  {
    title: "About",
    items: [
      { title: "Our Story", href: "/about" },
      { title: "Sustainability", href: "/sustainability" },
      { title: "Careers", href: "/careers" },
      { title: "Press", href: "/press" },
      { title: "Affiliates", href: "/affiliates" },
    ],
  },
  {
    title: "Legal",
    items: [
      { title: "Terms of Service", href: "/terms" },
      { title: "Privacy Policy", href: "/privacy" },
      { title: "Cookie Policy", href: "/cookies" },
      { title: "Accessibility", href: "/accessibility" },
    ],
  },
];

export const mobileNavItems: NavItem[] = [
  ...mainNavItems,
  { title: "Account", href: "/account" },
  { title: "Wishlist", href: "/wishlist" },
  { title: "Track Order", href: "/track-order" },
  { title: "Help", href: "/help" },
];