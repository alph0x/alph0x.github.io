#!/bin/bash

# CI Compatibility Validation Script
# This script validates that the project is compatible with GitHub Actions
# before pushing to avoid failed CI builds

echo "🔍 CI Compatibility Validation Tool"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Initialize counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Function to record check result
record_check() {
    local status=$1
    local message=$2
    
    if [ "$status" = "PASS" ]; then
        print_status $GREEN "✅ $message"
        ((CHECKS_PASSED++))
    elif [ "$status" = "FAIL" ]; then
        print_status $RED "❌ $message"
        ((CHECKS_FAILED++))
    elif [ "$status" = "WARN" ]; then
        print_status $YELLOW "⚠️  $message"
        ((WARNINGS++))
    fi
}

echo ""
print_status $BLUE "🔍 Checking Swift version compatibility..."

# Check Swift version in Package.swift
if [ -f "Package.swift" ]; then
    SWIFT_VERSION=$(grep "swift-tools-version:" Package.swift | sed 's/.*swift-tools-version://' | tr -d ' ')
    print_status $YELLOW "📋 Package.swift Swift version: $SWIFT_VERSION"
    
    if [[ "$SWIFT_VERSION" == "5.9" ]]; then
        record_check "PASS" "Package.swift uses compatible Swift version ($SWIFT_VERSION)"
    else
        record_check "FAIL" "Package.swift uses potentially incompatible Swift version ($SWIFT_VERSION)"
        print_status $RED "   Expected: 5.9 for GitHub Actions compatibility"
    fi
else
    record_check "FAIL" "Package.swift not found"
fi

# Check GitHub Actions Swift version
if [ -f ".github/workflows/ci.yml" ]; then
    GHA_SWIFT_VERSION=$(grep "swift-version:" .github/workflows/ci.yml | head -1 | sed "s/.*swift-version: *'//" | sed "s/'.*//")
    print_status $YELLOW "📋 GitHub Actions Swift version: $GHA_SWIFT_VERSION"
    
    if [[ "$GHA_SWIFT_VERSION" == "5.9.2" ]]; then
        record_check "PASS" "GitHub Actions uses available Swift version ($GHA_SWIFT_VERSION)"
        
        # Check if using compatible macOS runner
        if grep -q "runs-on: macos-13" .github/workflows/ci.yml; then
            record_check "PASS" "Using macOS-13 runner (compatible with Swift 5.9.2)"
        elif grep -q "runs-on: macos-latest" .github/workflows/ci.yml; then
            record_check "FAIL" "Using macos-latest runner (has macOS 15.5 SDK incompatible with Swift 5.9.2)"
            print_status $RED "   Change to: runs-on: macos-13"
        fi
    else
        record_check "FAIL" "GitHub Actions uses potentially unavailable Swift version ($GHA_SWIFT_VERSION)"
        print_status $RED "   Recommended: 5.9.2 with macos-13 runner"
    fi
else
    record_check "FAIL" "GitHub Actions workflow file not found"
fi

# Check Docker Swift version
if [ -f "web.Dockerfile" ]; then
    DOCKER_SWIFT_VERSION=$(grep "FROM swift:" web.Dockerfile | sed 's/.*FROM swift://' | sed 's/-jammy.*//')
    print_status $YELLOW "📋 Docker Swift version: $DOCKER_SWIFT_VERSION"
    
    if [[ "$DOCKER_SWIFT_VERSION" == "5.9.2" ]]; then
        record_check "PASS" "Docker uses compatible Swift version ($DOCKER_SWIFT_VERSION)"
    else
        record_check "WARN" "Docker uses different Swift version ($DOCKER_SWIFT_VERSION)"
    fi
else
    record_check "WARN" "Dockerfile not found"
fi

echo ""
print_status $BLUE "🔍 Checking dependency compatibility..."

# Check Vapor version
if [ -f "Package.swift" ]; then
    VAPOR_VERSION=$(grep "vapor.git" Package.swift | sed 's/.*from: "//' | sed 's/").*//')
    print_status $YELLOW "📋 Vapor version: $VAPOR_VERSION"
    
    # Vapor 4.106.0+ requires Swift 5.9+
    if [[ "$VAPOR_VERSION" > "4.106.0" ]] && [[ "$SWIFT_VERSION" < "5.9" ]]; then
        record_check "FAIL" "Vapor $VAPOR_VERSION requires Swift 5.9+, but Package.swift uses $SWIFT_VERSION"
    else
        record_check "PASS" "Vapor version ($VAPOR_VERSION) is compatible with Swift $SWIFT_VERSION"
    fi
else
    record_check "FAIL" "Cannot check Vapor version - Package.swift not found"
fi

echo ""
print_status $BLUE "🔍 Checking Package.resolved format..."

# Check Package.resolved format
if [ -f "Package.resolved" ]; then
    if grep -q '"version" : 3' Package.resolved; then
        record_check "FAIL" "Package.resolved uses format version 3 (Swift 6.0+)"
        print_status $RED "   This will cause 'unknown PinsStorage version 3' error in GitHub Actions"
        print_status $YELLOW "   Fix: rm Package.resolved && swift package resolve"
    elif grep -q '"version" : 2' Package.resolved; then
        record_check "PASS" "Package.resolved uses compatible format version 2"
    else
        record_check "WARN" "Package.resolved format version unclear"
    fi
else
    record_check "WARN" "Package.resolved not found (will be generated in CI)"
fi

echo ""
print_status $BLUE "🔍 Checking for known CI failure patterns..."

# Check for deprecated Application constructor
if grep -r "Application(" Sources/ Tests/ 2>/dev/null | grep -v "// swift-tools-version" >/dev/null; then
    record_check "WARN" "Found deprecated Application() constructor"
    print_status $YELLOW "   This causes warnings but won't fail CI"
    print_status $YELLOW "   Consider migrating to Application.make() for cleaner builds"
fi

# Check for potential test memory issues
if grep -r "app = Application" Tests/ 2>/dev/null >/dev/null; then
    record_check "WARN" "Found Application instances in tests"
    print_status $YELLOW "   Ensure proper cleanup to avoid memory issues in CI"
fi

# Check for macOS-specific code that might fail in Linux CI
if grep -r "import Cocoa\|import AppKit\|import Foundation" Sources/ 2>/dev/null | grep -v "import Foundation$" >/dev/null; then
    record_check "WARN" "Found potential macOS-specific imports"
    print_status $YELLOW "   Verify cross-platform compatibility for Linux CI"
fi

echo ""
print_status $BLUE "🔍 Testing build capability..."

# Test build
if swift build >/dev/null 2>&1; then
    record_check "PASS" "Project builds successfully"
else
    record_check "FAIL" "Project fails to build"
    print_status $RED "   Build errors will definitely cause CI failure"
fi

echo ""
print_status $BLUE "📊 Validation Summary"
print_status $BLUE "===================="

if [ $CHECKS_FAILED -eq 0 ]; then
    print_status $GREEN "🎉 All critical checks passed!"
    if [ $WARNINGS -gt 0 ]; then
        print_status $YELLOW "⚠️  $WARNINGS warning(s) found - review recommended"
    fi
    print_status $GREEN "✅ Project is ready for GitHub Actions deployment"
    exit 0
else
    print_status $RED "💥 $CHECKS_FAILED critical issue(s) found"
    print_status $RED "❌ Project will likely fail in GitHub Actions"
    print_status $YELLOW "📋 Fix the issues above before pushing"
    exit 1
fi
