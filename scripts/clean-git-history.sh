#!/bin/bash

# Script to remove sensitive files from git history
# CAUTION: This rewrites git history! Make sure to backup first.

echo "🔐 Git History Cleaner for Strike Shop"
echo "====================================="
echo ""
echo "⚠️  WARNING: This script will rewrite git history!"
echo "Make sure you have:"
echo "1. Backed up your repository"
echo "2. Coordinated with your team"
echo "3. Understand the implications"
echo ""

read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Files to remove from history
FILES_TO_CLEAN=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.development"
    ".env.staging"
    "my-medusa-store/.env"
    "my-medusa-store/.env.production"
)

echo ""
echo "🔍 Files to be removed from history:"
for file in "${FILES_TO_CLEAN[@]}"; do
    echo "   - $file"
done

echo ""
echo "📝 Method 1: Using git filter-branch (built-in)"
echo "================================================"

for file in "${FILES_TO_CLEAN[@]}"; do
    echo "Removing $file from history..."
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch $file" \
        --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true
done

echo ""
echo "📝 Method 2: Using BFG Repo-Cleaner (recommended)"
echo "================================================"
echo ""
echo "BFG is faster and easier to use. To use BFG:"
echo ""
echo "1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/"
echo ""
echo "2. Run these commands:"
echo "   java -jar bfg.jar --delete-files .env"
echo "   java -jar bfg.jar --delete-files .env.local"
echo "   java -jar bfg.jar --delete-files .env.production"
echo ""
echo "3. Clean up and push:"
echo "   git reflog expire --expire=now --all"
echo "   git gc --prune=now --aggressive"
echo "   git push --force --all"
echo "   git push --force --tags"
echo ""

echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Run garbage collection to clean up:"
echo "   git reflog expire --expire=now --all"
echo "   git gc --prune=now --aggressive"
echo ""
echo "2. Force push to remote (coordinate with team!):"
echo "   git push --force --all"
echo "   git push --force --tags"
echo ""
echo "3. All team members must re-clone or reset:"
echo "   git fetch --all"
echo "   git reset --hard origin/main"
echo ""
echo "4. Rotate any exposed secrets immediately!"
echo ""
echo "5. Enable secret scanning to prevent future issues"
echo ""

echo "✅ Script completed. Remember to:"
echo "- Rotate all exposed secrets"
echo "- Force push changes"
echo "- Notify team members"
echo "- Update documentation"