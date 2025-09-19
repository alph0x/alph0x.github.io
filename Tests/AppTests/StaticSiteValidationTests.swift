import XCTest
import Foundation

final class StaticSiteValidationTests: XCTestCase {
    
    let docsPath = "docs"
    
    // MARK: - File Existence Tests
    
    func testRequiredFilesExist() throws {
        let requiredFiles = [
            "index.html",
            "es/index.html", 
            "en/index.html",
            "CNAME",
            "robots.txt",
            "sitemap.xml",
            "404.html"
        ]
        
        for file in requiredFiles {
            let filePath = "\(docsPath)/\(file)"
            XCTAssertTrue(FileManager.default.fileExists(atPath: filePath), "Required file missing: \(file)")
            
            // Check file is not empty
            let fileURL = URL(fileURLWithPath: filePath)
            let data = try? Data(contentsOf: fileURL)
            XCTAssertNotNil(data, "File should contain data: \(file)")
            XCTAssertGreaterThan(data?.count ?? 0, 0, "File should not be empty: \(file)")
        }
    }
    
    func testHTMLFilesContainValidContent() throws {
        let htmlFiles = [
            "index.html",
            "es/index.html",
            "en/index.html"
        ]
        
        for file in htmlFiles {
            let filePath = "\(docsPath)/\(file)"
            let content = try String(contentsOfFile: filePath)
            
            // Basic HTML structure
            XCTAssertTrue(content.contains("<!DOCTYPE html>"), "File \(file) should contain DOCTYPE")
            XCTAssertTrue(content.contains("<html"), "File \(file) should contain html tag")
            XCTAssertTrue(content.contains("<head>"), "File \(file) should contain head tag")
            XCTAssertTrue(content.contains("</head>"), "File \(file) should contain closing head tag")
            XCTAssertTrue(content.contains("<body"), "File \(file) should contain body tag")
            XCTAssertTrue(content.contains("</body>"), "File \(file) should contain closing body tag")
            XCTAssertTrue(content.contains("</html>"), "File \(file) should contain closing html tag")
            
            // Essential meta tags
            XCTAssertTrue(content.contains("charset=\"utf-8\""), "File \(file) should have UTF-8 charset")
            XCTAssertTrue(content.contains("viewport"), "File \(file) should have viewport meta tag")
            XCTAssertTrue(content.contains("<title>"), "File \(file) should have title tag")
            
            // Personal information
            XCTAssertTrue(content.contains("Alfredo"), "File \(file) should contain personal name")
            XCTAssertTrue(content.contains("iOS"), "File \(file) should contain professional info")
        }
    }
    
    func testLanguageSpecificContent() throws {
        // Test Spanish content
        let spanishContent = try String(contentsOfFile: "\(docsPath)/es/index.html")
        XCTAssertTrue(spanishContent.contains("lang=\"es\""), "Spanish page should have Spanish lang attribute")
        XCTAssertTrue(spanishContent.contains("Habilidades"), "Spanish page should contain Spanish text")
        XCTAssertTrue(spanishContent.contains("English"), "Spanish page should have language toggle to English")
        
        // Test English content
        let englishContent = try String(contentsOfFile: "\(docsPath)/en/index.html")
        XCTAssertTrue(englishContent.contains("lang=\"en\""), "English page should have English lang attribute")
        XCTAssertTrue(englishContent.contains("Skills"), "English page should contain English text")
        XCTAssertTrue(englishContent.contains("Español"), "English page should have language toggle to Spanish")
    }
    
    func testResponsiveDesignElements() throws {
        let content = try String(contentsOfFile: "\(docsPath)/index.html")
        
        // Check for responsive classes
        XCTAssertTrue(content.contains("sm:"), "Should contain small screen classes")
        XCTAssertTrue(content.contains("md:"), "Should contain medium screen classes")
        XCTAssertTrue(content.contains("lg:"), "Should contain large screen classes")
        XCTAssertTrue(content.contains("xl:"), "Should contain extra large screen classes")
        
        // Check for mobile-specific elements
        XCTAssertTrue(content.contains("mobile-menu"), "Should contain mobile menu")
        XCTAssertTrue(content.contains("lg:hidden"), "Should have mobile-specific hidden elements")
        XCTAssertTrue(content.contains("hidden lg:flex"), "Should have desktop-specific visible elements")
    }
    
