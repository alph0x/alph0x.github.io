import Foundation
import Vapor

struct PersonalInfo: Content {
    let pictureUrl: String
    let backgroundUrl: String?
    let userString: String
    let titleString: String
    let currentRoleString: String
    let trayectory: [Experience]
    let skills: [String]
    let skillsCategories: [SkillCategory]
    let projects: [Project]
    let resumeString: String
    let social: [SocialLink]
    
    private enum CodingKeys: String, CodingKey {
        case pictureUrl = "picture_url"
        case backgroundUrl = "background_url"
        case userString = "user_string"
        case titleString = "title_string"
        case currentRoleString = "current_role_string"
        case trayectory, skills, projects
        case skillsCategories = "skills_categories"
        case resumeString = "resume_string"
        case social
    }
}

struct Experience: Content {
    let logo: String
    let name: String
    let dates: DateRange
    let roles: [Role]
}

struct DateRange: Content {
    let start: String
    let end: String
}

struct Role: Content {
    let title: String
    let duties: [String]
}

struct Project: Content {
    let name: String?
    let description: String?
    let technologies: [String]?
    let url: String?
}

struct SkillCategory: Content {
    let category: String
    let items: [Skill]
}

struct Skill: Content {
    let name: String
    let level: Int
}

struct SocialLink: Content {
    let platform: String?
    let url: String?
    let username: String?
}
