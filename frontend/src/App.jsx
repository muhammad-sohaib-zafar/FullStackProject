import { useEffect, useState } from "react";
import Admin from "./Admin";
import "./App.css";

const API_URL = "https://fullstackproject-production-520b87b9.up.railway.app/api";

// SVG ICONS
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.49 1.49 0 1 0 0 2.98 1.49 1.49 0 0 0 0-2.98Z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// Typing Effect Component
function TypingText({ textArray }) {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = textArray[textIndex];
    let typingSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentFullText.length) {
      typingSpeed = 2200;
    } else if (isDeleting && charIndex === 0) {
      typingSpeed = 400;
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % textArray.length);
      return;
    }

    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
      if (!isDeleting && charIndex === currentFullText.length) {
        setIsDeleting(true);
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex, textArray]);

  return (
    <span className="typing-container">
      {textArray[textIndex].substring(0, charIndex)}
      <span className="typing-cursor">|</span>
    </span>
  );
}

export default function App() {
  if (window.location.pathname === "/admin") {
    return <Admin />;
  }

  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/track-visit`, { method: "POST" }).catch((err) =>
      console.error("Analytics error:", err)
    );

    async function fetchData() {
      try {
        const [projRes, skillRes, expRes] = await Promise.all([
          fetch(`${API_URL}/projects`),
          fetch(`${API_URL}/skills`),
          fetch(`${API_URL}/experience`),
        ]);

        if (projRes.ok) setProjects(await projRes.json());
        if (skillRes.ok) setSkills(await skillRes.json());
        if (expRes.ok) setExperiences(await expRes.json());
      } catch (err) {
        console.error("Failed to load portfolio data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categories = ["All", ...new Set(projects.map((p) => p.category).filter(Boolean))];

  const filteredProjects = selectedCategory === "All"
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  return (
    <div className="portfolio">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">SZ<span>.</span></div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#experience">Experience</a>
          <a href="#contact" className="nav-contact">Let's Connect <span>↗</span></a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="section-container hero" id="home">
        <div className="hero-content">
          <div className="availability">
            <span className="availability-dot"></span>
            OPEN TO OPPORTUNITIES
          </div>
          <p className="eyebrow">HELLO, I'M</p>
          <h1>Muhammad Sohaib <span className="heading-accent">Zafar.</span></h1>
          
          {/* DYNAMIC TYPING HEADING */}
          <h2 style={{ minHeight: "40px" }}>
            <TypingText 
              textArray={[
                "Data Analyst",
                "AI & Machine Learning Enthusiast",
                "BS Economics & Data Science Student"
              ]} 
            />
          </h2>

          <p className="hero-description">
            I explore data, uncover meaningful insights and build intelligent solutions to solve real-world problems. Currently pursuing BS Economics & Data Science.
          </p>

          {/* ULTRA CLEAN TECH BADGES */}
          <div className="social-badge-group">
            <a 
              href="https://www.linkedin.com/in/sohaib-zafar-444822336/" 
              target="_blank" 
              rel="noreferrer"
              className="pro-social-badge"
            >
              <LinkedInIcon />
              <span>LinkedIn</span>
              <span className="arrow-icon">↗</span>
            </a>
            <a 
              href="https://github.com/muhammad-sohaib-zafar" 
              target="_blank" 
              rel="noreferrer"
              className="pro-social-badge"
            >
              <GitHubIcon />
              <span>GitHub</span>
              <span className="arrow-icon">↗</span>
            </a>
            <a 
              href="https://www.instagram.com/sohaib_2077/" 
              target="_blank" 
              rel="noreferrer"
              className="pro-social-badge"
            >
              <InstagramIcon />
              <span>Instagram</span>
              <span className="arrow-icon">↗</span>
            </a>
          </div>

          <div className="hero-buttons">
            <a href="#projects" className="btn-primary">Explore My Work <span>↗</span></a>
            <a href="/resume.pdf" download className="btn-secondary">Download Resume 📄</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="photo-frame">
            <img src="/profile.jpg" alt="Muhammad Sohaib Zafar" className="profile-photo" />
          </div>
          <div className="photo-glow"></div>
        </div>
      </section>

      {/* ABOUT & EDUCATION SECTION */}
      <section className="section-container section" id="about">
        <div className="section-label"><span>01 / ABOUT & EDUCATION</span></div>
        <div className="about-grid">
          <div className="about-text">
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Background & <span className="heading-accent">Vision</span></h2>
            <p>
              I am a dedicated Data Analyst currently pursuing my Bachelor of Science in Economics & Data Science at the University of Sahiwal. 
            </p>
            <p>
              My expertise centers around transforming complex datasets into actionable business intelligence, developing automated data pipelines, and implementing dynamic predictive models.
            </p>
          </div>
          <div className="education-card">
            <div className="education-icon">🎓</div>
            <div>
              <span className="card-kicker">BACHELOR OF SCIENCE</span>
              <h3>BS Economics & Data Science</h3>
              <p>University of Sahiwal</p>
            </div>
            <span className="education-status">In Progress 🟢</span>
          </div>
        </div>
      </section>

      {/* SKILLS SECTION */}
      <section className="skills-section section" id="skills">
        <div className="section-container">
          <div className="section-label"><span>02 / SKILLS & EXPERTISE</span></div>
          <div className="skills-heading-row">
            <h2 className="section-heading">Core <span className="heading-accent">Competencies</span></h2>
            <p className="section-description">Specialized technical proficiencies spanning data science, programming, and analytics pipelines.</p>
          </div>
          <div className="skills-grid">
            {skills.length === 0 ? (
              <p style={{ color: '#8998ad' }}>Loading skills from database...</p>
            ) : (
              skills.map((skill, index) => (
                <div className="skill-card" key={skill.id}>
                  <span className="skill-number">0{index + 1}</span>
                  <h3>{skill.name}</h3>
                  <div className="skill-tags">
                    <span>{skill.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* PROJECTS SECTION WITH CATEGORY FILTERS */}
      <section className="section" id="projects">
        <div className="section-container">
          <div className="section-label"><span>03 / FEATURED WORK</span></div>
          <h2 className="section-heading" style={{ marginBottom: '25px' }}>Featured <span className="heading-accent">Projects</span></h2>
          
          <div className="project-filter-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '35px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedCategory === cat ? '1px solid #5c9cff' : '1px solid #273750',
                  background: selectedCategory === cat ? '#347be9' : '#101a2a',
                  color: selectedCategory === cat ? '#ffffff' : '#8e9bb0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: '0.2s ease-in-out'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="projects-grid">
            {filteredProjects.length === 0 ? (
              <p style={{ color: '#8998ad' }}>No projects found in this category.</p>
            ) : (
              filteredProjects.map((proj, index) => (
                <div className="project-card" key={proj.id}>
                  <div className="project-top">
                    <span className="project-number">0{index + 1}</span>
                    <span className="project-symbol">↗</span>
                  </div>
                  <span className="project-type">{proj.category}</span>
                  <h3>{proj.title}</h3>
                  <p>{proj.description}</p>
                  <div className="project-tags">
                    {proj.technologies && proj.technologies.map((tech, i) => (
                      <span key={i}>{tech}</span>
                    ))}
                  </div>
                  <div className="project-footer">
                    <span>Source & Demo</span>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer">GitHub ↗</a>}
                      {proj.demo_url && <a href={proj.demo_url} target="_blank" rel="noreferrer">Demo ↗</a>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* EXPERIENCE SECTION */}
      <section className="experience-section section" id="experience">
        <div className="section-container">
          <div className="section-label"><span>04 / EXPERIENCE</span></div>
          <h2 className="section-heading">Work <span className="heading-accent">Experience</span></h2>
          <div className="experience-list">
            {experiences.length === 0 ? (
              <p style={{ color: '#8998ad', marginTop: '30px' }}>No experience records added yet.</p>
            ) : (
              experiences.map((exp) => (
                <div className="experience-card" key={exp.id}>
                  <div>
                    <span className="experience-date">{exp.type}</span>
                    <h3 style={{ marginTop: '10px' }}>{exp.title}</h3>
                    <p className="experience-company">{exp.company}</p>
                  </div>
                  <div>
                    <p className="experience-description">{exp.description}</p>
                    <div className="project-tags">
                      {exp.technologies && exp.technologies.map((t, i) => (
                        <span key={i}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="section contact-section" id="contact">
        <div className="section-container">
          <div className="contact-content">
            <p className="eyebrow">HAVE A PROJECT IN MIND?</p>
            <h2>Let's create <span>something meaningful.</span></h2>
            <p>Fill out the form below to send a direct message straight to my admin dashboard.</p>

            <form 
              className="admin-form-grid"
              style={{ textAlign: 'left', marginTop: '30px' }}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const formData = {
                  name: form.name.value,
                  email: form.email.value,
                  message: form.message.value
                };

                try {
                  const res = await fetch(`${API_URL}/contact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                  });

                  if (res.ok) {
                    alert("Message sent successfully! Check your admin dashboard.");
                    form.reset();
                  } else {
                    alert("Failed to send message. Please try again.");
                  }
                } catch (err) {
                  console.error(err);
                  alert("Network error. Is the backend running?");
                }
              }}
            >
              <label>
                Your Name *
                <input type="text" name="name" placeholder="Sohaib Zafar" required />
              </label>
              <label>
                Your Email *
                <input type="email" name="email" placeholder="sohaib@example.com" required />
              </label>
              <label className="admin-full-width">
                Your Message *
                <textarea name="message" rows="4" placeholder="Write your message here..." required></textarea>
              </label>
              <button type="submit" className="admin-primary-button admin-full-width" style={{ padding: '15px' }}>
                Send Message ↗
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="section-container footer-inner">
          <p>© 2026 Muhammad Sohaib Zafar. Built with React, Node.js & Supabase.</p>
          <div className="footer-links">
            <a href="https://www.linkedin.com/in/sohaib-zafar-444822336/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://github.com/muhammad-sohaib-zafar" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.instagram.com/sohaib_2077/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="/admin" className="admin-lock-link">Admin Dashboard 🔒</a>
          </div>
        </div>
      </footer>
    </div>
  );
}