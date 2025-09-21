# Images Directory

This directory contains the images used by the website.

## Required Images

Please add these images to this directory:

1. **profile.jpg** (400x400px) - Your profile picture
   - Use the first image you provided (the icon/avatar)
   - Recommended: Square format, high quality

2. **hero-background.jpg** (1920x1080px) - Hero section background
   - Use the landscape/mountains image you provided
   - This will be used as the hero section background

3. **company-logos/** - Company logos for experience section
   - **rappi.png** - Rappi company logo
   - Add other company logos as needed

## Usage

The images will be served at:
- `/images/profile.jpg` - Your profile picture
- `/images/hero-background.jpg` - Hero background
- `/images/company-logos/rappi.png` - Company logos

## Instructions

1. Save your images in this directory with the exact names above
2. Update the JSON file to reference the local paths
3. Regenerate the static site with `./generate-static.sh`
4. The images will be automatically included in the generated static site
