import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { analytics, eligibilitySteps, getDemoUserId } from "./analytics";

type Page = "home" | "eligibility" | "auth";
type AuthMode = "signin" | "signup";
type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  nationality: string;
  education: string;
  experience: string;
  achievements: string;
  finances: string;
  country: string;
};

const steps = [...eligibilitySteps.map((step) => step.name), "Results"];

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
function getPage(): Page {
  if (window.location.pathname.startsWith("/eligibility")) return "eligibility";
  if (
    window.location.pathname.startsWith("/sign-in") ||
    window.location.pathname.startsWith("/sign-up")
  )
    return "auth";
  return "home";
}
function App() {
  const [page, setPage] = useState<Page>(getPage);
  const [authMode, setAuthMode] = useState<AuthMode>(
    window.location.pathname.includes("sign-up") ? "signup" : "signin",
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem("verdis_demo_user"),
  );
  const [exitSurveyPage, setExitSurveyPage] = useState<Page | null>(null);
  useEffect(() => {
    const onPopState = () => setPage(getPage());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    if (page === "home") analytics.page("home");
    if (page === "auth")
      analytics.page(authMode === "signup" ? "sign_up" : "sign_in");
  }, [page, authMode]);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let triggered = false;
    const onMouseLeave = (event: MouseEvent) => {
      if (!triggered && event.clientY <= 0) {
        triggered = true;
        analytics.page("exit_intent_survey");
        analytics.track("exit_intent_survey_shown", { page });
        setExitSurveyPage(page);
      }
    };
    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, [page]);
  const openPage = (nextPage: Page, path: string) => {
    navigate(path);
    setPage(nextPage);
  };
  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    openPage("auth", mode === "signup" ? "/sign-up" : "/sign-in");
  };
  return (
    <div className="app-shell">
      <Header
        user={user}
        onHome={() => openPage("home", "/")}
        onEligibility={() => openPage("eligibility", "/eligibility-checker")}
        onAuth={openAuth}
      />
      {page === "home" && (
        <Home
          onEligibility={() => openPage("eligibility", "/eligibility-checker")}
          onAuth={openAuth}
        />
      )}
      {page === "eligibility" && (
        <Eligibility onBack={() => openPage("home", "/")} />
      )}
      {page === "auth" && (
        <Auth
          mode={authMode}
          onModeChange={openAuth}
          onSuccess={(nextUser) => {
            localStorage.setItem("verdis_demo_user", nextUser);
            analytics.identify(getDemoUserId());
            analytics.track("auth_completed", { auth_mode: authMode });
            setUser(nextUser);
            openPage("home", "/");
          }}
        />
      )}
      <Footer />
      {exitSurveyPage === page && (
        <ExitIntentSurvey
          onClose={(submitted) => {
            analytics.track(
              submitted
                ? "exit_intent_survey_submitted"
                : "exit_intent_survey_dismissed",
              { page },
            );
            setExitSurveyPage(null);
          }}
        />
      )}
    </div>
  );
}

function ExitIntentSurvey({
  onClose,
}: {
  onClose: (submitted: boolean) => void;
}) {
  const [reasons, setReasons] = useState<string[]>([]);
  const options = [
    "Just browsing",
    "Not ready to move yet",
    "I need more information",
    "The process felt too long",
    "Other",
  ];
  const toggleReason = (reason: string) =>
    setReasons((current) =>
      current.includes(reason)
        ? current.filter((item) => item !== reason)
        : [...current, reason],
    );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onClose(true);
  };
  return (
    <div
      className="exit-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(false);
      }}
    >
      <section
        className="exit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-survey-title"
      >
        <button
          className="exit-close"
          aria-label="Close survey"
          onClick={() => onClose(false)}
        >
          ×
        </button>
        <span className="kicker">Before you go</span>
        <h2 id="exit-survey-title">Can we ask what held you back?</h2>
        <p>
          Your answer helps us make the journey clearer for people like you.
        </p>
        <form onSubmit={submit}>
          <fieldset>
            <legend>Select all that apply</legend>
            {options.map((reason) => (
              <label className="survey-option" key={reason}>
                <input
                  type="checkbox"
                  checked={reasons.includes(reason)}
                  onChange={() => toggleReason(reason)}
                />
                <span>{reason}</span>
              </label>
            ))}
          </fieldset>
          <button
            className="button survey-submit"
            disabled={!reasons.length}
            type="submit"
          >
            Send feedback <span>→</span>
          </button>
        </form>
        <small>Your response is anonymous.</small>
      </section>
    </div>
  );
}

