import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function Admin() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("adminToken") || ""
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [messages, setMessages] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    category: "Data Analytics",
    technologies: "",
    github_url: "",
    demo_url: "",
    featured: false,
  });

  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "Data Analytics",
  });

  const [expForm, setExpForm] = useState({
    title: "",
    company: "",
    description: "",
    type: "PRACTICAL EXPERIENCE",
    technologies: "",
  });

  async function loadData() {
    try {
      const [projectRes, skillRes, expRes, msgRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/skills`),
        fetch(`${API_URL}/experience`),
        fetch(`${API_URL}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!projectRes.ok || !skillRes.ok || !expRes.ok || !msgRes.ok) {
        throw new Error("Could not load data.");
      }

      setProjects(await projectRes.json());
      setSkills(await skillRes.json());
      setExperiences(await expRes.json());
      setMessages(await msgRes.json());

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setTotalVisits(analyticsData.totalVisits);
      }
    } catch (err) {
      setError(err.message || "Backend connection failed.");
    }
  }

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (!data.token) {
        throw new Error("No token received from server.");
      }

      sessionStorage.setItem("adminToken", data.token);
      setToken(data.token);
      setPassword("");
    } catch (err) {
      setError(err.message || "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("adminToken");
    setToken("");
    setProjects([]);
    setSkills([]);
    setExperiences([]);
    setMessages([]);
    setTotalVisits(0);
    setError("");
  }

  async function adminRequest(path, method, body) {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  async function addProject(event) {
    event.preventDefault();
    setError("");
    try {
      await adminRequest("/projects", "POST", {
        ...projectForm,
        technologies: projectForm.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      setProjectForm({
        title: "",
        description: "",
        category: "Data Analytics",
        technologies: "",
        github_url: "",
        demo_url: "",
        featured: false,
      });

      await loadData();
    } catch (err) {
      setError(err.message || "Could not add project.");
    }
  }

  async function deleteProject(id) {
    if (!window.confirm("Delete this project?")) return;
    setError("");
    try {
      await adminRequest(`/projects/${id}`, "DELETE");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete project.");
    }
  }

  async function addSkill(event) {
    event.preventDefault();
    setError("");
    try {
      await adminRequest("/skills", "POST", skillForm);
      setSkillForm({ name: "", category: "Data Analytics" });
      await loadData();
    } catch (err) {
      setError(err.message || "Could not add skill.");
    }
  }

  async function deleteSkill(id) {
    setError("");
    try {
      await adminRequest(`/skills/${id}`, "DELETE");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete skill.");
    }
  }

  async function addExperience(event) {
    event.preventDefault();
    setError("");
    try {
      await adminRequest("/experience", "POST", {
        ...expForm,
        technologies: expForm.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setExpForm({
        title: "",
        company: "",
        description: "",
        type: "PRACTICAL EXPERIENCE",
        technologies: "",
      });
      await loadData();
    } catch (err) {
      setError(err.message || "Could not add experience.");
    }
  }

  async function deleteExperience(id) {
    if (!window.confirm("Delete this experience?")) return;
    setError("");
    try {
      await adminRequest(`/experience/${id}`, "DELETE");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete experience.");
    }
  }

  async function deleteMessage(id) {
    if (!window.confirm("Delete this message?")) return;
    setError("");
    try {
      await adminRequest(`/messages/${id}`, "DELETE");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete message.");
    }
  }

  if (!token) {
    return (
      <main className="admin-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <p className="admin-eyebrow">PRIVATE AREA</p>
          <h1>Admin Login</h1>
          <p className="admin-subtitle">Sign in to manage your portfolio.</p>

          {error && <div className="admin-error">{error}</div>}

          <label htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="admin-primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <a className="admin-back-link" href="/">
            ← Back to Portfolio
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-dashboard">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">PORTFOLIO CONTROL CENTER</p>
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">Manage your projects, skills, experience & messages.</p>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            Log Out
          </button>
        </header>

        {error && <div className="admin-error">{error}</div>}

        {/* TRAFFIC ANALYTICS OVERVIEW CARD */}
        <section className="admin-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="admin-eyebrow">TRAFFIC OVERVIEW</p>
            <h2 style={{ margin: 0, fontSize: "20px", borderBottom: "none", paddingBottom: 0 }}>Total Portfolio Views</h2>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#5c9cff" }}>
            {totalVisits}
          </div>
        </section>

        {/* INCOMING MESSAGES PANEL */}
        <section className="admin-panel">
          <h2>Incoming Messages ({messages.length})</h2>
          {messages.length === 0 ? (
            <p className="admin-empty">No messages received yet.</p>
          ) : (
            <div className="admin-list">
              {messages.map((msg) => (
                <article className="admin-list-item" key={msg.id}>
                  <div>
                    <h3>{msg.name} ({msg.email})</h3>
                    <p style={{ marginTop: "4px", color: "#cbd5e1" }}>{msg.message}</p>
                    <small style={{ color: "#64748b" }}>
                      {new Date(msg.created_at).toLocaleString()}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => deleteMessage(msg.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* PROJECT FORM */}
        <section className="admin-panel">
          <h2>Add a Project</h2>
          <form className="admin-form-grid" onSubmit={addProject}>
            <label>
              Project title *
              <input
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                required
              />
            </label>

            <label>
              Category
              <select
                value={projectForm.category}
                onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
              >
                <option>Data Analytics</option>
                <option>Machine Learning</option>
                <option>Web Development</option>
                <option>Other</option>
              </select>
            </label>

            <label className="admin-full-width">
              Description *
              <textarea
                rows="3"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                required
              />
            </label>

            <label className="admin-full-width">
              Technologies (comma-separated)
              <input
                placeholder="Python, SQL, Power BI"
                value={projectForm.technologies}
                onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
              />
            </label>

            <label>
              GitHub URL
              <input
                type="url"
                value={projectForm.github_url}
                onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
              />
            </label>

            <label>
              Live demo URL
              <input
                type="url"
                value={projectForm.demo_url}
                onChange={(e) => setProjectForm({ ...projectForm, demo_url: e.target.value })}
              />
            </label>

            <label className="admin-checkbox admin-full-width">
              <input
                type="checkbox"
                checked={projectForm.featured}
                onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })}
              />
              Feature this project
            </label>

            <button className="admin-primary-button admin-full-width">Save Project</button>
          </form>
        </section>

        <section className="admin-panel">
          <h2>Projects ({projects.length})</h2>
          {projects.length === 0 ? (
            <p className="admin-empty">No projects added yet.</p>
          ) : (
            <div className="admin-list">
              {projects.map((project) => (
                <article className="admin-list-item" key={project.id}>
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.category}</p>
                  </div>
                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => deleteProject(project.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* SKILL FORM */}
        <section className="admin-panel">
          <h2>Add a Skill</h2>
          <form className="admin-skill-form" onSubmit={addSkill}>
            <label>
              Skill name *
              <input
                value={skillForm.name}
                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                required
              />
            </label>

            <label>
              Category
              <select
                value={skillForm.category}
                onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
              >
                <option>Data Analytics</option>
                <option>Programming</option>
                <option>Machine Learning</option>
                <option>Tools</option>
                <option>Other</option>
              </select>
            </label>

            <button className="admin-primary-button">Save Skill</button>
          </form>
        </section>

        <section className="admin-panel">
          <h2>Skills ({skills.length})</h2>
          {skills.length === 0 ? (
            <p className="admin-empty">No skills added yet.</p>
          ) : (
            <div className="admin-skill-list">
              {skills.map((skill) => (
                <div className="admin-skill-item" key={skill.id}>
                  <span>
                    {skill.name} <small>({skill.category})</small>
                  </span>
                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => deleteSkill(skill.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EXPERIENCE FORM */}
        <section className="admin-panel">
          <h2>Add Experience</h2>
          <form className="admin-form-grid" onSubmit={addExperience}>
            <label>
              Job Title *
              <input
                placeholder="E-Commerce Operations Specialist"
                value={expForm.title}
                onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                required
              />
            </label>

            <label>
              Company / Organization *
              <input
                placeholder="Independent / Marketplace Operations"
                value={expForm.company}
                onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                required
              />
            </label>

            <label className="admin-full-width">
              Description *
              <textarea
                rows="3"
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                required
              />
            </label>

            <label>
              Type / Duration
              <input
                placeholder="PRACTICAL EXPERIENCE"
                value={expForm.type}
                onChange={(e) => setExpForm({ ...expForm, type: e.target.value })}
              />
            </label>

            <label>
              Technologies (comma-separated)
              <input
                placeholder="eBay, Poshmark, Etsy"
                value={expForm.technologies}
                onChange={(e) => setExpForm({ ...expForm, technologies: e.target.value })}
              />
            </label>

            <button className="admin-primary-button admin-full-width">Save Experience</button>
          </form>
        </section>

        <section className="admin-panel">
          <h2>Experience Records ({experiences.length})</h2>
          {experiences.length === 0 ? (
            <p className="admin-empty">No experience records added yet.</p>
          ) : (
            <div className="admin-list">
              {experiences.map((exp) => (
                <article className="admin-list-item" key={exp.id}>
                  <div>
                    <h3>{exp.title} - {exp.company}</h3>
                    <p>{exp.type}</p>
                  </div>
                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => deleteExperience(exp.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}