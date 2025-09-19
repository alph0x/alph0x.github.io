# Personal Website - Vapor Swift

This is my personal website built entirely with **Vapor Swift**, a modern and powerful web framework for server-side Swift development.

## 🚀 Features

- **Fully built with Swift** using Vapor 4
- **Responsive design** with TailwindCSS
- **Leaf templating system** for dynamic rendering
- **REST API** for programmatic access to information
- **Dockerized** for easy deployment
- **Dynamic data** loaded from JSON
- **Internationalization** (Spanish/English)
- **Dark/Light theme** with persistence
- **Modern animations** and interactions

## 📱 Sections

- **Home Page**: Personal introduction with contact information
- **Experience**: Detailed professional trajectory
- **Projects**: Portfolio of developed projects
- **API**: REST endpoints for data access

## 🛠 Technologies Used

- **Swift 5.8+**
- **Vapor 4.89+**
- **Leaf** (Templating engine)
- **TailwindCSS** (Styling)
- **Font Awesome** (Icons)
- **Docker** (Containerization)

## 🚀 Installation and Development

### Prerequisites

- Swift 5.8 or higher
- Docker (optional)
- Xcode (for macOS development)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alph0x/alph0x.github.io.git
   cd alph0x.github.io
   ```

2. **Install dependencies:**
   ```bash
   swift package resolve
   ```

3. **Run the application:**
   ```bash
   swift run
   ```

4. **Visit the application:**
   Open your browser at `http://localhost:8080`

### Docker Development

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Application will be available at:**
   `http://localhost:8080`

## 📝 Configuration

### Personal Information

Edit the `Resources/Information/personal.json` file to customize:

- Personal and professional information
- Work experience
- Projects
- Technical skills
- Social media links

### Styling

Styles are integrated using TailwindCSS via CDN. To customize:

1. Edit `.leaf` files in `Resources/Views/`
2. Modify TailwindCSS classes
3. Add custom styles in the `<style>` section of the base template

## 🌐 API Endpoints

- `GET /` - Home page (auto-detects language)
- `GET /{lang}` - Localized home page (es/en)
- `GET /{lang}/experience` - Experience page
- `GET /{lang}/projects` - Projects page
- `GET /api/info` - Personal information in JSON
- `GET /api/translations/{lang}` - Translation strings

## 🌍 Internationalization

The website supports Spanish and English:

- **Automatic detection**: Based on browser's `Accept-Language` header
- **Manual selection**: Language toggle in navigation
- **Localized routes**: `/es/` for Spanish, `/en/` for English
- **Legacy redirects**: Old Spanish routes redirect to new structure

## 🎨 Theming

- **Light/Dark modes**: Toggle button in navigation
- **Persistent**: Theme preference saved in localStorage
- **Smooth transitions**: Elegant animations between themes
- **System preference**: Respects user's OS theme preference

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -f web.Dockerfile -t personal-website .

# Run container
docker run -p 8080:8080 personal-website
```

### Heroku

1. Install Heroku CLI
2. Create a new application:
   ```bash
   heroku create my-personal-website
   ```
3. Set buildpack:
   ```bash
   heroku buildpacks:set vapor/vapor
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

### Railway/Render

Both platforms support direct deployment from GitHub with Dockerfile.

## 📁 Project Structure

```
.
├── Package.swift                 # Dependencies configuration
├── Sources/
│   ├── App/
│   │   ├── Middleware/          # Localization middleware
│   │   ├── Models/              # Data models
│   │   ├── configure.swift      # App configuration
│   │   └── routes.swift         # Route definitions
│   └── Run/
│       └── main.swift           # Entry point
├── Resources/
│   ├── Views/                   # Leaf templates
│   └── Information/             # JSON data
├── Public/                      # Static files
├── Tests/                       # Unit tests
├── docker-compose.yml           # Docker Compose configuration
└── web.Dockerfile              # Production Dockerfile
```

## 🧪 Testing

```bash
swift test
```

The test suite includes:
- **Route testing**: All endpoints return correct responses
- **Localization testing**: Language detection and translations
- **API testing**: JSON endpoints return valid data
- **Redirect testing**: Legacy routes redirect properly
- **Theme testing**: Dark/light mode support
- **Responsive testing**: Mobile-friendly markup

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details.

## 👨‍💻 Author

**Alfredo E. Pérez Leal**
- GitHub: [@alph0x](https://github.com/alph0x)
- LinkedIn: [alfredo-perez-leal](https://linkedin.com/in/alfredo-perez-leal)
- Twitter: [@alph0x_dev](https://twitter.com/alph0x_dev)

---

*Built with ❤️ using Vapor Swift*
