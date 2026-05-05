# Technical Review

**Document Version:** 1.0  
**Last Updated:** 2026-04-12  
**Project:** Alfredo Pérez — Mobile Engineer Portfolio

---

## 1. Project Overview

This project is a personal portfolio website for Alfredo Pérez, a multiplatform mobile software engineer. It serves as a professional showcase featuring his experience, skills, and technical expertise in mobile development.

### 1.1 Repository Structure

```
alph0x.github.io/
├── .github/workflows/ci.yml     # CI/CD pipeline
├── docs/                        # Static site output
│   ├── index.html               # Main portfolio page
│   └── images/                  # Static assets
├── local-reasoning/             # Personal workspace (experimental)
├── vercel.json                  # Vercel deployment configuration
├── CNAME                        # Custom domain configuration
└── Technical-Review.md         # This document
```

---

## 2. Infrastructure & Deployment

### 2.1 Hosting Platform

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Primary Hosting | Vercel | Current | CDN-backed static site hosting |
| Custom Domain | GitHub Pages compatible | — | `alph0x.github.io` with CNAME |

### 2.2 Deployment Configuration

**Vercel Configuration (`vercel.json`):**
```json
{
  "outputDirectory": "docs",
  "headers": [{
    "source": "/(.*)",
    "headers": [{
      "key": "Cache-Control",
      "value": "public, max-age=3600"
    }]
  }]
}
```

### 2.3 CI/CD Pipeline

**Platform:** GitHub Actions  
**Workflow File:** `.github/workflows/ci.yml`

| Step | Action | Purpose |
|------|--------|---------|
| Trigger | Push to `master` or PR to `master` | Automatic deployment |
| Checkout | `actions/checkout@v4` | Clone repository |
| Verify | Check `docs/index.html` exists | Pre-deployment validation |
| Deploy | `vercel/vercel-action@v1.11.0` | Deploy to Vercel CDN |

---

## 3. Frontend Technologies

### 3.1 Core Stack

| Layer | Technology | Standard |
|-------|------------|----------|
| Structure | HTML5 | W3C Standard |
| Styling | CSS3 | W3C Standard |
| Interactivity | Vanilla JavaScript | ES6+ |
| Fonts | Google Fonts API | — |

### 3.2 CSS Architecture

The portfolio uses **modern CSS features** without external frameworks:

#### Custom Properties (CSS Variables)
```css
:root {
  --black:  #050505;
  --yellow: #c0fc04;
  --pink:   #ea027e;
  --orange: #ff5500;
  --blue:   #3601fb;
  --cyan:   #00e5ff;
  --red:    #ff1a1a;
  --white:  #f0f0f0;
}
```

#### Layout Systems
- **Flexbox** — Navigation, hero sections, contact links
- **CSS Grid** — Skills grid, two-column layouts, stat rows

#### Responsive Design
- Mobile-first approach
- Breakpoint at 768px
- Fluid typography with `clamp()`
- Mobile bottom navigation bar

#### Animations & Effects
- **Keyframe animations** — Blinking cursor, scaleX hero rule
- **CSS transitions** — Hover states, color changes
- **Intersection Observer** — Scroll reveal effects (JavaScript)
- **Scanlines overlay** — Retro CRT effect using repeating gradients
- **SVG decorations** — Geometric shapes in hero section

### 3.3 Typography

**Font Families:**
| Font | Usage | Source |
|------|-------|--------|
| Barlow Condensed | Display headings, titles | Google Fonts |
| Space Mono | Body text, labels, metadata | Google Fonts |

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### 3.4 Visual Design System

**Color Palette:**
| Name | Hex | Usage |
|------|-----|-------|
| Black | `#050505` | Background |
| Yellow | `#c0fc04` | Primary accent |
| Pink | `#ea027e` | Secondary accent |
| Orange | `#ff5500` | Tertiary accent |
| Blue | `#3601fb` | Quaternary accent |
| Cyan | `#00e5ff` | Quinary accent |
| Red | `#ff1a1a` | Senary accent |
| White | `#f0f0f0` | Text color |

