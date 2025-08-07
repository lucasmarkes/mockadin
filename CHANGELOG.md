# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2024-08-07

### Added
- **CRUD Operations with Data Persistence**: New `crud` command to generate complete CRUD endpoints
- **In-memory data persistence**: Data persists during server session
- **Dynamic routes support**: Automatic creation of `/:id` routes for CRUD operations
- **Automatic ID generation**: Unique IDs for each record
- **Timestamps**: Automatic `createdAt` and `updatedAt` fields
- **Validation**: Returns 404 for non-existent records
- **Swagger documentation**: Interactive API documentation at `/docs`
- **Enhanced CLI**: New `crud` command with options for fields and initial count

### Features
- `GET /resource` - List all records
- `GET /resource/:id` - Get specific record
- `POST /resource` - Create new record
- `PUT /resource/:id` - Update record
- `DELETE /resource/:id` - Delete record

### Usage
```bash
# Create CRUD endpoints
mockadin crud products --fields "name,price,category" --count 3

# Interactive mode
mockadin crud users
```

### Breaking Changes
- None

### Dependencies
- Added `swagger-ui-express` and `swagger-jsdoc` for API documentation

## [1.0.12] - 2024-06-02

### Added
- Initial release
- Basic mock API server
- Static JSON and dynamic JS handlers
- Hot-reload support
- Interactive mock generation 