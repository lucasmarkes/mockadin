# mockadin

A simple CLI tool to quickly create and serve mock APIs for development and testing. Supports static JSON responses and dynamic JavaScript handlers, with hot-reload for instant feedback.

---

## Index

1. [Features](#1-features)  
2. [Installation](#2-installation)  
3. [Project Initialization](#3-project-initialization)  
4. [Starting the Server](#4-starting-the-server)
5. [Generating Mocks Interactively](#5-generating-mocks-interactively)  
6. [Usage Examples](#6-usage-examples)  
7. [Route Mapping](#7-route-mapping)  
8. [Links](#8-links)  
9. [License](#9-license)  

---

## 1. Features

- **Zero-config mock API server**
- **Serve static JSON or dynamic JS handlers**
- **Supports GET, POST, PUT, DELETE**
- **Hot reload on file changes**
- **Easy CLI commands: `init` and `serve`**
- **Colorful logs for easy debugging**
- **RESTful route mapping (no HTTP verb in the URL)**

---

## 2. Installation

You can install and use `mockadin` in two ways:

### a) Using npm (recommended)

Install globally:

```sh
npm install -g mockadin
```

Or use with npx (no global install needed):

```sh
npx mockadin init
npx mockadin serve
```

### b) Cloning the repository

```sh
git clone https://github.com/lucasmarkes/mockadin.git
cd mockadin
npm install
```

---

## 3. Project Initialization

Initialize a mock project with example files:

```sh
mockadin init <project-folder-name>
```
or, if you omit the folder name, the CLI will prompt you for it:

```sh
mockadin init
```

You will see a welcome message and be asked to enter the project folder name.  
The project will always be created in a **new folder** with the name you provide (it will not overwrite your current directory).

This creates:

```
mocks/
  get/
    users.json
    products.json
  post/
    orders.js
server/
  index.mjs
```

---

## 4. Starting the Server

Start the mock API server:

```sh
mockadin serve
```

The server will run at [http://localhost:4000](http://localhost:4000) by default.  
You can change the port by setting the `PORT` environment variable:

```sh
PORT=5000 mockadin serve
```
---

## 5. Generating Mocks Interactively

You can generate mock endpoints for any resource using the interactive CLI:

```sh
mockadin generate [resource-name]
```

- If you omit the resource name, the CLI will prompt you for it.
- You will be asked which HTTP methods (GET, POST, PUT, DELETE) you want to generate for this resource.
- For GET, you can define the fields, types, and how many objects to generate (using fake data).
- For POST, PUT, and DELETE, handler files are generated that return example responses.
- All files are created in the appropriate `mocks/<method>/` folders.

**Example:**

```sh
mockadin generate books
```

This will guide you through creating mocks for the `books` resource, letting you choose which endpoints and fields to generate.

---

## 6. Usage Examples

### a) Static JSON Mock

Create a file `mocks/get/users.json`:

```json
[
  { "id": 1, "name": "Alice" },
  { "id": 2, "name": "Bob" }
]
```

Requesting `GET /users` will return this JSON.

---

### b) Dynamic JS Handler

Create a file `mocks/post/orders.js`:

```js
export default (req, res) => {
  const { product, quantity } = req.body;
  res.json({
    orderId: Math.floor(Math.random() * 10000),
    product,
    quantity,
    status: "created"
  });
};
```

Requesting `POST /orders` with a JSON body will return a dynamic response.

---

## 7. Route Mapping

Routes are mapped based on the folder structure:

- `mocks/get/users.json` → `GET /users`
- `mocks/post/orders.js` → `POST /orders`
- `mocks/get/products.json` → `GET /products`
- `mocks/put/users.js` → `PUT /users`
- `mocks/delete/users.js` → `DELETE /users`

### Nested Routes

You can nest folders for more complex routes:

- `mocks/get/admin/users.json` → `GET /admin/users`
- `mocks/post/orders/items.js` → `POST /orders/items`

### Supported HTTP Methods

- Place your mock files inside one of these folders:
  - `get/` → `GET`
  - `post/` → `POST`
  - `put/` → `PUT`
  - `delete/` → `DELETE`

The file name (without extension) and subfolders define the endpoint path.

---

## 8. Links

- [npm package](https://www.npmjs.com/package/mockadin)
- [GitHub repository](https://github.com/lucasmarkes/mockadin)

---

## 9. License

MIT © Lucas Marques