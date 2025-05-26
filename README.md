# mockadin

A simple CLI tool to quickly create and serve mock APIs for development and testing. Supports static JSON responses and dynamic JavaScript handlers, with hot-reload for instant feedback.

---

## Features

- **Zero-config mock API server**  
- **Serve static JSON or dynamic JS handlers**  
- **Supports GET, POST, PUT, DELETE**  
- **Hot reload on file changes**  
- **Easy CLI commands: `init` and `serve`**  
- **Colorful logs for easy debugging**  

---

## Getting Started

### 1. Installation

Clone this repository and install dependencies:

```sh
git clone git@github.com:lucasmarkes/mockadin.git
cd mockadin
npm install
```

### 2. Initialize a Mock Project

Create a `mocks/` directory with example mocks:

```sh
npx mockadin init
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

### 3. Start the Mock API Server

```sh
npx mockadin serve
```

The server will run at [http://localhost:3000](http://localhost:3000) by default.

---

## Usage

### CLI Commands

| Command         | Description                       |
|-----------------|-----------------------------------|
| `init`          | Initialize example mocks & server  |
| `serve`         | Start the mock API server         |

Example:

```sh
npx mockadin init
npx mockadin serve
```

---

## Mocks Structure

Mocks are placed in the `mocks/` directory.  
File naming convention: `<route>.<method>.<json|js>`

- **Static JSON:**  
  `users.get.json` → `GET /users`
- **Dynamic JS:**  
  `orders.post.js` → `POST /orders`

#### Example: Static JSON

```json
[
  { "id": 1, "name": "Alice" },
  { "id": 2, "name": "Bob" }
]
```

#### Example: Dynamic JS

```js
export default (req, res) => {
  const { product, quantity } = req.body;
  res.json({
    message: `Order received: ${quantity}x ${product}`,
    timestamp: new Date().toISOString(),
  });
};
```

---

## Hot Reload

Any changes in the `mocks/` directory are automatically detected and reloaded—no need to restart the server.

---

## Customization

- Add new endpoints by creating files in `mocks/` following the naming convention.
- Supports subfolders for nested routes.

---

## License

MIT License