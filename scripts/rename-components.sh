#!/bin/bash

# Script to rename PascalCase component files to kebab-case
# and update all imports

echo "🔧 Starting component renaming..."

# Create a mapping of old to new names
declare -A rename_map=(
    ["QuickViewModal.tsx"]="quick-view-modal.tsx"
    ["AdminDashboard.tsx"]="admin-dashboard.tsx"
    ["AdminDashboardOptimized.tsx"]="admin-dashboard-optimized.tsx"
    ["OrdersTable.tsx"]="orders-table.tsx"
    ["AuthModal.tsx"]="auth-modal.tsx"
    ["AuthToggle.tsx"]="auth-toggle.tsx"
    ["PasswordStrengthMeter.tsx"]="password-strength-meter.tsx"
    ["SignInForm.tsx"]="sign-in-form.tsx"
    ["SignUpForm.tsx"]="sign-up-form.tsx"
    ["CategoriesPage.tsx"]="categories-page.tsx"
    ["CategoryCard.tsx"]="category-card.tsx"
    ["CategoryFilters.tsx"]="category-filters.tsx"
    ["CategoryGrid.tsx"]="category-grid.tsx"
    ["CategoryHeader.tsx"]="category-header.tsx"
    ["CategoryIcon.tsx"]="category-icon.tsx"
    ["CategoryPageClient.tsx"]="category-page-client.tsx"
    ["CategoryProducts.tsx"]="category-products.tsx"
    ["ProductCard.tsx"]="product-card.tsx"
)

# Function to update imports in a file
update_imports() {
    local file=$1
    echo "Updating imports in: $file"
    
    for old_name in "${!rename_map[@]}"; do
        new_name="${rename_map[$old_name]}"
        old_base="${old_name%.tsx}"
        new_base="${new_name%.tsx}"
        
        # Update import statements
        sed -i "s|/${old_base}'|/${new_base}'|g" "$file" 2>/dev/null || true
        sed -i "s|/${old_base}\"|/${new_base}\"|g" "$file" 2>/dev/null || true
        sed -i "s|\./${old_base}'|\./${new_base}'|g" "$file" 2>/dev/null || true
        sed -i "s|\./${old_base}\"|\./${new_base}\"|g" "$file" 2>/dev/null || true
    done
}

# First, update all imports in the codebase
echo "📝 Updating imports..."
find . -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | grep -v node_modules | while read -r file; do
    update_imports "$file"
done

# Then rename the actual files
echo "📁 Renaming files..."
for old_name in "${!rename_map[@]}"; do
    new_name="${rename_map[$old_name]}"
    
    # Find and rename the file
    find components -name "$old_name" -type f | while read -r file_path; do
        dir=$(dirname "$file_path")
        new_path="$dir/$new_name"
        
        if [ -f "$file_path" ]; then
            echo "Renaming: $file_path → $new_path"
            mv "$file_path" "$new_path"
        fi
    done
done

echo "✅ Component renaming complete!"
echo "⚠️  Please run 'npm run type-check' to verify all imports are correct"