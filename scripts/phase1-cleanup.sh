#!/bin/bash
# Phase 1 Cleanup Script - Strike Shop Codebase Audit
# Generated from COMPREHENSIVE_AUDIT_REPORT.md
# WARNING: This will delete many files. Create a backup branch first!

set -e

echo "🧹 Strike Shop Phase 1 Cleanup Script"
echo "⚠️  WARNING: This will delete ~100+ files!"
echo "📌 Make sure you have:"
echo "   - Created a backup branch"
echo "   - Committed all current changes"
echo "   - Reviewed the deletion list"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo ""
echo "🗑️  Starting Phase 1 Cleanup..."

# 1. Delete Unused Components (46 files)
echo "📦 Deleting unused components..."
rm -rf components/providers/
rm -rf components/performance/
rm -f components/accessibility/accessibility-audit.tsx
rm -rf components/seo/
rm -f components/category-icons.tsx
rm -f components/filters/mobile-filter-sheet.tsx
rm -f components/product/enhanced-product-gallery.tsx
rm -rf components/recommendations/
rm -f components/write-review-button.tsx
rm -f components/size-guide-modal.tsx
rm -f components/pwa-install-prompt.tsx
rm -f components/service-worker-provider.tsx

# 2. Delete Unused Hooks (13 files)
echo "🪝 Deleting unused hooks..."
rm -f hooks/use-accessibility.ts
rm -f hooks/use-async.ts
rm -f hooks/use-cart-sync.ts
rm -f hooks/use-font-loading.ts
rm -f hooks/use-haptic-feedback.ts
rm -f hooks/use-keyboard-navigation.ts
rm -f hooks/use-mobile-touch.ts
rm -f hooks/use-prefetch.ts
rm -f hooks/use-stripe-payment.ts
rm -f hooks/use-swipe-gesture.ts
rm -f hooks/use-toast.ts
rm -f hooks/use-wishlist-sync.ts

# 3. Delete Duplicate Auth Components
echo "🔐 Deleting duplicate auth components..."
rm -f components/auth/SignInForm.tsx
rm -f components/auth/SignUpForm.tsx
rm -f components/auth/AuthToggle.tsx
rm -f components/auth/PasswordStrengthMeter.tsx

# 4. Delete Duplicate Error Boundaries
echo "🚨 Deleting duplicate error boundaries..."
rm -f components/app-error-boundary.tsx
rm -f components/error-boundaries/shop-error-boundary.tsx
rm -f components/providers/error-boundary-provider.tsx

# 5. Delete Unused API Routes
echo "🌐 Deleting unused API routes..."
rm -rf app/api/community-fits/
rm -rf app/api/csrf-token/
rm -rf app/api/reviews/
rm -rf app/api/cart/share/
rm -rf app/api/auth/webhook/

# 6. Delete Redundant MD Files
echo "📄 Deleting redundant documentation..."
rm -f HERO_*.md
rm -f PHASE_*.md
rm -f CATEGORY_VISIBILITY_FIX.md
rm -f UNIFIED_LAYOUT_IMPLEMENTATION.md
rm -rf docs/10-legacy/

# 7. Delete Admin Section (commented out - confirm before running)
echo "🔐 Admin section deletion skipped (uncomment if needed)"
# rm -rf app/\(admin\)/

# 8. Delete Overengineered Libraries
echo "📚 Deleting overengineered libraries..."
rm -rf lib/recommendations/
rm -rf lib/events/
rm -f lib/design-tokens.ts
rm -f lib/seo-enhanced.ts
rm -f lib/security-fortress.ts
rm -f lib/stores/slices/enhanced-cart.ts
rm -f lib/stores/slices/enhanced-cart.test.ts
rm -f lib/stores/slices/cart-server.ts
rm -rf lib/pwa/

# 9. Delete Unused Scripts
echo "📜 Deleting unused scripts..."
rm -f scripts/analyze-bundle.js
rm -f scripts/monitor-css-performance.js
rm -f scripts/rename-components.sh
rm -f scripts/generate-production-secrets.js
rm -f scripts/production-build.sh

# 10. Delete Build Artifacts
echo "🏗️  Cleaning build artifacts..."
rm -f build-output.log
rm -f server.log

# 11. Delete Extra Jest Configs
echo "🧪 Deleting redundant Jest configs..."
rm -f jest.config.frontend.js
rm -f jest.config.unit.js
rm -f jest.config.integration.js
rm -f jest.config.component.js
rm -f jest.config.domain.js

# 12. Delete Extra TypeScript Configs
echo "📘 Deleting redundant TypeScript configs..."
rm -f tsconfig.build.json
rm -f tsconfig.test.json

echo ""
echo "✅ Phase 1 Cleanup Complete!"
echo ""
echo "📊 Summary:"
echo "   - Deleted ~100+ unused files"
echo "   - Removed duplicate components"
echo "   - Cleaned up redundant configs"
echo "   - Eliminated overengineered code"
echo ""
echo "🎯 Next Steps:"
echo "   1. Run 'npm install' to update lockfile"
echo "   2. Run 'npm run build' to verify build still works"
echo "   3. Run 'npm test' to ensure tests pass"
echo "   4. Commit changes with message: 'refactor: Phase 1 cleanup - remove dead code'"
echo ""
echo "📈 Expected Impact:"
echo "   - 30% code reduction"
echo "   - Faster build times"
echo "   - Cleaner codebase"