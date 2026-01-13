#!/bin/bash

# WebScope Extension - Setup Verification Script
# This script verifies that all required files are in place

echo "🔍 WebScope Extension - Setup Verification"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAIL++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/"
        ((FAIL++))
    fi
}

echo "📁 Checking directory structure..."
check_dir "src"
check_dir "media"
echo ""

echo "📄 Checking source files..."
check_file "src/extension.ts"
check_file "src/vscode.d.ts"
echo ""

echo "⚙️  Checking configuration files..."
check_file "package.json"
check_file "tsconfig.json"
check_file ".eslintrc.json"
check_file ".gitignore"
check_file ".vscodeignore"
echo ""

echo "📚 Checking documentation files..."
check_file "README.md"
check_file "DEVELOPMENT.md"
check_file "IMPLEMENTATION_GUIDE.md"
check_file "QUICK_REFERENCE.md"
check_file "VISUAL_GUIDE.md"
check_file "DELIVERY_SUMMARY.md"
check_file "INDEX.md"
echo ""

echo "📋 Checking example files..."
check_file "example.html"
echo ""

echo "=============================================="
echo -e "${GREEN}Passed:${NC} $PASS"
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}Failed:${NC} $FAIL"
else
    echo -e "${GREEN}Failed:${NC} 0"
fi

if [ $FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All files verified!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. npm install"
    echo "  2. npm run watch"
    echo "  3. Press F5 to launch extension"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some files are missing!${NC}"
    exit 1
fi
