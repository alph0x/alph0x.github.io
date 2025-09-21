#!/bin/bash

# Enhanced script to generate static HTML files for GitHub Pages
set -e

echo "🚀 Starting static site generation..."

# Configuration
SERVER_URL="http://localhost:8080"
DOCS_DIR="docs"
TIMEOUT=30
RETRY_COUNT=3

# Kill any existing server processes
echo "🧹 Cleaning up existing processes..."
pkill -f "swift run" 2>/dev/null || true
sleep 2

# Function to check if server is responding
check_server() {
    curl -s --max-time 5 "$SERVER_URL" > /dev/null
}

# Function to wait for server with retries
wait_for_server() {
    local count=0
    while [ $count -lt $TIMEOUT ]; do
        if check_server; then
            echo "✅ Server is responding"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    return 1
}

# Build and start Vapor app
echo "🔨 Building project..."
swift build

echo "🔄 Starting Vapor server..."
swift run > server.log 2>&1 &
VAPOR_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
if ! wait_for_server; then
    echo "❌ Server failed to start within $TIMEOUT seconds"
    echo "📋 Server logs:"
    cat server.log
    kill $VAPOR_PID 2>/dev/null
    exit 1
fi

# Create docs directory structure
echo "📁 Creating directory structure..."
rm -rf $DOCS_DIR
mkdir -p $DOCS_DIR/{es,en}/{experience,projects}

# Array of pages to generate
declare -a pages=(
    "index.html:/"
    "es/index.html:/es"
    "en/index.html:/en"
    "es/experience/index.html:/es/experience"
    "en/experience/index.html:/en/experience"
    "es/projects/index.html:/es/projects"
    "en/projects/index.html:/en/projects"
    "404.html:/"
)

echo "📄 Generating HTML files..."

# Generate each page with error checking
for page_info in "${pages[@]}"; do
    IFS=':' read -r filename path <<< "$page_info"
    echo "  📝 Generating $filename..."
    
    # Retry mechanism for each page
    for attempt in $(seq 1 $RETRY_COUNT); do
        if curl -s --max-time 10 "$SERVER_URL$path" > "$DOCS_DIR/$filename"; then
            # Verify the file was created and has content
            if [ -s "$DOCS_DIR/$filename" ]; then
                echo "    ✅ $filename generated successfully"
                break
            else
                echo "    ⚠️  $filename is empty (attempt $attempt/$RETRY_COUNT)"
            fi
        else
            echo "    ❌ Failed to generate $filename (attempt $attempt/$RETRY_COUNT)"
        fi
        
        if [ $attempt -eq $RETRY_COUNT ]; then
            echo "    💥 Failed to generate $filename after $RETRY_COUNT attempts"
            exit 1
        fi
        sleep 2
    done
done

# Copy additional files
echo "📋 Copying additional files..."
# Skip CNAME for now (no custom domain configured)

# Create a simple robots.txt
cat > $DOCS_DIR/robots.txt << EOF
User-agent: *
Allow: /

Sitemap: https://alph0x.github.io/sitemap.xml
EOF
echo "  ✅ robots.txt created"

# Create a basic sitemap
cat > $DOCS_DIR/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://alph0x.github.io/</loc><priority>1.0</priority></url>
    <url><loc>https://alph0x.github.io/es/</loc><priority>0.9</priority></url>
    <url><loc>https://alph0x.github.io/en/</loc><priority>0.9</priority></url>
    <url><loc>https://alph0x.github.io/es/experience/</loc><priority>0.8</priority></url>
    <url><loc>https://alph0x.github.io/en/experience/</loc><priority>0.8</priority></url>
    <url><loc>https://alph0x.github.io/es/projects/</loc><priority>0.8</priority></url>
    <url><loc>https://alph0x.github.io/en/projects/</loc><priority>0.8</priority></url>
</urlset>
EOF
echo "  ✅ sitemap.xml created"

# Stop Vapor server
echo "🛑 Stopping server..."
kill $VAPOR_PID 2>/dev/null
wait $VAPOR_PID 2>/dev/null || true
rm -f server.log

# Validate generated files
echo "🔍 Validating generated files..."
total_files=0
valid_files=0

for page_info in "${pages[@]}"; do
    IFS=':' read -r filename path <<< "$page_info"
    total_files=$((total_files + 1))
    
    if [ -f "$DOCS_DIR/$filename" ] && [ -s "$DOCS_DIR/$filename" ]; then
        # Check if it contains expected content
        if grep -q "Alfredo" "$DOCS_DIR/$filename" && grep -q "<!DOCTYPE html>" "$DOCS_DIR/$filename"; then
            valid_files=$((valid_files + 1))
            echo "  ✅ $filename is valid"
        else
            echo "  ❌ $filename exists but content is invalid"
        fi
    else
        echo "  ❌ $filename is missing or empty"
    fi
done

echo ""
echo "📊 Generation Summary:"
echo "  📄 Total files: $total_files"
echo "  ✅ Valid files: $valid_files"
echo "  📂 Output directory: $DOCS_DIR"

if [ $valid_files -eq $total_files ]; then
    echo "🎉 Static site generated successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review the generated files in the '$DOCS_DIR' directory"
    echo "2. Commit and push the docs folder"
    echo "3. Configure GitHub Pages to serve from /$DOCS_DIR folder"
    echo "4. Your site will be available at https://alph0x.com"
    exit 0
else
    echo "💥 Static site generation completed with errors!"
    echo "   $((total_files - valid_files)) files failed to generate properly"
    exit 1
fi
