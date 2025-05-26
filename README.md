# Mock API with Hot Reload

## Table of Contents

- [Introduction](#introduction)  
- [Features](#features)  
- [Installation](#installation)  
- [Usage](#usage)  
  - [Serve command](#serve-command)  
  - [Init command](#init-command)  
- [Mocks Structure](#mocks-structure)  
- [How to Create Your Own Mocks](#how-to-create-your-own-mocks)  
- [File Naming Convention](#file-naming-convention)  
- [Hot Reload](#hot-reload)  
- [Example](#example)  
- [Contributing](#contributing)  
- [License](#license)  

---

## Introduction

This is a lightweight mock API server with hot reload capability, designed for quick development and testing of frontend apps or APIs without backend setup. It supports JSON files and dynamic JavaScript handlers, automatically updating endpoints on file changes.

---

## Features

- Serve mock APIs based on JSON files or JS handler modules  
- Supports HTTP methods: GET, POST, PUT, DELETE  
- Hot reload: automatically reloads mocks when files or folders are added, modified, or deleted  
- CLI commands for starting the server (`serve`) and initializing example mocks (`init`)  
- Easy directory-based route mapping  
- Colorful console logs for easy debugging  

---

## Installation

You can install the package via npm/yarn if published, or clone the repo and run it locally:

```bash
npm install
# or
yarn install
```
Usage
Run the mock API server with:

```bash
node your-script.js serve --port 3000 --from ./mocks
```
Or initialize example mocks structure:

```bash
node your-script.js init
```

## Serve command
Start the mock API server.

| Option       | Description          | Default   |
| ------------ | -------------------- | --------- |
| `-p, --port` | Server port          | 3000      |
| `-f, --from` | Mocks directory path | `./mocks` |

## Init command
Creates a basic example mocks structure in the ./mocks directory with sample GET and POST mocks.

## Mocks Structure
Mocks are organized in a directory, with files named according to route and HTTP method.

Examples:

```bash
mocks/
├── users.get.json
├── products.get.json
└── orders.post.js
```

## How to Create Your Own Mocks
- JSON files: respond with static JSON data
- JS files: export a default function (req, res) => {} to handle requests dynamically

## File Naming Convention
The file name defines the route and method.

Format:
```bash
<route>.<http-method>.<json|js>
```

- `<route>`: path for the endpoint, slashes replaced by folders
- `<http-method>`: get, post, put, delete
- Extension: .json for static responses, .js for dynamic handlers

Example:
`orders.post.js` handles POST requests to /orders.

## Hot Reload
The server watches the mocks directory and reloads mocks automatically on file or folder changes.

## Example
Example orders.post.js dynamic handler:

```javascript
export default (req, res) => {
  const { product, quantity } = req.body;
  res.json({
    message: `Order received: ${quantity}x ${product}`,
    timestamp: new Date().toISOString(),
  });
};
```

## Contributing
Feel free to open issues or pull requests to improve this project.

## License
MIT License