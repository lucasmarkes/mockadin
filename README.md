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

You can install and use `mockadin` in two ways:

#### a) Using npm (recommended)

```sh
npm install -g mockadin
```

Or use with npx (no global install needed):

```sh
npx mockadin init
npx mockadin serve
```

#### b) Cloning the repository

```sh
git clone https://github.com/lucasmarkes/mockadin.git
cd mockadin
npm install
```

---

### 2. Initialize a Mock Project

Create a `mocks/` directory with example mocks:

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

### 3. Start the Mock API Server

```sh
mockadin serve
```

The server will run at [http://localhost:3000](http://localhost:3000) by default.

---