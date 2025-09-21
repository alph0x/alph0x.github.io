# Development Guide - Personal Website

This guide explains how the automated static site generation works and how to update your personal website.

## 🔄 How It Works

### 1. **Dynamic Content Source**
Your personal information is stored in `Resources/Information/personal.json`:
- Personal details (name, title, role)
- Professional experience (companies, roles, duties)
- Skills and technologies
- Projects portfolio
- Social media links

### 2. **Vapor Swift Backend**
The Vapor application (`Sources/App/`) serves dynamic pages:
- **Routes** (`routes.swift`): Handles localized URLs (`/es`, `/en`, `/es/experience`, etc.)
- **Models** (`Models/PersonalInfo.swift`): Structures for JSON data
- **Views** (`Resources/Views/`): Leaf templates that render HTML from JSON data
- **Middleware** (`Middleware/LocalizationMiddleware.swift`): Language detection

### 3. **Static Site Generation**
The `generate-static.sh` script:
1. Builds and starts the Vapor server
2. Requests all pages (`/`, `/es`, `/en`, `/es/experience`, etc.)
3. Saves the rendered HTML to `docs/` directory
4. Creates SEO files (`sitemap.xml`, `robots.txt`)
5. Validates all generated content

### 4. **GitHub Pages Deployment**
- GitHub Pages serves files from `docs/` directory
- Static HTML files are responsive and fully functional
- All dynamic content is pre-rendered from your JSON data

## 📝 How to Update Your Website

### Option 1: Update Personal Information
```bash
# 1. Edit your personal data
vim Resources/Information/personal.json

# 2. Regenerate static site
./generate-static.sh

# 3. Commit and push
git add .
git commit -m "feat: update experience data"
git push  # Automatic validation + deployment
```

### Option 2: Update Design/Layout
```bash
# 1. Edit Leaf templates
vim Resources/Views/home.leaf

# 2. Test locally
swift run
# Visit http://localhost:8080

# 3. Regenerate static site
./generate-static.sh

# 4. Commit and push
git add .
git commit -m "feat: update homepage design"
git push
```

### Option 3: Add New Sections
```bash
# 1. Add new route in routes.swift
# 2. Create new Leaf template
# 3. Update generate-static.sh to include new pages
# 4. Test and deploy
```

## 🧪 Testing

### Local Testing
```bash
# Run all tests
swift test

# Run specific test suites
swift test --filter StaticSiteValidationTests
swift test --filter testPersonalInfoAPI
```

### Automated Testing
- **Pre-commit**: Build validation
- **Pre-push**: Tests + static site validation
- **GitHub Actions**: CI/CD with automated deployment

## 📁 File Structure

```
├── Resources/Information/personal.json    # 📊 Your data source
├── Resources/Views/                       # 🎨 Leaf templates
│   ├── index.leaf                        # Base template
│   ├── home.leaf                         # Homepage
│   ├── experience.leaf                   # Experience page
│   └── projects.leaf                     # Projects page
├── Sources/App/                          # 🚀 Vapor backend
├── docs/                                 # 📄 Generated static site
├── generate-static.sh                    # 🔄 Generation script
└── .github/workflows/ci.yml             # 🤖 CI/CD pipeline
```

## 🎯 Key Features

### Dynamic Content
- ✅ **JSON-driven**: All content loads from `personal.json`
- ✅ **Localized**: Spanish/English automatic detection
- ✅ **Responsive**: Mobile-first design with TailwindCSS
- ✅ **Themed**: Dark/light mode with persistence

### Automated Workflow
- ✅ **Git Hooks**: Prevent broken commits/pushes
- ✅ **Static Generation**: Automatic HTML creation from Vapor
- ✅ **GitHub Pages**: Automatic deployment
- ✅ **CI/CD**: Continuous integration and deployment

### Quality Assurance
- ✅ **15 Tests**: Comprehensive validation
- ✅ **HTML Validation**: Structure and content checks
- ✅ **SEO Optimization**: Sitemap, robots.txt, meta tags
- ✅ **Performance**: Optimized assets and caching

## 🚀 Deployment

Your site automatically deploys to **https://alph0x.github.io** when you push to the `master` branch.

### Manual Deployment
If you need to deploy manually:
```bash
./generate-static.sh
git add docs/
git commit -m "chore: update static site"
git push
```

## 🔧 Troubleshooting

### Static Generation Fails
1. Check Vapor server starts: `swift run`
2. Test routes manually: `curl http://localhost:8080/`
3. Check Leaf template syntax
4. Review server logs

### Tests Failing
1. Run tests locally: `swift test`
2. Check file paths in `StaticSiteValidationTests`
3. Verify JSON data format
4. Ensure all required files exist

### GitHub Pages Not Updating
1. Check GitHub Pages settings (Settings → Pages)
2. Verify `docs/` folder has content
3. Check GitHub Actions status
4. Ensure branch is `master` and folder is `/docs`

---

*This system automatically converts your Vapor Swift application into a static website for GitHub Pages while maintaining all dynamic functionality during development.*