    func testDarkModeSupport() throws {
        let content = try String(contentsOfFile: "\(docsPath)/index.html")
        
        // Check for dark mode classes
        XCTAssertTrue(content.contains("dark:"), "Should contain dark mode classes")
        XCTAssertTrue(content.contains("theme-toggle"), "Should contain theme toggle functionality")
        XCTAssertTrue(content.contains("localStorage.getItem('theme')"), "Should persist theme preference")
        XCTAssertTrue(content.contains("darkMode: 'class'"), "Should configure Tailwind dark mode")
    }
    
    func testExternalResourcesAndSEO() throws {
        let content = try String(contentsOfFile: "\(docsPath)/index.html")
        
        // Check for external resources
        XCTAssertTrue(content.contains("tailwindcss.com"), "Should include TailwindCSS")
        XCTAssertTrue(content.contains("font-awesome"), "Should include Font Awesome")
        
        // Check for SEO elements
        XCTAssertTrue(content.contains("name=\"description\""), "Should have meta description")
        XCTAssertTrue(content.contains("scroll-smooth"), "Should have smooth scrolling")
        
        // Check sitemap exists and is valid
        let sitemapContent = try String(contentsOfFile: "\(docsPath)/sitemap.xml")
        XCTAssertTrue(sitemapContent.contains("<?xml"), "Sitemap should be valid XML")
        XCTAssertTrue(sitemapContent.contains("alph0x.com"), "Sitemap should contain domain")
        
        // Check robots.txt
        let robotsContent = try String(contentsOfFile: "\(docsPath)/robots.txt")
        XCTAssertTrue(robotsContent.contains("User-agent: *"), "Robots.txt should allow all bots")
        XCTAssertTrue(robotsContent.contains("Allow: /"), "Robots.txt should allow all paths")
    }
    
    func testSocialLinksAndNavigation() throws {
        let content = try String(contentsOfFile: "\(docsPath)/index.html")
        
        // Check for social media links
        XCTAssertTrue(content.contains("github.com/alph0x"), "Should contain GitHub link")
        XCTAssertTrue(content.contains("linkedin.com"), "Should contain LinkedIn link")
        XCTAssertTrue(content.contains("twitter.com"), "Should contain Twitter link")
        
        // Check for proper link attributes
        XCTAssertTrue(content.contains("target=\"_blank\""), "External links should open in new tab")
        XCTAssertTrue(content.contains("rel=\"noopener noreferrer\""), "External links should have security attributes")
    }
    
    func testAccessibilityFeatures() throws {
        let content = try String(contentsOfFile: "\(docsPath)/index.html")
        
        // Check for accessibility attributes
        XCTAssertTrue(content.contains("alt=\""), "Images should have alt attributes")
        XCTAssertTrue(content.contains("title=\""), "Interactive elements should have title attributes")
        
        // Check for semantic HTML
        XCTAssertTrue(content.contains("<nav"), "Should use semantic nav element")
        XCTAssertTrue(content.contains("<main"), "Should use semantic main element")
        XCTAssertTrue(content.contains("<footer"), "Should use semantic footer element")
        XCTAssertTrue(content.contains("<section"), "Should use semantic section elements")
    }
    
    func testPerformanceOptimizations() throws {
        let content = try String(contentsOfFile: "\(docsPath)/index.html")
        
        // Check for performance optimizations
        XCTAssertTrue(content.contains("transition"), "Should have smooth transitions")
        XCTAssertTrue(content.contains("backdrop-blur"), "Should use modern CSS effects")
        
        // File size check (shouldn't be too large)
        let fileURL = URL(fileURLWithPath: "\(docsPath)/index.html")
        let data = try Data(contentsOf: fileURL)
        XCTAssertLessThan(data.count, 100_000, "HTML file should be reasonably sized (< 100KB)")
    }
}

// MARK: - Test Helpers for Static Site

extension StaticSiteValidationTests {
    
    func validateHTMLStructure(_ content: String, file: String) {
        // Count opening and closing tags for balance
        let criticalTags = ["html", "head", "body", "title", "nav", "main", "footer"]
        
        for tag in criticalTags {
            let openingPattern = "<\(tag)\\b[^>]*>"
            let closingPattern = "</\(tag)>"
            
            let openingCount = content.matches(for: openingPattern).count
            let closingCount = content.matches(for: closingPattern).count
            
            XCTAssertEqual(openingCount, closingCount, 
                          "Tag '\(tag)' should be balanced in \(file). Opening: \(openingCount), Closing: \(closingCount)")
        }
    }
}

extension String {
    func matches(for regex: String) -> [String] {
        do {
            let regex = try NSRegularExpression(pattern: regex, options: [])
            let results = regex.matches(in: self, range: NSRange(self.startIndex..., in: self))
            return results.map {
                String(self[Range($0.range, in: self)!])
            }
        } catch {
            return []
        }
    }
}
