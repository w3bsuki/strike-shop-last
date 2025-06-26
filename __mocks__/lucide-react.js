// Mock for lucide-react icons
const mockIcon = ({ className, ...props }) => {
  return {
    type: 'svg',
    props: {
      className,
      'data-testid': 'mock-icon',
      ...props
    }
  };
};

// Create mock components for all icons
const iconNames = [
  'Search', 'Menu', 'X', 'ShoppingCart', 'User', 'Heart', 'Star', 
  'Plus', 'Minus', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
  'Filter', 'SlidersHorizontal', 'Grid3X3', 'List', 'Trash2', 'Edit', 
  'Eye', 'EyeOff', 'Check', 'AlertCircle', 'Info', 'Loader2', 'Package',
  'Truck', 'Shield', 'ArrowLeft', 'ArrowRight', 'Home', 'ShoppingBag',
  'Settings', 'LogOut', 'CreditCard', 'MapPin', 'Phone', 'Mail',
  'Calendar', 'Clock', 'Tag', 'Zap', 'TrendingUp', 'BarChart'
];

const icons = {};
iconNames.forEach(name => {
  icons[name] = mockIcon;
});

// Support both named exports and default export
module.exports = icons;
module.exports.default = icons;

// Also export from individual icon paths
iconNames.forEach(name => {
  const iconPath = name.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1);
  jest.doMock(`lucide-react/dist/esm/icons/${iconPath}`, () => ({
    default: mockIcon,
    [name]: mockIcon
  }), { virtual: true });
});