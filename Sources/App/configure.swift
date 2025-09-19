import Vapor
import Leaf

// Called before your application initializes.
public func configure(_ app: Application) throws {
    // Serves files from `Public/` directory
    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))
    
    // Configure Leaf
    app.views.use(.leaf)
    
    try routes(app)
}