function Header({
  user,
  onHome,
  onEligibility,
  onAuth,
}: {
  user: string | null;
  onHome: () => void;
  onEligibility: () => void;
  onAuth: (mode: AuthMode) => void;
}) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome} aria-label="Verdis home">
        <span className="brand-mark">V</span>
        <span>
          Ver<span>dis</span>
        </span>
      </button>
      <nav className="desktop-nav" aria-label="Main navigation">
        <button onClick={onEligibility}>Eligibility checker</button>
        <a href="#">Services</a>
        <a href="#">Resources</a>
        <a href="#">About us</a>
      </nav>
      <div className="header-actions">
        {user ? (
          <span className="signed-in">Demo account</span>
        ) : (
          <button className="signin-link" onClick={() => onAuth("signin")}>
            Sign in
          </button>
        )}
        <button className="button button-small" onClick={onEligibility}>
          Check eligibility <span>↗</span>
        </button>
      </div>
    </header>
  );
}

function Home({
  onEligibility,
  onAuth,
}: {
  onEligibility: () => void;
  onAuth: (mode: AuthMode) => void;
}) {
  return (
    <main>
      <section className="hero-section page-container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> Your global journey starts here
          </div>
          <h1>
            Move with <em>confidence.</em>
            <br />
            Live without limits.
          </h1>
          <p className="hero-lede">
            Explore your best pathways to study, work, and settle abroad. Verdis
            makes every step of your global move clearer.
          </p>
          <div className="hero-actions">
            <button className="button" onClick={onEligibility}>
              Check your eligibility <span>↗</span>
            </button>
            <button className="text-button" onClick={() => onAuth("signup")}>
              Create a free account <span>→</span>
            </button>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack">
              <span>AO</span>
              <span>MK</span>
              <span>JS</span>
              <span>+</span>
            </div>
            <p>
              <strong>12,000+</strong>
              <br />
              people have started their journey
            </p>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Illustration of a person planning an international move"
        >
          <div className="sun-orb" />
          <div className="art-card card-top">
            <span className="card-icon">✦</span>
            <div>
              <strong>New possibilities</strong>
              <small>are closer than you think</small>
            </div>
          </div>
          <div className="passport-card">
            <div className="passport-stamp">✈</div>
            <small>GLOBAL MOBILITY</small>
            <strong>
              YOUR
              <br />
              NEXT
              <br />
              CHAPTER
            </strong>
            <span>VERDIS / 2026</span>
          </div>
          <div className="art-card card-bottom">
            <span className="check-badge">✓</span>
            <div>
              <strong>Eligibility score</strong>
              <small>82% match</small>
            </div>
          </div>
          <div className="art-line line-one" />
          <div className="art-line line-two" />
        </div>
      </section>
      <section className="marquee-strip">
        <div className="marquee-inner">
          <span>Study abroad</span>
          <i>✦</i>
          <span>Work globally</span>
          <i>✦</i>
          <span>Build your future</span>
          <i>✦</i>
          <span>Study abroad</span>
          <i>✦</i>
          <span>Work globally</span>
        </div>
      </section>
      <section className="services-section page-container">
        <div className="section-heading">
          <div>
            <span className="kicker">A clearer way forward</span>
            <h2>
              Wherever you’re going,
              <br />
              <em>we’ll help you get there.</em>
            </h2>
          </div>
          <p>
            From your first question to your first day in a new country, we help
            you make informed decisions with practical guidance.
          </p>
        </div>
        <div className="service-grid">
          <ServiceCard
            number="01"
            title="Find your pathway"
            copy="Discover the visa and migration routes that fit your goals, profile, and future."
            icon="⌁"
          />
          <ServiceCard
            number="02"
            title="Know your chances"
            copy="Get a personalised eligibility assessment built around your unique story."
            icon="◌"
            featured
          />
          <ServiceCard
            number="03"
            title="Make your move"
            copy="Turn your plan into progress with trusted resources and expert support."
            icon="↗"
          />
        </div>
      </section>
      <section className="checker-promo">
        <div className="checker-promo-shape shape-a" />
        <div className="checker-promo-shape shape-b" />
        <div className="page-container checker-promo-content">
          <div>
            <span className="kicker light">Start with clarity</span>
            <h2>
              Could your next chapter
              <br />
              <em>be waiting abroad?</em>
            </h2>
          </div>
          <div>
            <p>
              Our free eligibility checker gives you a personalised starting
              point in less than 10 minutes.
            </p>
            <button className="button button-light" onClick={onEligibility}>
              Find out where you stand <span>↗</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ServiceCard({
  number,
  title,
  copy,
  icon,
  featured = false,
}: {
  number: string;
  title: string;
  copy: string;
  icon: string;
  featured?: boolean;
}) {
  return (
    <article className={`service-card ${featured ? "featured" : ""}`}>
      <div className="service-top">
        <span>{number}</span>
        <strong>{icon}</strong>
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
      <a href="#">
        Learn more <span>↗</span>
      </a>
    </article>
  );
}

function Eligibility({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    nationality: "",
    education: "",
    experience: "",
    achievements: "",
    finances: "",
    country: "",
  });
  const isResults = step === steps.length - 1;
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const canContinue = useMemo(
    () =>
      step !== 0 ||
      Boolean(
        form.firstName && form.lastName && form.email && form.nationality,
      ),
    [step, form],
  );
  useEffect(() => {
    if (step === 0) analytics.track("eligibility_checker_started");
    if (step < eligibilitySteps.length) {
      const current = eligibilitySteps[step];
      analytics.page("eligibility_checker", {
        step_id: current.id,
        step_number: current.number,
      });
      analytics.track("eligibility_step_viewed", {
        step_id: current.id,
        step_number: current.number,
      });
    } else {
      analytics.page("eligibility_results");
      analytics.track("eligibility_results_viewed");
    }
  }, [step]);
  const next = () => {
    if (!canContinue) return;
    const current = eligibilitySteps[step];
    analytics.track("eligibility_step_completed", {
      step_id: current.id,
      step_number: current.number,
    });
    if (step === eligibilitySteps.length - 1)
      analytics.track("eligibility_completed");
    setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1));
  };
  const goBack = () => {
    const previous = eligibilitySteps[step - 1];
    if (previous)
      analytics.track("eligibility_step_back_clicked", {
        step_id: previous.id,
        step_number: previous.number,
      });
    setStep((current) => current - 1);
  };
  return (
    <main className="checker-page">
      <div className="checker-header page-container">
        <button className="back-link" onClick={onBack}>
          ← Back to Verdis
        </button>
        <span className="checker-brand">
          Ver<span>dis</span> <i>eligibility assessment</i>
        </span>
        <span className="secure-note">⌁ Your information is private</span>
      </div>
      <div className="checker-layout page-container">
        <aside className="checker-sidebar">
          <span className="kicker">Your pathway starts here</span>
          <h1>
            Find out what’s
            <br />
            <em>possible for you.</em>
          </h1>
          <p>
            A few questions help us match your profile to the immigration
            pathways where you have the strongest chance.
          </p>
          <div className="sidebar-note">
            <span>✦</span>
            <div>
              <strong>Personalised, not generic.</strong>
              <small>Your answers shape your results.</small>
            </div>
          </div>
        </aside>
        <section className="checker-card">
          <div className="step-progress">
            <div className="progress-line">
              <span
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              />
            </div>
            {steps.map((label, index) => (
              <div
                className={`step-dot ${index <= step ? "active" : ""}`}
                key={label}
              >
                <span>{index < step ? "✓" : index + 1}</span>
                <small>{label}</small>
              </div>
            ))}
          </div>
          {!isResults ? (
            <FormStep step={step} form={form} update={update} />
          ) : (
            <Results form={form} />
          )}
          {!isResults && (
            <div className="form-footer">
              <span>
                {step === 0
                  ? "Takes about 5–10 minutes"
                  : "You can go back at any time"}
              </span>
              <div className="form-actions">
                {step > 0 && (
                  <button className="step-back" onClick={goBack}>
                    ← Back
                  </button>
                )}
                <button
                  className="button"
                  disabled={!canContinue}
                  onClick={next}
                >
                  {step === 5 ? "See my results" : "Continue"} <span>→</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FormStep({
  step,
  form,
  update,
}: {
  step: number;
  form: FormData;
  update: (key: keyof FormData, value: string) => void;
}) {
  const copy = [
    ["Personal information", "Let’s start with the basics."],
    ["Education", "Tell us about your educational background."],
    ["Experience", "A little about your professional journey."],
    ["Achievements", "What makes your story stand out?"],
    ["Finances", "This helps us understand your practical options."],
    ["Your goals", "Where would you like this journey to take you?"],
  ][step];
  return (
    <div className="form-content">
      <span className="form-step-label">
        STEP {String(step + 1).padStart(2, "0")} / 06
      </span>
      <h2>{copy[0]}</h2>
      <p className="form-intro">{copy[1]}</p>
      {step === 0 && (
        <div className="input-grid">
          <Field
            label="First name"
            value={form.firstName}
            onChange={(value) => update("firstName", value)}
            placeholder="e.g. Amara"
          />
          <Field
            label="Last name"
            value={form.lastName}
            onChange={(value) => update("lastName", value)}
            placeholder="e.g. Okafor"
          />
          <Field
            label="Email address"
            type="email"
            value={form.email}
            onChange={(value) => update("email", value)}
            placeholder="you@example.com"
          />
          <Field
            label="Phone number"
            value={form.phone}
            onChange={(value) => update("phone", value)}
            placeholder="+234 800 000 0000"
          />
          <Field
            label="Age"
            value={form.age}
            onChange={(value) => update("age", value)}
            placeholder="Your age"
          />
          <SelectField
            label="Current nationality"
            value={form.nationality}
            onChange={(value) => update("nationality", value)}
            options={[
              "Nigerian",
              "Ghanaian",
              "Kenyan",
              "South African",
              "Other",
            ]}
          />
        </div>
      )}
      {step === 1 && (
        <ChoiceGrid
          value={form.education}
          onChange={(value) => update("education", value)}
          options={[
            "Secondary school",
            "Bachelor’s degree",
            "Master’s degree",
            "Doctorate",
            "Professional qualification",
          ]}
        />
      )}
      {step === 2 && (
        <ChoiceGrid
          value={form.experience}
          onChange={(value) => update("experience", value)}
          options={[
            "Less than 2 years",
            "2–5 years",
            "5–10 years",
            "More than 10 years",
            "I’m just starting out",
          ]}
        />
      )}
      {step === 3 && (
        <ChoiceGrid
          value={form.achievements}
          onChange={(value) => update("achievements", value)}
          options={[
            "Professional achievements",
            "Academic achievements",
            "Creative or sporting achievements",
            "Community leadership",
            "A mix of these",
          ]}
        />
      )}
      {step === 4 && (
        <ChoiceGrid
          value={form.finances}
          onChange={(value) => update("finances", value)}
          options={[
            "I have savings ready",
            "I’m actively saving",
            "I have a sponsor",
            "I’m exploring funding options",
          ]}
        />
      )}
      {step === 5 && (
        <ChoiceGrid
          value={form.country}
          onChange={(value) => update("country", value)}
          options={[
            "Canada",
            "United Kingdom",
            "Australia",
            "United States",
            "I’m open to recommendations",
          ]}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select nationality</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
function ChoiceGrid({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="choice-grid">
      {options.map((option, index) => (
        <button
          type="button"
          className={`choice ${value === option ? "selected" : ""}`}
          onClick={() => onChange(option)}
          key={option}
        >
          <span>{String.fromCharCode(65 + index)}</span>
          {option}
          <b>→</b>
        </button>
      ))}
    </div>
  );
}

function Results({ form }: { form: Record<string, string> }) {
  const [checkout, setCheckout] = useState(false);
  const [paymentState, setPaymentState] = useState<
    "not_started" | "started" | "failed" | "succeeded"
  >("not_started");
  useEffect(() => {
    if (checkout) analytics.page("report_checkout");
  }, [checkout]);
  const openCheckout = () => {
    analytics.track("report_checkout_opened");
    setCheckout(true);
  };
  const simulatePayment = (state: "started" | "failed" | "succeeded") => {
    setPaymentState(state);
    analytics.track(
      `report_payment_${state === "succeeded" ? "succeeded" : state}`,
    );
  };
  return (
    <div className="results-content">
      <span className="form-step-label">YOUR PERSONALISED RESULT</span>
      <div className="result-score">
        <div className="score-ring">
          <strong>82</strong>
          <small>/100</small>
        </div>
        <div>
          <h2>You have strong potential, {form.firstName || "there"}.</h2>
          <p>
            Based on your profile, we found several pathways worth exploring.
          </p>
        </div>
      </div>
      <div className="match-list">
        <div>
          <span>01</span>
          <div>
            <strong>Skilled Worker pathways</strong>
            <small>Strong match · Canada, UK, Australia</small>
          </div>
          <b>84%</b>
        </div>
        <div>
          <span>02</span>
          <div>
            <strong>Study-to-settle pathways</strong>
            <small>Good match · Canada, UK</small>
          </div>
          <b>76%</b>
        </div>
      </div>
      {!checkout ? (
        <div className="report-unlock">
          <div>
            <span className="lock-icon">⌑</span>
            <div>
              <strong>Your full report is ready.</strong>
              <p>
                Unlock your complete pathway breakdown, next steps, and document
                checklist.
              </p>
            </div>
          </div>
          <button className="button" onClick={openCheckout}>
            Unlock full report · $19 <span>↗</span>
          </button>
        </div>
      ) : (
        <div className="checkout-demo">
          <div>
            <span className="kicker">Checkout preview</span>
            <h3>Complete your report</h3>
            <p>Choose a simulated outcome to demonstrate the payment funnel.</p>
          </div>
          <div className="payment-states">
            <button
              className={`state-pill pending ${paymentState === "started" ? "selected" : ""}`}
              onClick={() => simulatePayment("started")}
            >
              Payment started
            </button>
            <button
              className={`state-pill failed ${paymentState === "failed" ? "selected" : ""}`}
              onClick={() => simulatePayment("failed")}
            >
              Payment failed
            </button>
            <button
              className={`state-pill paid ${paymentState === "succeeded" ? "selected" : ""}`}
              onClick={() => simulatePayment("succeeded")}
            >
              Payment successful
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Auth({
  mode,
  onModeChange,
  onSuccess,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: (user: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSuccess(email || "demo@verdis.com");
  };
  return (
    <main className="auth-page">
      <div className="auth-art">
        <button className="brand brand-light" onClick={() => navigate("/")}>
          <span className="brand-mark">V</span>
          <span>
            Ver<span>dis</span>
          </span>
        </button>
        <div>
          <span className="kicker light">Your journey, kept together</span>
          <h1>
            Big moves deserve
            <br />
            <em>a clear plan.</em>
          </h1>
          <p>
            Save your assessment, revisit your results, and keep every next step
            in one place.
          </p>
        </div>
        <span className="auth-art-footer">
          Verdis / Global mobility, simplified
        </span>
      </div>
      <section className="auth-card">
        <div className="auth-top">
          <span className="kicker">Welcome to Verdis</span>
          <h2>
            {mode === "signin"
              ? "Good to see you again."
              : "Start your journey."}
          </h2>
          <p>
            {mode === "signin"
              ? "Sign in to continue where you left off."
              : "Create a free account to save your progress."}
          </p>
        </div>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <Field
              label="Your name"
              value={name}
              onChange={setName}
              placeholder="e.g. Amara Okafor"
            />
          )}
          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value="demo-password"
            onChange={() => undefined}
            placeholder="••••••••"
            type="password"
          />
          <button className="button auth-submit" type="submit">
            {mode === "signin" ? "Sign in" : "Create account"} <span>→</span>
          </button>
        </form>
        <div className="auth-switch">
          {mode === "signin" ? "New to Verdis?" : "Already have an account?"}{" "}
          <button
            onClick={() =>
              onModeChange(mode === "signin" ? "signup" : "signin")
            }
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>
        <small className="demo-note">
          Demo only · credentials are not sent anywhere
        </small>
      </section>
    </main>
  );
}
function Footer() {
  return (
    <footer className="site-footer page-container">
      <button className="brand" onClick={() => navigate("/")}>
        <span className="brand-mark">V</span>
        <span>
          Ver<span>dis</span>
        </span>
      </button>
      <p>Your global path, simplified.</p>
      <div>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Help center</a>
        <span>© 2026 Verdis</span>
      </div>
    </footer>
  );
}

export default App;
