const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

if (
  !process.env.DATABASE_URL ||
  !process.env.ADMIN_USERNAME ||
  !process.env.ADMIN_PASSWORD ||
  !process.env.JWT_SECRET
) {
  throw new Error("Missing required environment variables in .env");
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." }
});

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({ error: "Login required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// HEALTH CHECK
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      server: "Working",
      database: "Connected",
      time: result.rows[0].database_time
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      server: "Working",
      database: "Disconnected"
    });
  }
});

// ADMIN LOGIN
app.post("/api/admin/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    success: true,
    token,
    expiresIn: 7200
  });
});

// PUBLIC PROJECT LIST
app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY featured DESC, created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Projects error:", error.message);
    res.status(500).json({ error: "Could not load projects" });
  }
});

// CREATE PROJECT — ADMIN ONLY
app.post("/api/projects", requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description = "",
      category = "Data Analytics",
      technologies = [],
      image_url = "",
      github_url = "",
      demo_url = "",
      featured = false
    } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Project title is required" });
    }

    if (
      !Array.isArray(technologies) ||
      !technologies.every(item => typeof item === "string")
    ) {
      return res.status(400).json({
        error: "Technologies must be an array of strings"
      });
    }

    const result = await pool.query(
      `INSERT INTO projects
       (title, description, category, technologies,
        image_url, github_url, demo_url, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        title.trim(),
        description,
        category,
        technologies,
        image_url,
        github_url,
        demo_url,
        Boolean(featured)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create project error:", error.message);
    res.status(500).json({ error: "Could not create project" });
  }
});

// UPDATE PROJECT — ADMIN ONLY
app.patch("/api/projects/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    const allowed = [
      "title", "description", "category", "technologies",
      "image_url", "github_url", "demo_url", "featured"
    ];

    const fields = Object.keys(req.body);

    if (
      fields.length === 0 ||
      fields.some(field => !allowed.includes(field))
    ) {
      return res.status(400).json({ error: "Invalid project fields" });
    }

    const values = [];
    const assignments = [];

    for (const field of fields) {
      const value = req.body[field];

      if (field === "technologies" &&
          (!Array.isArray(value) ||
           !value.every(item => typeof item === "string"))) {
        return res.status(400).json({
          error: "Technologies must be an array of strings"
        });
      }

      if (field === "title" &&
          (typeof value !== "string" || !value.trim())) {
        return res.status(400).json({ error: "Invalid project title" });
      }

      values.push(field === "title" ? value.trim() : value);
      assignments.push(`${field} = $${values.length}`);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update project error:", error.message);
    res.status(500).json({ error: "Could not update project" });
  }
});

// DELETE PROJECT — ADMIN ONLY
app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING id",
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true, deletedId: result.rows[0].id });
  } catch (error) {
    console.error("Delete project error:", error.message);
    res.status(500).json({ error: "Could not delete project" });
  }
});

// PUBLIC SKILL LIST
app.get("/api/skills", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM skills ORDER BY category, name"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Skills error:", error.message);
    res.status(500).json({ error: "Could not load skills" });
  }
});

// ADD SKILL — ADMIN ONLY
app.post("/api/skills", requireAdmin, async (req, res) => {
  try {
    const { name, category = "Other" } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Skill name is required" });
    }

    const result = await pool.query(
      `INSERT INTO skills (name, category)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [name.trim(), category]
    );

    if (!result.rowCount) {
      return res.status(409).json({ error: "Skill already exists" });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Add skill error:", error.message);
    res.status(500).json({ error: "Could not add skill" });
  }
});

// DELETE SKILL — ADMIN ONLY
app.delete("/api/skills/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid skill ID" });
    }

    const result = await pool.query(
      "DELETE FROM skills WHERE id = $1 RETURNING id",
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.json({ success: true, deletedId: result.rows[0].id });
  } catch (error) {
    console.error("Delete skill error:", error.message);
    res.status(500).json({ error: "Could not delete skill" });
  }
});
// PUBLIC EXPERIENCE LIST
app.get("/api/experience", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM experience ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Experience fetch error:", error.message);
    res.status(500).json({ error: "Could not load experience data" });
  }
});

