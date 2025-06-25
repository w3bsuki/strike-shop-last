# Duplicate Dependencies Analysis

## Common Dependencies Across Projects

### Production Dependencies

| Dependency | user-profile-card | strike-shop | taskflow-ai |
|------------|------------------|-------------|-------------|
| clsx | ^2.0.0 | ^2.1.1 | ^2.1.1 |
| tailwind-merge | ^2.0.0 | ^2.3.0 | ^3.3.1 |
| @radix-ui/react-avatar | - | ^1.1.0 | ^1.1.10 |
| @radix-ui/react-checkbox | - | ^1.1.0 | ^1.3.2 |
| @radix-ui/react-dialog | - | ^1.1.1 | ^1.1.14 |
| @radix-ui/react-dropdown-menu | - | ^2.1.1 | ^2.1.15 |
| @radix-ui/react-label | - | ^2.1.0 | ^2.1.7 |
| @radix-ui/react-popover | - | ^1.1.1 | ^1.1.14 |
| @radix-ui/react-progress | - | ^1.1.0 | ^1.1.7 |
| @radix-ui/react-select | - | ^2.1.1 | ^2.2.5 |
| @radix-ui/react-slot | - | ^1.1.0 | ^1.2.3 |
| @radix-ui/react-toast | - | ^1.2.1 | ^1.2.14 |
| @hookform/resolvers | - | ^3.6.0 | ^5.1.1 |
| @tanstack/react-query | - | ^5.81.2 | ^5.81.1 |
| class-variance-authority | - | ^0.7.0 | ^0.7.1 |
| date-fns | - | ^3.6.0 | ^4.1.0 |
| lucide-react | - | ^0.396.0 | ^0.522.0 |
| next | - | ^14.2.5 | ^15.3.4 |
| next-themes | - | ^0.3.0 | ^0.4.6 |
| react | ^18.0.0 (peer) | ^18.3.1 | ^19.0.0 |
| react-dom | ^18.0.0 (peer) | ^18.3.1 | ^19.0.0 |
| react-day-picker | - | ^8.10.1 | ^9.7.0 |
| react-hook-form | - | ^7.52.0 | ^7.58.1 |
| tailwindcss-animate | ^1.0.7 | ^1.0.7 | ^1.0.7 |
| zod | - | ^3.25.67 | ^3.25.67 |
| zustand | - | ^4.5.2 | ^5.0.5 |

### Dev Dependencies

| Dependency | user-profile-card | strike-shop | taskflow-ai |
|------------|------------------|-------------|-------------|
| @testing-library/jest-dom | ^6.1.5 | ^6.4.6 | ^6.5.0 |
| @testing-library/react | ^14.1.2 | ^16.0.0 | ^16.0.1 |
| @testing-library/user-event | ^14.5.1 | ^14.5.2 | ^14.5.2 |
| @types/react | ^18.2.43 | ^18.3.3 | ^19 |
| @types/react-dom | ^18.2.17 | ^18.3.0 | ^19 |
| @types/node | - | ^20.14.9 | ^20 |
| autoprefixer | ^10.4.16 | ^10.4.19 | ^10.4.21 |
| postcss | ^8.4.32 | ^8.4.39 | ^8.5.6 |
| tailwindcss | ^3.3.6 | ^3.4.4 | ^3.4.17 |
| typescript | ^5.3.3 | ^5.5.3 | ^5 |

## Key Findings

1. **Version Mismatches**: 
   - React versions differ significantly (18.x vs 19.x)
   - Next.js versions differ (14.x vs 15.x)
   - Many Radix UI components have patch/minor version differences

2. **Common Libraries**:
   - All projects use Tailwind CSS with similar versions
   - Common utility libraries: clsx, tailwind-merge, tailwindcss-animate
   - Testing libraries are mostly aligned

3. **Recommendations**:
   - Standardize React versions across projects
   - Align Radix UI component versions
   - Consider creating a shared dependencies package for common utilities