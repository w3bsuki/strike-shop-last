#!/bin/bash

# Security Audit Script for Strike Shop
# This script checks for potential security issues in the git repository

echo "🔍 Starting Security Audit..."
echo "==============================="

# Check for sensitive files in git history
echo "1. Checking for sensitive files in git history..."
sensitive_patterns=(
    "\.env$"
    "\.env\.local"
    "\.env\.production"
    "\.env\.development"
    "\.pem$"
    "\.key$"
    "private_key"
    "secret_key"
    "\.p12$"
    "\.pfx$"
    "\.cer$"
    "\.crt$"
)

found_issues=0

for pattern in "${sensitive_patterns[@]}"; do
    if git log --all --full-history --oneline --name-only | grep -E "$pattern" | grep -v -E "(example|template|test)" > /dev/null 2>&1; then
        echo "⚠️  WARNING: Found potential sensitive file pattern: $pattern"
        git log --all --full-history --oneline --name-only | grep -E "$pattern" | grep -v -E "(example|template|test)" | head -5
        ((found_issues++))
    fi
done

# Check for exposed secrets in code
echo -e "\n2. Checking for exposed secrets in current code..."
secret_patterns=(
    "sk_live_"
    "pk_live_"
    "api_key"
    "API_KEY"
    "password="
    "PASSWORD="
    "secret="
    "SECRET="
    "token="
    "TOKEN="
)

for pattern in "${secret_patterns[@]}"; do
    results=$(grep -r "$pattern" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null | grep -v -E "(process\.env|import\.meta\.env|example|template|test|mock)" | head -5)
    if [ ! -z "$results" ]; then
        echo "⚠️  WARNING: Found potential exposed secret pattern: $pattern"
        echo "$results"
        ((found_issues++))
    fi
done

# Check current .env files
echo -e "\n3. Checking current .env files..."
env_files=$(find . -name ".env*" -type f ! -name "*.example" ! -name "*.template" | grep -v node_modules)
if [ ! -z "$env_files" ]; then
    echo "📁 Found .env files (ensure these are in .gitignore):"
    echo "$env_files"
    
    # Check if they're ignored
    for file in $env_files; do
        if ! git check-ignore "$file" > /dev/null 2>&1; then
            echo "⚠️  WARNING: $file is NOT ignored by git!"
            ((found_issues++))
        else
            echo "✅ $file is properly ignored"
        fi
    done
fi

# Summary
echo -e "\n==============================="
if [ $found_issues -eq 0 ]; then
    echo "✅ Security audit complete: No issues found!"
else
    echo "⚠️  Security audit complete: Found $found_issues potential issues"
    echo "Please review the warnings above and take appropriate action."
fi

echo -e "\nRecommendations:"
echo "1. Never commit .env files - use .env.example for templates"
echo "2. Use environment variables for all secrets"
echo "3. Rotate any keys that may have been exposed"
echo "4. Enable GitHub secret scanning on your repository"
echo "5. Use git-secrets or similar tools for pre-commit hooks"