import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReveal } from "../../hooks/useReveal";

/**
 * Public landing page at "/".
 *
 * Design thesis: this product's entire job is turning time into a visible,
 * trustworthy record. So the hero doesn't describe that with a headline and
 * a stock photo — it SHOWS it: a live, ticking task timer, running from the
 * moment the page loads, exactly like the one an employee would use. That
 * timer is the signature element; everything else stays quiet around it.
 */
export default function Home() {
  const { user, loading } = useAuth();

  function dashboardPath() {
    if (!user) return "/login";
    return user.role === "admin" || user.role === "manager"
      ? "/admin"
      : "/dashboard";
  }

  return (
    <div className="home-page">
      <BackgroundGrid />

      <Header isAuthed={!loading && !!user} dashboardPath={dashboardPath()} />
      <Hero isAuthed={!loading && !!user} dashboardPath={dashboardPath()} />
      <StatStrip />
      <Features />
      <RoleMatrix />
      <ClosingCTA
        isAuthed={!loading && !!user}
        dashboardPath={dashboardPath()}
      />
      <Footer />

      <PageStyles />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Ambient background — a faint instrument-panel grid, fixed behind all   */
/* content. Quiet, not decorative noise: it reinforces the "precision      */
/* instrument" read without competing with the hero.                      */
/* ---------------------------------------------------------------------- */
function BackgroundGrid() {
  return (
    <div aria-hidden="true" className="bg-grid">
      <div className="bg-grid__glow" />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Header                                                                  */
/* ---------------------------------------------------------------------- */
function Header({ isAuthed, dashboardPath }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand">
          {/* <span className="brand__mark" aria-hidden="true" /> */}
          <span className="brand__name" className="flex"> <img className="w-26" src="https://primsyindia.com/wp-content/uploads/2025/02/Primsy-Logo-White.svg" alt="" /> &nbsp;<span className="text-xl">ERP</span></span>
        </Link>

        <nav className="site-header__nav">
          {isAuthed ? (
            <Link to={dashboardPath} className="btn btn--primary">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="link-muted">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------- */
/* Hero — the live timer is the signature visual                          */
/* ---------------------------------------------------------------------- */
function Hero({ isAuthed, dashboardPath }) {
  return (
    <section className="hero">
      <div className="hero__copy">
        <p className="eyebrow">
          <span className="eyebrow__dot" />
          Built for service teams
        </p>
        <h1 className="hero__title">
          Every hour your
          <br />
          team works,
          <br />
          <span className="hero__title-accent">accounted for.</span>
        </h1>
        <p className="hero__subtitle">
          Assign the work. Start the clock. See exactly where every hour went —
          across design, development, motion, and marketing — without a single
          spreadsheet.
        </p>
        <div className="hero__actions">
          {isAuthed ? (
            <Link to={dashboardPath} className="btn btn--primary btn--lg">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn--primary btn--lg">
                Get started — it&rsquo;s free
              </Link>
              <Link to="/login" className="btn btn--ghost btn--lg">
                Log in
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="hero__visual">
        <LiveTimerCard />
      </div>
    </section>
  );
}

/**
 * The signature element: a genuinely ticking stopwatch, counting up from
 * the moment the component mounts, with tabular-numeral digits that don't
 * jitter the layout as they change. Labeled like a real task so it reads
 * as "this is the product," not an abstract loading animation.
 */
function LiveTimerCard() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return (
    <div className="timer-card">
      <div className="timer-card__head">
        <span className="timer-card__status">
          <span className="pulse-dot" />
          Running
        </span>
        <span className="timer-card__dept">Design</span>
      </div>

      <p className="timer-card__task">Homepage redesign — client review</p>

      <div className="timer-card__clock" role="timer" aria-live="off">
        <span>{h}</span>
        <span className="timer-card__colon">:</span>
        <span>{m}</span>
        <span className="timer-card__colon">:</span>
        <span>{s}</span>
      </div>

      <div className="timer-card__foot">
        <span>Started today, 9:41 AM</span>
        <span className="timer-card__shift">Auto-stops at 7:00 PM</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Stat strip                                                             */
/* ---------------------------------------------------------------------- */
function StatStrip() {
  const [ref, visible] = useReveal();
  const stats = [
    { value: "4", label: "Departments tracked by default" },
    { value: "1", label: "Way to finish a task — no pausing, no guesswork" },
    { value: "7 PM", label: "Shift-end cutoff, enforced automatically" },
  ];

  return (
    <section
      ref={ref}
      className={`stat-strip reveal ${visible ? "reveal--in" : ""}`}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="stat-strip__item"
          style={{ transitionDelay: `${i * 90}ms` }}
        >
          <p className="stat-strip__value">{stat.value}</p>
          <p className="stat-strip__label">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* Features                                                               */
/* ---------------------------------------------------------------------- */
function Features() {
  const items = [
    {
      tag: "Assign",
      title: "Hand off work in seconds",
      description:
        "Admins and managers create a task, pick a department, and assign it to anyone on the team — no matter which department they sit in.",
    },
    {
      tag: "Track",
      title: "One clock, one truth",
      description:
        "Employees start a timer when they begin, and mark the task complete when it\u2019s done. No pause button to forget, no idle time to question.",
    },
    {
      tag: "Review",
      title: "Every hour, traceable",
      description:
        "Admins open any individual and see their full task history — start time, end time, and total hours, task by task.",
    },
  ];

  return (
    <section className="features">
      <div className="section-head">
        <p className="eyebrow eyebrow--dark">
          <span className="eyebrow__dot" />
          How it works
        </p>
        <h2 className="section-title">Three steps. No spreadsheet.</h2>
      </div>

      <div className="features__grid">
        {items.map((item, i) => (
          <FeatureCard key={item.tag} {...item} index={i} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ tag, title, description, index }) {
  const [ref, visible] = useReveal(0.3);
  return (
    <div
      ref={ref}
      className={`feature-card reveal ${visible ? "reveal--in" : ""}`}
      style={{ transitionDelay: `${index * 110}ms` }}
    >
      <span className="feature-card__tag">{tag}</span>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__desc">{description}</p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Role matrix — real content (your actual permission model), styled as   */
/* a readout rather than a generic pricing-table layout.                  */
/* ---------------------------------------------------------------------- */
function RoleMatrix() {
  const [ref, visible] = useReveal(0.15);

  const roles = [
    {
      name: "Admin",
      summary: "Full control of the system",
      points: [
        "Creates and deletes departments",
        "Assigns departments to anyone",
        "Assigns tasks to anyone",
        "Deactivates accounts",
        "Views every user\u2019s full task and time history",
      ],
    },
    {
      name: "Manager",
      summary: "Runs the day-to-day",
      points: [
        "Views every employee and manager",
        "Creates departments (can\u2019t delete them)",
        "Assigns tasks to anyone, any department",
        "Reviews team-wide hours and output",
      ],
    },
    {
      name: "Employee",
      summary: "Does the work, owns the clock",
      points: [
        "Sees only the tasks assigned to them",
        "Starts a timer, marks work complete \u2014 no pausing",
        "Timer auto-stops at 7:00 PM shift end",
      ],
    },
  ];

  return (
    <section ref={ref} className="roles">
      <div className="section-head">
        <p className="eyebrow eyebrow--dark">
          <span className="eyebrow__dot" />
          Access, by design
        </p>
        <h2 className="section-title">
          Everyone sees exactly what they need to.
        </h2>
      </div>

      <div className={`roles__grid reveal ${visible ? "reveal--in" : ""}`}>
        {roles.map((role) => (
          <div key={role.name} className="role-card">
            <div className="role-card__head">
              <h3>{role.name}</h3>
              <p>{role.summary}</p>
            </div>
            <ul className="role-card__list">
              {role.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* Closing CTA                                                            */
/* ---------------------------------------------------------------------- */
function ClosingCTA({ isAuthed, dashboardPath }) {
  const [ref, visible] = useReveal(0.4);
  return (
    <section ref={ref} className={`cta reveal ${visible ? "reveal--in" : ""}`}>
      <h2 className="cta__title">Start the clock.</h2>
      <p className="cta__subtitle">
        Set up your first department in under a minute, and see where the hours
        go from day one.
      </p>
      {isAuthed ? (
        <Link to={dashboardPath} className="btn btn--primary btn--lg">
          Go to dashboard
        </Link>
      ) : (
        <Link to="/register" className="btn btn--primary btn--lg">
          Create your account
        </Link>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* Footer                                                                 */
/* ---------------------------------------------------------------------- */
function Footer() {
  return (
    <footer className="site-footer">
      <span>Primsy OS</span>
      <span>Internal operations, made visible.</span>
    </footer>
  );
}

/* ---------------------------------------------------------------------- */
/* Styles                                                                 */
/* Scoped via a top-level .home-page class so nothing here leaks into     */
/* the dashboard pages elsewhere in the app.                              */
/* ---------------------------------------------------------------------- */
function PageStyles() {
  return (
    <style>{`
      .home-page {
        --ink: #0B0E14;
        --paper: #F7F5F0;
        --signal: #3D5A80;
        --accent: #E8542C;
        --steel: #8B8F98;
        --line: rgba(247, 245, 240, 0.12);

        position: relative;
        background: var(--ink);
        color: var(--paper);
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        overflow-x: hidden;
        min-height: 100vh;
      }

      .home-page :is(h1, h2, h3) {
        font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
        letter-spacing: -0.02em;
      }

      .bg-grid {
        position: fixed;
        inset: 0;
        z-index: 0;
        background-image:
          linear-gradient(var(--line) 1px, transparent 1px),
          linear-gradient(90deg, var(--line) 1px, transparent 1px);
        background-size: 64px 64px;
        mask-image: linear-gradient(to bottom, black 0%, black 35%, transparent 85%);
      }
      .bg-grid__glow {
        position: absolute;
        top: -10%;
        left: 50%;
        width: 900px;
        height: 900px;
        transform: translateX(-50%);
        background: radial-gradient(circle, rgba(61, 90, 128, 0.35), transparent 65%);
        filter: blur(10px);
      }

      .home-page > * { position: relative; z-index: 1; }

      .site-header { border-bottom: 1px solid var(--line); }
      .site-header__inner {
        max-width: 1120px;
        margin: 0 auto;
        padding: 20px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
      .brand__mark {
        width: 9px; height: 9px; border-radius: 2px;
        background: var(--accent);
      }
      .brand__name {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600;
        font-size: 16px;
        color: var(--paper);
        letter-spacing: -0.01em;
      }
      .site-header__nav { display: flex; align-items: center; gap: 20px; }
      .link-muted { color: var(--steel); text-decoration: none; font-size: 14px; transition: color 0.15s ease; }
      .link-muted:hover { color: var(--paper); }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        border-radius: 8px;
        padding: 10px 18px;
        transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        white-space: nowrap;
      }
      .btn--primary { background: var(--paper); color: var(--ink); }
      .btn--primary:hover { transform: translateY(-1px); background: #fff; }
      .btn--ghost { background: transparent; color: var(--paper); border: 1px solid var(--line); }
      .btn--ghost:hover { border-color: rgba(247,245,240,0.35); }
      .btn--lg { padding: 13px 24px; font-size: 15px; }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--steel);
        margin: 0 0 18px;
      }
      .eyebrow__dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #00ff5e;
      }

      .hero {
        max-width: 1120px;
        margin: 0 auto;
        padding: 96px 24px 80px;
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 64px;
        align-items: center;
      }
      .hero__title {
        font-size: clamp(40px, 6vw, 64px);
        line-height: 1.04;
        font-weight: 600;
        margin: 0 0 24px;
        color: var(--paper);
      }
      .hero__title-accent { color: var(--accent); }
      .hero__subtitle {
        font-size: 17px;
        line-height: 1.6;
        color: var(--steel);
        max-width: 440px;
        margin: 0 0 36px;
      }
        .hero__title-accent{
        color:#00ff5e;
        }
      .hero__actions { display: flex; gap: 14px; flex-wrap: wrap; }

      .hero__visual { display: flex; justify-content: center; }
      .timer-card {
        width: 100%;
        max-width: 380px;
        background: linear-gradient(165deg, #11151F 0%, #0B0E14 100%);
        border: 1px solid rgba(247,245,240,0.1);
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(247,245,240,0.03);
        animation: float 6s ease-in-out infinite;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      .timer-card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
      .timer-card__status {
        display: inline-flex; align-items: center; gap: 7px;
        font-size: 12px; font-weight: 600; color: #6FCF97;
        text-transform: uppercase; letter-spacing: 0.06em;
      }
      .pulse-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #6FCF97;
        animation: pulse 1.8s ease-out infinite;
      }
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(111, 207, 151, 0.5); }
        70% { box-shadow: 0 0 0 8px rgba(111, 207, 151, 0); }
        100% { box-shadow: 0 0 0 0 rgba(111, 207, 151, 0); }
      }
      .timer-card__dept {
        font-size: 12px; font-weight: 600; color: var(--signal);
        background: rgba(61,90,128,0.18);
        padding: 4px 10px; border-radius: 999px;
      }
      .timer-card__task {
        font-size: 14px; color: var(--steel);
        margin: 0 0 22px;
        line-height: 1.4;
      }
      .timer-card__clock {
        font-family: 'JetBrains Mono', 'Space Grotesk', monospace;
        font-size: 48px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: var(--paper);
        letter-spacing: 0.01em;
        margin-bottom: 24px;
      }
      .timer-card__colon { color: var(--steel); padding: 0 2px; }
      .timer-card__foot {
        display: flex; justify-content: space-between;
        font-size: 12px; color: var(--steel);
        border-top: 1px solid var(--line);
        padding-top: 16px;
      }
      .timer-card__shift { color: var(--accent); }

      .stat-strip {
        max-width: 1120px;
        margin: 0 auto;
        padding: 0 24px 96px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        border-top: 1px solid var(--line);
        padding-top: 48px;
      }
      .stat-strip__item { transition: opacity 0.6s ease, transform 0.6s ease; opacity: 0; transform: translateY(14px); }
      .stat-strip.reveal--in .stat-strip__item { opacity: 1; transform: translateY(0); }
      .stat-strip__value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 36px;
        font-weight: 600;
        color: var(--paper);
        margin: 0 0 8px;
        font-variant-numeric: tabular-nums;
      }
      .stat-strip__label { font-size: 14px; color: var(--steel); margin: 0; max-width: 260px; }

      .features {
        max-width: 1120px;
        margin: 0 auto;
        padding: 40px 24px 96px;
      }
      .section-head { margin-bottom: 48px; }
      .eyebrow--dark { color: var(--signal); }
      .section-title {
        font-size: clamp(28px, 3.4vw, 38px);
        font-weight: 600;
        color: var(--paper);
        margin: 0;
        max-width: 600px;
      }
      .features__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      .feature-card {
        background: rgba(247,245,240,0.03);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 28px;
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.2s ease;
      }
      .feature-card.reveal--in { opacity: 1; transform: translateY(0); }
      .feature-card:hover { border-color: rgba(61,90,128,0.5); transform: translateY(-3px); }
      .feature-card__tag {
        display: inline-block;
        font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
        text-transform: uppercase; color: var(--accent);
        margin-bottom: 14px;
      }
      .feature-card__title { font-size: 19px; font-weight: 600; color: var(--paper); margin: 0 0 10px; }
      .feature-card__desc { font-size: 14px; line-height: 1.6; color: var(--steel); margin: 0; }

      .roles { max-width: 1120px; margin: 0 auto; padding: 40px 24px 96px; }
      .roles__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: var(--line);
        border: 1px solid var(--line);
        border-radius: 14px;
        overflow: hidden;
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 0.7s ease, transform 0.7s ease;
      }
      .roles__grid.reveal--in { opacity: 1; transform: translateY(0); }
      .role-card { background: var(--ink); padding: 28px; }
      .role-card__head h3 { font-size: 18px; color: var(--paper); margin: 0 0 4px; }
      .role-card__head p { font-size: 13px; color: var(--signal); margin: 0 0 20px; }
      .role-card__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
      .role-card__list li {
        font-size: 13.5px; color: var(--steel); line-height: 1.5;
        padding-left: 16px; position: relative;
      }
      .role-card__list li::before {
        content: '';
        position: absolute; left: 0; top: 7px;
        width: 5px; height: 5px; border-radius: 50%;
        background: var(--steel);
      }

      .cta {
        max-width: 720px;
        margin: 0 auto;
        padding: 40px 24px 120px;
        text-align: center;
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 0.7s ease, transform 0.7s ease;
      }
      .cta.reveal--in { opacity: 1; transform: translateY(0); }
      .cta__title { font-size: clamp(32px, 5vw, 48px); font-weight: 600; color: var(--paper); margin: 0 0 16px; }
      .cta__subtitle { font-size: 16px; color: var(--steel); margin: 0 0 32px; }

      .site-footer {
        max-width: 1120px;
        margin: 0 auto;
        padding: 28px 24px 40px;
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--steel);
        border-top: 1px solid var(--line);
      }

      @media (max-width: 860px) {
        .hero { grid-template-columns: 1fr; padding-top: 56px; }
        .hero__subtitle { max-width: none; }
        .features__grid { grid-template-columns: 1fr; }
        .roles__grid { grid-template-columns: 1fr; }
        .stat-strip { grid-template-columns: 1fr; gap: 32px; }
        .site-footer { flex-direction: column; gap: 8px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .timer-card { animation: none; }
        .pulse-dot { animation: none; }
        * { transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}
