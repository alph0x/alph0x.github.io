import Fluent
import Vapor
import Leaf

struct Index: Codable {
    var title: String
    var description: String
}

struct Page: Codable {
    var content: String
}

struct Item: Codable {
    var title: String
    var description: String
}

func routes(_ app: Application) throws {

    app.get { req -> EventLoopFuture<View> in
        struct Context: Codable {
            var items: [Item]
        }

        let context = Context(items: [
            .init(title: "#01", description: "Description #01"),
            .init(title: "#02", description: "Description #02"),
            .init(title: "#03", description: "Description #03"),
        ])
        return req.view.render("items", context)
    }
}
