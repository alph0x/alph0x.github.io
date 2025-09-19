#!/bin/bash

# Script to install git hooks and pre-commit configuration
echo "🔧 Installing git hooks and pre-commit configuration..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_status $RED "❌ Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Make scripts executable
print_status $YELLOW "🔄 Making scripts executable..."
chmod +x generate-static.sh
chmod +x hooks/pre-push
chmod +x install-hooks.sh

# Install pre-push hook
print_status $YELLOW "🔄 Installing pre-push hook..."
cp hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push

# Check if pre-commit is installed
if command -v pre-commit &> /dev/null; then
    print_status $GREEN "✅ pre-commit is already installed"
    
    # Install pre-commit hooks
    print_status $YELLOW "🔄 Installing pre-commit hooks..."
    pre-commit install
    pre-commit install --hook-type pre-push
    
    print_status $GREEN "✅ Pre-commit hooks installed"
else
    print_status $YELLOW "⚠️  pre-commit is not installed"
    print_status $YELLOW "📋 To install pre-commit, run one of these commands:"
    print_status $YELLOW "   - pip install pre-commit"
    print_status $YELLOW "   - brew install pre-commit"
    print_status $YELLOW "   - pipx install pre-commit"
    print_status $YELLOW ""
    print_status $YELLOW "After installing pre-commit, run this script again."
fi

# Create a simple commit-msg hook for conventional commits
print_status $YELLOW "🔄 Creating commit message validation..."
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# Commit message validation for conventional commits
commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "📋 Commit message should follow conventional commits format:"
    echo "   <type>(<scope>): <description>"
    echo ""
    echo "🏷️  Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert"
    echo ""
    echo "✅ Examples:"
    echo "   feat: add dark mode toggle"
    echo "   fix(api): resolve authentication issue"
    echo "   docs: update README with installation instructions"
    echo "   chore: update dependencies"
    echo ""
    exit 1
fi
EOF

chmod +x .git/hooks/commit-msg

# Test the setup
print_status $YELLOW "🔄 Testing setup..."

# Test Swift build
if swift build > /dev/null 2>&1; then
    print_status $GREEN "✅ Swift build test passed"
else
    print_status $RED "❌ Swift build test failed"
fi

# Test if generate-static.sh is executable
if [ -x "./generate-static.sh" ]; then
    print_status $GREEN "✅ Static site generator is executable"
else
    print_status $RED "❌ Static site generator is not executable"
fi

echo ""
print_status $GREEN "🎉 Git hooks installation completed!"
print_status $GREEN ""
print_status $GREEN "📋 What was installed:"
print_status $GREEN "   ✅ Pre-push hook (runs tests + generates static site)"
print_status $GREEN "   ✅ Commit message validation (conventional commits)"
if command -v pre-commit &> /dev/null; then
    print_status $GREEN "   ✅ Pre-commit hooks (runs tests before commits)"
fi
print_status $GREEN ""
print_status $GREEN "🚀 Your workflow is now automated:"
print_status $GREEN "   1. On commit: Tests run automatically"
print_status $GREEN "   2. On push: Tests + static site generation"
print_status $GREEN "   3. Commit messages are validated"
print_status $GREEN ""
print_status $YELLOW "📝 To test the setup:"
print_status $YELLOW "   git add ."
print_status $YELLOW "   git commit -m 'test: verify hook installation'"
print_status $YELLOW "   git push"
