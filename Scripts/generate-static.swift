#!/usr/bin/env swift

import Foundation

// Script to generate static HTML files from Vapor app for GitHub Pages
// This will create static versions of your dynamic pages

let baseURL = "http://localhost:8080"
let outputDir = "./docs"

// Pages to generate
let pages = [
    ("index.html", "/"),
    ("es/index.html", "/es"),
    ("en/index.html", "/en"),
    ("es/experience/index.html", "/es/experience"),
    ("en/experience/index.html", "/en/experience"),
    ("es/projects/index.html", "/es/projects"),
    ("en/projects/index.html", "/en/projects")
]

func createDirectory(at path: String) {
    let url = URL(fileURLWithPath: path)
    try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
}

func generateStaticSite() {
    print("🚀 Generating static site...")
    
    // Create output directory
    createDirectory(at: outputDir)
    
    // Create language directories
    createDirectory(at: "\(outputDir)/es")
    createDirectory(at: "\(outputDir)/en")
    createDirectory(at: "\(outputDir)/es/experience")
    createDirectory(at: "\(outputDir)/en/experience")
    createDirectory(at: "\(outputDir)/es/projects")
    createDirectory(at: "\(outputDir)/en/projects")
    
    print("📁 Created directory structure")
    
    for (filename, path) in pages {
        let url = URL(string: "\(baseURL)\(path)")!
        
        do {
            let html = try String(contentsOf: url)
            let outputPath = "\(outputDir)/\(filename)"
            try html.write(toFile: outputPath, atomically: true, encoding: .utf8)
            print("✅ Generated: \(filename)")
        } catch {
            print("❌ Failed to generate \(filename): \(error)")
        }
    }
    
    // Copy CNAME file
    try? FileManager.default.copyItem(atPath: "CNAME", toPath: "\(outputDir)/CNAME")
    
    print("🎉 Static site generation complete!")
    print("📂 Files generated in: \(outputDir)")
}

generateStaticSite()
