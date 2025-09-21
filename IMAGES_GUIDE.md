# 📸 Images Setup Guide

## 🎯 How to Add Your Real Images

### Step 1: Prepare Your Images

1. **Profile Picture** (`Public/images/profile.jpg`)
   - Use the first image you provided (the icon/avatar)
   - Recommended size: 400x400px
   - Format: JPG, PNG, or WebP
   - Should be a square, high-quality image

2. **Hero Background** (`Public/images/hero-background.jpg`)
   - Use the landscape/mountains image you provided
   - Recommended size: 1920x1080px or higher
   - Format: JPG (for best compression)
   - Will be used as the full-screen hero background

3. **Company Logo** (`Public/images/company-logos/rappi.png`)
   - Add the real Rappi logo
   - Recommended size: 64x64px
   - Format: PNG (for transparency)
   - Square format preferred

### Step 2: Replace the Placeholder Files

```bash
# Navigate to your project
cd /Users/alph0x/Developer/alph0x.github.io

# Replace with your real images
cp /path/to/your/profile-image.jpg Public/images/profile.jpg
cp /path/to/your/hero-background.jpg Public/images/hero-background.jpg
cp /path/to/rappi-logo.png Public/images/company-logos/rappi.png
```

### Step 3: Regenerate the Static Site

```bash
# Regenerate with your new images
./generate-static.sh

# The images will be automatically copied to docs/images/
# and referenced correctly in the HTML
```

### Step 4: Commit and Deploy

```bash
git add .
git commit -m "feat: add real profile and background images"
git push
```

## 🌟 Current Image Setup

### Images Currently Used:
- **Profile**: `/images/profile.jpg` (placeholder)
- **Background**: `/images/hero-background.jpg` (placeholder)  
- **Rappi Logo**: `/images/company-logos/rappi.png` (placeholder)

### Apple-Style Design Features:
- ✅ **Hero background**: Full-screen landscape image
- ✅ **Profile picture**: Circular with Apple-style border
- ✅ **Company logos**: Clean, minimal presentation
- ✅ **Backdrop blur**: Modern glass effect
- ✅ **Smooth animations**: Apple-like transitions

## 🔄 Automatic Workflow

Once you add your real images:

1. **Edit images** → 2. **Run generate-static.sh** → 3. **Push to GitHub** → 4. **Site updates automatically**

Your images will be:
- ✅ **Hosted locally** by your website
- ✅ **Automatically optimized** for web
- ✅ **Responsive** across all devices
- ✅ **Apple-styled** with modern effects

## 📱 Apple Aesthetic Features

Your website now includes:
- 🍎 **Apple typography** (-apple-system font)
- 🌊 **Backdrop blur effects** 
- 🎨 **Minimal color palette**
- ✨ **Smooth animations** (cubic-bezier easing)
- 📊 **Quantified skills** with progress bars
- 🏔️ **Hero background** with overlay
- 🔘 **Rounded corners** and clean spacing

Ready to make your website uniquely yours! 🚀
