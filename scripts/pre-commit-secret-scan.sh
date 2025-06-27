#!/bin/bash

# Pre-commit hook to scan for secrets
# Install this by copying to .git/hooks/pre-commit

echo "🔍 Scanning for secrets before commit..."

# Patterns to check for
SECRET_PATTERNS=(
  "sk_live_[0-9a-zA-Z]{24,}"
  "sk_test_[0-9a-zA-Z]{24,}"
  "pk_live_[0-9a-zA-Z]{24,}"
  "pk_test_[0-9a-zA-Z]{24,}"
  "whsec_[0-9a-zA-Z]{24,}"
  "sk_test_[A-Za-z0-9]{40,}"
  "AKIA[0-9A-Z]{16}"
  "postgres(ql)?://[^:]+:[^@]+@"
  "mongodb(\+srv)?://[^:]+:[^@]+@"
  "redis://[^:]+:[^@]+@"
  "JWT_SECRET[\"']?[:=][\s]*[\"'][^\"']{32,}"
  "COOKIE_SECRET[\"']?[:=][\s]*[\"'][^\"']{32,}"
  "password[\"']?[:=][\s]*[\"'][^\"']{8,}"
)

# Get list of files to be committed
FILES=$(git diff --cached --name-only --diff-filter=ACM)

FOUND_SECRETS=0

for file in $FILES; do
  # Skip binary files
  if [[ $(file -b --mime-type "$file") =~ ^(image|video|audio|application/(octet-stream|pdf|zip)) ]]; then
    continue
  fi
  
  # Check each pattern
  for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -E "$pattern" "$file" >/dev/null 2>&1; then
      echo "❌ Potential secret found in $file"
      echo "   Pattern matched: $pattern"
      FOUND_SECRETS=1
    fi
  done
  
  # Check for .env files
  if [[ "$file" =~ \.env($|\.) ]] && [[ ! "$file" =~ \.example$ ]]; then
    echo "❌ Attempting to commit environment file: $file"
    echo "   Environment files should not be committed!"
    FOUND_SECRETS=1
  fi
done

if [ $FOUND_SECRETS -eq 1 ]; then
  echo ""
  echo "🚨 COMMIT BLOCKED: Potential secrets detected!"
  echo ""
  echo "Please remove any secrets from your files before committing."
  echo "Use environment variables or .env.local for sensitive data."
  echo ""
  echo "If this is a false positive, you can bypass this check with:"
  echo "  git commit --no-verify"
  echo ""
  echo "However, please ensure no real secrets are being committed!"
  exit 1
fi

echo "✅ No secrets detected. Proceeding with commit."
exit 0