// ADD EXPERIENCE — ADMIN ONLY
app.post("/api/experience", requireAdmin, async (req, res) => {
  try {
    const { title, company, description, type = "PRACTICAL EXPERIENCE", technologies = [] } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "Title and company are required" });
    }

    const result = await pool.query(
      `INSERT INTO experience (title, company, description, type, technologies)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title.trim(), company.trim(), description, type, technologies]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Add experience error:", error.message);
    res.status(500).json({ error: "Could not add experience" });
  }
});

// DELETE EXPERIENCE — ADMIN ONLY
app.delete("/api/experience/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("DELETE FROM experience WHERE id = $1 RETURNING id", [id]);
    
    if (!result.rowCount) {
      return res.status(404).json({ error: "Experience not found" });
    }

    res.json({ success: true, deletedId: result.rows[0].id });
  } catch (error) {
    console.error("Delete experience error:", error.message);
    res.status(500).json({ error: "Could not delete experience" });
  }
});

app.listen(PORT, () => {
  console.log(`Portfolio API running on http://localhost:${PORT}`);
});

// PUBLIC EXPERIENCE LIST
app.get("/api/experience", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM experience ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Experience fetch error:", error.message);
    res.status(500).json({ error: "Could not load experience data" });
  }
});

// ADD EXPERIENCE — ADMIN ONLY
app.post("/api/experience", requireAdmin, async (req, res) => {
  try {
    const { title, company, description, type = "PRACTICAL EXPERIENCE", technologies = [] } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "Title and company are required" });
    }

    const result = await pool.query(
      `INSERT INTO experience (title, company, description, type, technologies)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title.trim(), company.trim(), description, type, technologies]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Add experience error:", error.message);
    res.status(500).json({ error: "Could not add experience" });
  }
});

// DELETE EXPERIENCE — ADMIN ONLY
app.delete("/api/experience/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("DELETE FROM experience WHERE id = $1 RETURNING id", [id]);
    
    if (!result.rowCount) {
      return res.status(404).json({ error: "Experience not found" });
    }

    res.json({ success: true, deletedId: result.rows[0].id });
  } catch (error) {
    console.error("Delete experience error:", error.message);
    res.status(500).json({ error: "Could not delete experience" });
  }
});

// SAVE CONTACT MESSAGE (PUBLIC)
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO messages (name, email, message) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), email.trim(), message.trim()]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Save message error:", error.message);
    res.status(500).json({ error: "Could not send message" });
  }
});

// GET ALL MESSAGES (ADMIN ONLY)
app.get("/api/messages", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch messages error:", error.message);
    res.status(500).json({ error: "Could not load messages" });
  }
});

// DELETE MESSAGE (ADMIN ONLY)
app.delete("/api/messages/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("DELETE FROM messages WHERE id = $1 RETURNING id", [id]);
    
    if (!result.rowCount) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({ success: true, deletedId: result.rows[0].id });
  } catch (error) {
    console.error("Delete message error:", error.message);
    res.status(500).json({ error: "Could not delete message" });
  }
});

// TRACK A VISIT (PUBLIC)
app.post("/api/track-visit", async (req, res) => {
  try {
    await pool.query("INSERT INTO site_visits DEFAULT VALUES");
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Track visit error:", error.message);
    res.status(500).json({ error: "Could not track visit" });
  }
});

// GET ANALYTICS / TOTAL VISITS (ADMIN ONLY)
app.get("/api/analytics", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) as total_visits FROM site_visits");
    res.json({ totalVisits: result.rows[0].total_visits });
  } catch (error) {
    console.error("Fetch analytics error:", error.message);
    res.status(500).json({ error: "Could not load analytics" });
  }
});

// GET ALL CASE STUDIES (PUBLIC)
app.get("/api/case-studies", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM case_studies ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch case studies" });
  }
});

// ADD CASE STUDY (ADMIN)
app.post("/api/case-studies", requireAdmin, async (req, res) => {
  const { title, category, summary, technologies, pdf_url } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO case_studies (title, category, summary, technologies, pdf_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, category, summary, technologies, pdf_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Could not add case study" });
  }
});

// DELETE CASE STUDY (ADMIN)
app.delete("/api/case-studies/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM case_studies WHERE id = $1", [req.params.id]);
    res.json({ message: "Case study deleted" });
  } catch (error) {
    res.status(500).json({ error: "Could not delete case study" });
  }
});

