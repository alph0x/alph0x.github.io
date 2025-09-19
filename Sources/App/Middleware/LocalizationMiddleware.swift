import Vapor

struct LocalizationMiddleware: Middleware {
    func respond(to request: Request, chainingTo next: Responder) -> EventLoopFuture<Response> {
        // Detectar idioma preferido del usuario
        let acceptLanguage = request.headers.first(name: .acceptLanguage) ?? ""
        let preferredLanguage = detectLanguage(from: acceptLanguage)
        
        // Almacenar en el request para uso posterior
        request.storage[LanguageKey.self] = preferredLanguage
        
        return next.respond(to: request)
    }
    
    private func detectLanguage(from acceptLanguage: String) -> String {
        let supportedLanguages = ["es", "en"]
        
        // Parsear Accept-Language header
        let languages = acceptLanguage
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .compactMap { lang -> (String, Double)? in
                let parts = lang.split(separator: ";")
                guard let langCode = parts.first else { return nil }
                
                let quality: Double
                if parts.count > 1,
                   let qPart = parts.first(where: { $0.contains("q=") }),
                   let qValue = Double(qPart.replacingOccurrences(of: "q=", with: "")) {
                    quality = qValue
                } else {
                    quality = 1.0
                }
                
                let normalizedLang = String(langCode.prefix(2)).lowercased()
                return (normalizedLang, quality)
            }
            .sorted { $0.1 > $1.1 } // Ordenar por calidad descendente
        
        // Encontrar el primer idioma soportado
        for (lang, _) in languages {
            if supportedLanguages.contains(lang) {
                return lang
            }
        }
        
        return "es" // Idioma por defecto
    }
}

struct LanguageKey: StorageKey {
    typealias Value = String
}

// Helper functions para usar en routes
func getLanguage(from request: Request) -> String {
    return request.storage[LanguageKey.self] ?? "es"
}

func getTranslations(for language: String) -> [String: String] {
    switch language {
    case "en":
        return englishTranslations
    case "es":
        return spanishTranslations
    default:
        return spanishTranslations
    }
}

private let spanishTranslations: [String: String] = [
    // Navigation
    "nav_home": "Inicio",
    "nav_experience": "Experiencia",
    "nav_projects": "Proyectos",
    "nav_toggle_theme": "Cambiar tema",
    "nav_toggle_language": "English",
    
    // Home page
    "home_title": "Desarrollador iOS",
    "home_subtitle": "Especializado en Swift y desarrollo móvil",
    "home_description": "Desarrollador iOS apasionado con más de 5 años de experiencia creando aplicaciones móviles innovadoras.",
    "home_view_experience": "Ver Experiencia",
    "home_view_projects": "Mis Proyectos",
    "home_skills_title": "Habilidades",
    "home_recent_experience": "Experiencia Reciente",
    "home_view_all_experience": "Ver Toda la Experiencia",
    "home_contact_title": "¿Interesado en trabajar juntos?",
    "home_contact_description": "Siempre estoy abierto a nuevas oportunidades y colaboraciones.",
    
    // Experience page
    "experience_title": "Experiencia Profesional",
    "experience_subtitle": "La trayectoria profesional de",
    "experience_empty_title": "Experiencia en construcción",
    "experience_empty_description": "Pronto agregaremos más detalles sobre la experiencia profesional.",
    "experience_interested_title": "¿Te interesa mi experiencia?",
    "experience_interested_description": "Contáctame para discutir oportunidades de colaboración.",
    "experience_back_home": "Volver al Inicio",
    "experience_view_projects": "Ver Proyectos",
    
    // Projects page
    "projects_title": "Mis Proyectos",
    "projects_subtitle": "Proyectos desarrollados por",
    "projects_technologies": "Tecnologías:",
    "projects_view_project": "Ver Proyecto",
    "projects_empty_title": "Proyectos en desarrollo",
    "projects_empty_description": "Estoy trabajando en varios proyectos emocionantes. ¡Vuelve pronto para ver las actualizaciones!",
    "projects_idea_title": "¿Tienes una idea de proyecto?",
    "projects_idea_description": "Me encanta trabajar en proyectos desafiantes e innovadores.",
    "projects_back_home": "Volver al Inicio",
    "projects_view_experience": "Ver Experiencia",
    
    // Footer
    "footer_text": "Hecho con Vapor Swift.",
    
    // Theme
    "theme_light": "Modo claro",
    "theme_dark": "Modo oscuro",
    
    // Common
    "back_to_top": "Volver arriba",
    "loading": "Cargando...",
    "error": "Error"
]

private let englishTranslations: [String: String] = [
    // Navigation
    "nav_home": "Home",
    "nav_experience": "Experience",
    "nav_projects": "Projects",
    "nav_toggle_theme": "Toggle theme",
    "nav_toggle_language": "Español",
    
    // Home page
    "home_title": "iOS Developer",
    "home_subtitle": "Specialized in Swift and mobile development",
    "home_description": "Passionate iOS developer with over 5 years of experience creating innovative mobile applications.",
    "home_view_experience": "View Experience",
    "home_view_projects": "My Projects",
    "home_skills_title": "Skills",
    "home_recent_experience": "Recent Experience",
    "home_view_all_experience": "View All Experience",
    "home_contact_title": "Interested in working together?",
    "home_contact_description": "I'm always open to new opportunities and collaborations.",
    
    // Experience page
    "experience_title": "Professional Experience",
    "experience_subtitle": "Professional journey of",
    "experience_empty_title": "Experience under construction",
    "experience_empty_description": "We'll soon add more details about professional experience.",
    "experience_interested_title": "Interested in my experience?",
    "experience_interested_description": "Contact me to discuss collaboration opportunities.",
    "experience_back_home": "Back to Home",
    "experience_view_projects": "View Projects",
    
    // Projects page
    "projects_title": "My Projects",
    "projects_subtitle": "Projects developed by",
    "projects_technologies": "Technologies:",
    "projects_view_project": "View Project",
    "projects_empty_title": "Projects in development",
    "projects_empty_description": "I'm working on several exciting projects. Come back soon to see updates!",
    "projects_idea_title": "Have a project idea?",
    "projects_idea_description": "I love working on challenging and innovative projects.",
    "projects_back_home": "Back to Home",
    "projects_view_experience": "View Experience",
    
    // Footer
    "footer_text": "Built with Vapor Swift.",
    
    // Theme
    "theme_light": "Light mode",
    "theme_dark": "Dark mode",
    
    // Common
    "back_to_top": "Back to top",
    "loading": "Loading...",
    "error": "Error"
]
