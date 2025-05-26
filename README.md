# mockadin

A simple CLI tool to quickly create and serve mock APIs for development and testing. Supports static JSON responses and dynamic JavaScript handlers, with hot-reload for instant feedback.

---

## Index

1. [Features](#1-features)  
2. [Installation](#2-installation)  
3. [Project Initialization](#3-project-initialization)  
4. [Starting the Server](#4-starting-the-server)  
5. [Usage Examples](#5-usage-examples)  
6. [Route Mapping](#6-route-mapping)  
7. [Links](#7-links)  
8. [License](#8-license)  

---

## 1. Features

- **Zero-config mock API server**  
- **Serve static JSON or dynamic JS handlers**  
- **Supports GET, POST, PUT, DELETE**  
- **Hot reload on file changes**  
- **Easy CLI commands: `init` and `serve`**  
- **Colorful logs for easy debugging**  

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
mockadin init
```

This creates:

```
mocks/
  users.get.json
  products.get.json
  orders.post.js
server/
  index.mjs
```

---

## 4. Starting the Server

Start the mock API server:

```sh
mockadin serve
```

The server will run at [http://localhost:3000](http://localhost:3000) by default.

---

## 5. Usage Examples

### a) Static JSON Mock

Create a file `mocks/users.get.json`:

```json
[
  { "id": 1, "name": "Alice" },
  { "id": 2, "name": "Bob" }
]
```

Requesting `GET /users.get` will return this JSON.

---

### b) Dynamic JS Handler

Create a file `mocks/orders.post.js`:

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

Requesting `POST /orders.post` with a JSON body will return a dynamic response.

---

## 6. Route Mapping

By default, the route for each mock is based on the file name:

- `mocks/users.get.json` → `GET /users.get`
- `mocks/products.get.json` → `GET /products.get`
- `mocks/orders.post.js` → `POST /orders.post`

> **Note:**  
> The route will match the file name (including the `.get`, `.post`, etc).  
> For example, `users.get.json` will be available at `/users.get`.

### Custom Methods and Nested Routes

You can nest folders for more complex routes:

- `mocks/admin/users.get.json` → `GET /admin/users.get`
- `mocks/products.delete.js` → `DELETE /products.delete`

### Supported HTTP Methods

- `.get.json` or `.get.js` → `GET`
- `.post.json` or `.post.js` → `POST`
- `.put.json` or `.put.js` → `PUT`
- `.delete.json` or `.delete.js` → `DELETE`

---

## 7. Links

- [npm package](https://www.npmjs.com/package/mockadin)
- [GitHub repository](https://github.com/lucasmarkes/mockadin)

---

## 8. License

MIT © Lucas Marques