**Tag System:**
```css
.t-y  { background: var(--yellow); color: #000; }
.t-p  { background: var(--pink);   color: #fff; }
.t-o  { background: var(--orange); color: #000; }
/* ... outline variants: t-yo, t-po, t-oo ... */
```

### 3.5 JavaScript Features

**Intersection Observer for Scroll Reveal:**
```javascript
// Reveal animation on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('on');
    }
  });
});
```

---

## 4. Version Control

| Component | Technology |
|-----------|------------|
| VCS | Git |
| Remote | GitHub |
| Branches | `master` (main), `gh-pages` |

### 4.1 Gitignore Configuration
Standard ignores for:
- macOS system files (`.DS_Store`)
- Editor configurations
- Vercel/Node artifacts

---

## 5. Content Organization

### 5.1 Page Sections

| Section ID | Content |
|------------|---------|
| `#hero` | Name, title, profile card |
| `#profile` | Bio, stats, skills grid |
| `#experience` | Work history timeline |
| `#education` | Academic background |
| `#contact` | Contact links |

### 5.2 Semantic HTML Elements

- `<nav>` — Navigation bar
- `<section>` — Page sections
- `<header>` / `<footer>` — Site header and footer
- `<ul>` with semantic class names for lists

---

## 6. Performance Considerations

| Optimization | Implementation |
|-------------|---------------|
| Caching | `Cache-Control: public, max-age=3600` |
| Font Loading | `rel="preconnect"` to Google Fonts |
| Images | `loading="eager"` and `decoding="async"` |
| CSS | Inline styles (single file, no external requests) |
| No JavaScript frameworks | Pure vanilla JS, minimal footprint |

---

## 7. External Dependencies

### 7.1 CDN Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| Google Fonts | `fonts.googleapis.com` | Typography |
| Google Fonts Static | `fonts.gstatic.com` | Font assets |

### 7.2 No External Libraries

The site deliberately avoids:
- CSS frameworks (Tailwind, Bootstrap)
- JavaScript frameworks (React, Vue)
- Animation libraries (GSAP)
- Icon packs (Font Awesome)

This ensures:
- Zero external JavaScript
- Minimal request count
- Fast load times
- No dependency vulnerabilities

---

## 8. Browser Support

| Feature | Support |
|---------|---------|
| CSS Custom Properties | Modern browsers |
| CSS Grid | Modern browsers |
| Intersection Observer | Modern browsers |
| ES6+ JavaScript | Modern browsers |
| `clamp()` CSS | Modern browsers |

---

## 9. Development Workflow

### 9.1 Local Development

1. Clone repository
2. Edit `docs/index.html`
3. Preview locally (any static server)
4. Commit changes

### 9.2 Deployment Flow

```
Local → Git Push → GitHub Actions → Vercel → Production
              ↓
         PR creates preview deployment
```

---

## 10. Security Considerations

| Aspect | Implementation |
|--------|------------|
| Content Security | No eval(); minimal inline script for scroll reveal |
| Font Security | Google Fonts over HTTPS |
| Cache Control | Configured via Vercel headers |
| Secrets | Vercel token stored as GitHub Secret |

---

## 11. Technology Summary

| Category | Technologies |
|----------|-------------|
| **Infrastructure** | Vercel, GitHub Pages, GitHub Actions |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Typography** | Google Fonts (Barlow Condensed, Space Mono) |
| **Version Control** | Git, GitHub |
| **CI/CD** | GitHub Actions, Vercel Actions |
| **No Dependencies** | Zero npm packages, zero frameworks |

---

## 12. Future Considerations

Potential enhancements for the portfolio:

- [ ] Add a build step (e.g., Vite) for asset optimization and modular development
- [ ] Implement dark/light theme toggle
- [ ] Add internationalization (i18n)
- [ ] Include WebP image optimization
- [ ] Add Lighthouse CI integration
- [ ] Implement PWA capabilities

