const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const crypto = require("crypto");

// Define the path to your database file
const dbPath = path.resolve(__dirname, "database.db");

// Initialize the SQLite database connection
let db = null;

const initializeDB = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
};

// Middleware to handle session creation and management
const sessionMiddleware = async (req, res, next) => {
  if (!db) {
    await initializeDB();
  }

  // Session ID from the request (e.g., from a cookie or header)
  const sessionId = req.headers["x-session-id"] || req.cookies.session_id;

  if (sessionId) {
    // Retrieve session from database
    const session = await db.get("SELECT * FROM Sessions WHERE id = ?", [
      sessionId,
    ]);

    if (session) {
      req.session = session;
      req.session.ip_address = req.ip;
      return next();
    }
  }

  // Create a new session if not found
  const newSessionId = crypto.randomBytes(16).toString("hex");
  const now = new Date();

  await db.run(
    "INSERT INTO Sessions (id, user_id, session_start, session_end, ip_address) VALUES (?, ?, ?, ?, ?)",
    [newSessionId, null, now.toISOString(), null, req.ip]
  );

  req.session = {
    id: newSessionId,
    session_start: now.toISOString(),
    ip_address: req.ip,
  };

  // Set the session ID in the response (e.g., as a cookie or header)
  res.cookie("session_id", newSessionId);
  next();
};

// Middleware to end the session
const endSession = async (req, res, next) => {
  if (req.session) {
    const now = new Date();
    await db.run("UPDATE Sessions SET session_end = ? WHERE id = ?", [
      now.toISOString(),
      req.session.id,
    ]);
  }
  next();
};

module.exports = {
  sessionMiddleware,
  endSession,
};
