@testable import App
import XCTVapor

final class AppTests: XCTestCase {
    var app: Application!
    
    override func setUpWithError() throws {
        app = Application(.testing)
        try configure(app)
    }
    
    override func tearDownWithError() throws {
        app.shutdown()
    }
    
    // MARK: - Home Page Tests
    
    func testHomePage() throws {
        try app.test(.GET, "/") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertContains(res.body.string, "Alfredo E. Pérez Leal")
            XCTAssertContains(res.body.string, "iOS Software Engineer")
        }
    }
    
    func testHomePageSpanish() throws {
        try app.test(.GET, "/es") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertContains(res.body.string, "Alfredo E. Pérez Leal")
            XCTAssertContains(res.body.string, "lang=\"es\"")
        }
    }
    
    func testHomePageEnglish() throws {
        try app.test(.GET, "/en") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertContains(res.body.string, "Alfredo E. Pérez Leal")
            XCTAssertContains(res.body.string, "lang=\"en\"")
        }
    }
    
    // MARK: - Experience Page Tests
    
    func testExperiencePage() throws {
        try app.test(.GET, "/es/experience") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertContains(res.body.string, "Experiencia Profesional")
        }
    }
    
    func testExperiencePageEnglish() throws {
        try app.test(.GET, "/en/experience") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertContains(res.body.string, "Professional Experience")
        }
    }
    
    // MARK: - Projects Page Tests
    
    func testProjectsPage() throws {
        try app.test(.GET, "/es/projects") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertContains(res.body.string, "Mis Proyectos")
        }
    }
    
    func testProjectsPageEnglish() throws {
        try app.test(.GET, "/en/projects") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertContains(res.body.string, "My Projects")
        }
    }
    
    // MARK: - API Tests
    
    func testPersonalInfoAPI() throws {
        try app.test(.GET, "/api/info") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertEqual(res.headers.contentType, .json)
            
            let personalInfo = try res.content.decode(PersonalInfo.self)
            XCTAssertEqual(personalInfo.userString, "Alfredo E. Pérez Leal")
            XCTAssertEqual(personalInfo.currentRoleString, "iOS Software Engineer")
            XCTAssertFalse(personalInfo.skills.isEmpty)
            XCTAssertFalse(personalInfo.trayectory.isEmpty)
        }
    }
    
    func testTranslationsAPISpanish() throws {
        try app.test(.GET, "/api/translations/es") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertEqual(res.headers.contentType, .json)
            
            let translations = try res.content.decode([String: String].self)
            XCTAssertEqual(translations["nav_home"], "Inicio")
            XCTAssertEqual(translations["nav_experience"], "Experiencia")
            XCTAssertEqual(translations["nav_projects"], "Proyectos")
        }
    }
    
    func testTranslationsAPIEnglish() throws {
        try app.test(.GET, "/api/translations/en") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertEqual(res.headers.contentType, .json)
            
            let translations = try res.content.decode([String: String].self)
            XCTAssertEqual(translations["nav_home"], "Home")
            XCTAssertEqual(translations["nav_experience"], "Experience")
            XCTAssertEqual(translations["nav_projects"], "Projects")
        }
    }
    
    // MARK: - Redirect Tests
    
    func testLegacyExperienceRedirect() throws {
        try app.test(.GET, "/experiencia") { res in
            XCTAssertEqual(res.status, .seeOther)
            XCTAssertEqual(res.headers.first(name: .location), "/es/experience")
        }
    }
    
    func testLegacyProjectsRedirect() throws {
        try app.test(.GET, "/proyectos") { res in
            XCTAssertEqual(res.status, .seeOther)
            XCTAssertEqual(res.headers.first(name: .location), "/es/projects")
        }
    }
    
    // MARK: - Localization Tests
    
    func testLanguageDetection() throws {
        try app.test(.GET, "/", headers: ["Accept-Language": "en-US,en;q=0.9"]) { res in
            XCTAssertEqual(res.status, .ok)
            // Should contain English translations
            XCTAssertContains(res.body.string, "nav_toggle_language")
        }
    }
    
    func testLanguageDetectionSpanish() throws {
        try app.test(.GET, "/", headers: ["Accept-Language": "es-ES,es;q=0.9"]) { res in
            XCTAssertEqual(res.status, .ok)
            // Should contain Spanish translations
            XCTAssertContains(res.body.string, "nav_toggle_language")
        }
    }
    
    // MARK: - Theme and Responsive Tests
    
    func testResponsiveDesign() throws {
        try app.test(.GET, "/") { res in
            XCTAssertEqual(res.status, .ok)
            // Check for responsive classes
            XCTAssertContains(res.body.string, "sm:")
            XCTAssertContains(res.body.string, "md:")
            XCTAssertContains(res.body.string, "lg:")
            XCTAssertContains(res.body.string, "xl:")
        }
    }
    
    func testDarkModeSupport() throws {
        try app.test(.GET, "/") { res in
            XCTAssertEqual(res.status, .ok)
            // Check for dark mode classes
            XCTAssertContains(res.body.string, "dark:")
            XCTAssertContains(res.body.string, "theme-toggle")
        }
    }
    
    // MARK: - Error Handling Tests
    
    func testInvalidLanguageCode() throws {
        try app.test(.GET, "/invalid-lang") { res in
            XCTAssertEqual(res.status, .notFound)
        }
    }
    
    func testInvalidAPIEndpoint() throws {
        try app.test(.GET, "/api/invalid") { res in
            XCTAssertEqual(res.status, .notFound)
        }
    }
}

// MARK: - Test Helpers

extension XCTHTTPResponse {
    var string: String {
        return body.string
    }
}
