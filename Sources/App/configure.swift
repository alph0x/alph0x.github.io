import Fluent
import FluentSQLiteDriver
import Vapor
import Leaf

// Called before your application initializes.
public func configure(_ app: Application) throws {
    // Serves files from `Public/` directory
     app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))
    
    // Configure Leaf
    app.views.use(.leaf)
    if !app.environment.isRelease {
        (app.leaf.cache as? DefaultLeafCache)?.isEnabled = false
    }
    
    // Configure SQLite database
    app.databases.use(.sqlite(.file("db.sqlite")), as: .sqlite)

    // Configure migrations
    app.migrations.add(CreateTodo())
    
    try routes(app)
}
