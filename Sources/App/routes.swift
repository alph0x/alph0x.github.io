import Vapor
import Leaf
import Foundation

func routes(_ app: Application) throws {
    
    // Middleware para detectar idioma preferido
    app.middleware.use(LocalizationMiddleware())
    
    // Ruta principal - Página personal
    app.get { req -> EventLoopFuture<View> in
        return loadPersonalInfo(req: req).flatMap { personalInfo in
            let lang = getLanguage(from: req)
            
            struct Context: Codable {
                let personalInfo: PersonalInfo
                let title: String
                let description: String
                let lang: String
                let translations: [String: String]
            }
            
            let context = Context(
                personalInfo: personalInfo,
                title: personalInfo.userString + " - " + personalInfo.currentRoleString,
                description: personalInfo.resumeString,
                lang: lang,
                translations: getTranslations(for: lang)
            )
            
            return req.view.render("home", context)
        }
    }
    
    // Rutas con localización
    app.group(":lang") { langGroup in
        // Ruta principal localizada
        langGroup.get { req -> EventLoopFuture<View> in
            return loadPersonalInfo(req: req).flatMap { personalInfo in
                let lang = req.parameters.get("lang") ?? "es"
                
                struct Context: Codable {
                    let personalInfo: PersonalInfo
                    let title: String
                    let description: String
                    let lang: String
                    let translations: [String: String]
                }
                
                let context = Context(
                    personalInfo: personalInfo,
                    title: personalInfo.userString + " - " + personalInfo.currentRoleString,
                    description: personalInfo.resumeString,
                    lang: lang,
                    translations: getTranslations(for: lang)
                )
                
                return req.view.render("home", context)
            }
        }
        
        // Experiencia localizada
        langGroup.get("experience") { req -> EventLoopFuture<View> in
            return loadPersonalInfo(req: req).flatMap { personalInfo in
                let lang = req.parameters.get("lang") ?? "es"
                
                struct Context: Codable {
                    let experiences: [Experience]
                    let title: String
                    let name: String
                    let lang: String
                    let translations: [String: String]
                }
                
                let context = Context(
                    experiences: personalInfo.trayectory,
                    title: getTranslations(for: lang)["experience_title"] ?? "Professional Experience",
                    name: personalInfo.userString,
                    lang: lang,
                    translations: getTranslations(for: lang)
                )
                
                return req.view.render("experience", context)
            }
        }
        
        // Proyectos localizados
        langGroup.get("projects") { req -> EventLoopFuture<View> in
            return loadPersonalInfo(req: req).flatMap { personalInfo in
                let lang = req.parameters.get("lang") ?? "es"
                
                struct Context: Codable {
                    let projects: [Project]
                    let title: String
                    let name: String
                    let lang: String
                    let translations: [String: String]
                }
                
                let context = Context(
                    projects: personalInfo.projects,
                    title: getTranslations(for: lang)["projects_title"] ?? "My Projects",
                    name: personalInfo.userString,
                    lang: lang,
                    translations: getTranslations(for: lang)
                )
                
                return req.view.render("projects", context)
            }
        }
    }
    
    // Rutas de compatibilidad (español por defecto)
    app.get("experiencia") { req -> EventLoopFuture<Response> in
        return req.eventLoop.makeSucceededFuture(req.redirect(to: "/es/experience"))
    }
    
    app.get("proyectos") { req -> EventLoopFuture<Response> in
        return req.eventLoop.makeSucceededFuture(req.redirect(to: "/es/projects"))
    }
    
    // API endpoints
    app.get("api", "info") { req -> EventLoopFuture<PersonalInfo> in
        return loadPersonalInfo(req: req)
    }
    
    app.get("api", "translations", ":lang") { req -> [String: String] in
        let lang = req.parameters.get("lang") ?? "es"
        return getTranslations(for: lang)
    }
}

// Función helper para cargar información personal
private func loadPersonalInfo(req: Request) -> EventLoopFuture<PersonalInfo> {
    let promise = req.eventLoop.makePromise(of: PersonalInfo.self)
    
    DispatchQueue.global().async {
        do {
            let resourcesPath = req.application.directory.resourcesDirectory
            let personalInfoPath = resourcesPath + "Information/personal.json"
            let data = try Data(contentsOf: URL(fileURLWithPath: personalInfoPath))
            let personalInfo = try JSONDecoder().decode(PersonalInfo.self, from: data)
            promise.succeed(personalInfo)
        } catch {
            promise.fail(error)
        }
    }
    
    return promise.futureResult
}
