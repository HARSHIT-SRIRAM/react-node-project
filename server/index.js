const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "database.db");

let db = null;

const jwtSecret = "your_jwt_secret";

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(5000, () => {
      console.log("Server Running at http://localhost:5000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const authorizeAdmin = (req, res, next) => {
  const userId = req.user.userId;

  if (!userId) return res.sendStatus(403);

  db.get("SELECT role FROM Users WHERE id = ?", [userId], (err, row) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!row || row.role !== "admin") return res.sendStatus(403);

    next();
  });
};

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const existingUser = await db.get(
      "SELECT * FROM Users WHERE username = ?",
      [username]
    );

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run("INSERT INTO Users (username, password) VALUES (?, ?)", [
      username,
      hashedPassword,
    ]);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.get("SELECT * FROM Users WHERE username = ?", [
      username,
    ]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await db.all("SELECT * FROM Products");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

app.post("/carts/add", authenticateToken, async (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    return res
      .status(400)
      .json({ error: "Product ID and quantity are required" });
  }

  try {
    const userId = req.user.userId;

    const existingItem = await db.get(
      "SELECT * FROM Carts WHERE user_id = ? AND product_id = ?",
      [userId, product_id]
    );

    if (existingItem) {
      await db.run(
        "UPDATE Carts SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?",
        [quantity, userId, product_id]
      );
    } else {
      await db.run(
        "INSERT INTO Carts (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [userId, product_id, quantity]
      );
    }

    res.status(201).json({ message: "Item added to cart" });
  } catch (error) {
    res.status(500).json({ error: "Error adding item to cart" });
  }
});

app.get("/carts", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItems = await db.all(
      "SELECT * FROM Carts JOIN Products ON Carts.product_id = Products.id WHERE Carts.user_id = ?",
      [userId]
    );
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cart items" });
  }
});

app.post(
  "/carts/update",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { product_id, quantity } = req.body;

    if (!product_id || quantity === undefined) {
      return res
        .status(400)
        .json({ error: "Product ID and quantity are required" });
    }

    try {
      const userId = req.user.userId;

      await db.run(
        "UPDATE Carts SET quantity = ? WHERE user_id = ? AND product_id = ?",
        [quantity, userId, product_id]
      );

      res.status(200).json({ message: "Cart updated" });
    } catch (error) {
      res.status(500).json({ error: "Error updating cart" });
    }
  }
);

app.delete("/carts/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await db.run(
      "DELETE FROM Carts WHERE product_id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Item not found or unauthorized" });
    }

    res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: "Error removing item from cart" });
  }
});

app.post("/orders", authenticateToken, async (req, res) => {
  const { total, status } = req.body;
  const userId = req.user.userId;

  try {
    const result = await db.run(
      "INSERT INTO Orders (user_id, total, status) VALUES (?, ?, ?)",
      [userId, total, status]
    );
    res.status(201).json({ id: result.lastID, user_id: userId, total, status });
  } catch (error) {
    res.status(500).json({ error: "Error creating order" });
  }
});

app.get("/orders", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const orders = await db.all("SELECT * FROM Orders WHERE user_id = ?", [
      userId,
    ]);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Error fetching orders" });
  }
});

app.delete("/cartsclear", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    await db.run("DELETE FROM Carts WHERE user_id = ?", [userId]);
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ error: "Error clearing cart" });
  }
});

app.get("/orders/:id", authenticateToken, async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await db.get("SELECT * FROM Orders WHERE id = ?", [orderId]);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const products = await db.all(
      "SELECT * FROM OrderItems JOIN Products ON OrderItems.product_id = Products.id WHERE OrderItems.order_id = ?",
      [orderId]
    );

    res.json({ order, products });
  } catch (error) {
    res.status(500).json({ error: "Error fetching order details" });
  }
});
// Delete an order
app.delete("/orders/:id", authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.userId;

  try {
    // Delete associated order details
    await db.run(
      "DELETE FROM OrderDetails WHERE order_id = ? AND user_id = ?",
      [orderId, userId]
    );

    // Delete the order
    const deleteOrderResult = await db.run(
      "DELETE FROM Orders WHERE id = ? AND user_id = ?",
      [orderId, userId]
    );

    if (deleteOrderResult.changes === 0) {
      return res.status(404).json({ error: "Order not found or unauthorized" });
    }

    res
      .status(200)
      .json({ message: "Order and related items deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Error deleting order" });
  }
});

module.Exports = app;
