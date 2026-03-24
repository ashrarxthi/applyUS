import I90SmartForm from "./I90SmartForm";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Data ──────────────────────────────────────────────────────────────────

const FORMS = [
  { id: "I-90",    name: "Green Card Renewal / Replacement",              fee: 540,  category: "Green Card",  description: "Renew or replace your Permanent Resident Card (I-551)" },
  { id: "N-400",   name: "U.S. Citizenship (Naturalization)",             fee: 725,  category: "Citizenship", description: "Apply to become a naturalized United States citizen" },
  { id: "I-821D",  name: "Deferred Action Renewal (DACA)",                fee: 495,  category: "DACA",        description: "Request consideration of deferred action for childhood arrivals" },
  { id: "I-130",   name: "Sponsor Your Relative for a Green Card",        fee: 535,  category: "Family",      description: "Petition for an alien relative to obtain a U.S. immigrant visa" },
  { id: "N-565",   name: "Replace Naturalization / Citizenship Document", fee: 555,  category: "Citizenship", description: "Apply for a replacement Certificate of Naturalization or Citizenship" },
  { id: "I-765",   name: "Employment Authorization",                      fee: 410,  category: "Work",        description: "Apply for authorization to work lawfully in the United States" },
  { id: "I-824",   name: "Action on Approved Application/Petition",       fee: 465,  category: "General",     description: "Request USCIS to notify a consulate of your approved petition" },
  { id: "I-751",   name: "Petition to Remove Conditions on Residence",    fee: 595,  category: "Green Card",  description: "Remove the 2-year conditions on your permanent resident status" },
  { id: "I-131",   name: "Travel Document Application",                   fee: 575,  category: "Travel",      description: "Apply for a reentry permit, refugee travel document, or advance parole" },
  { id: "I-485",   name: "Register Permanent Residence or Adjust Status", fee: 1440, category: "Green Card",  description: "Apply to become a lawful permanent resident of the United States" },
  { id: "I-129F",  name: "Petition for Alien Fiancé(e)",                  fee: 535,  category: "Family",      description: "Allow your foreign-national fiancé(e) to travel to the U.S. to marry" },
  { id: "N-600",   name: "Certificate of Citizenship Application",        fee: 1170, category: "Citizenship", description: "Apply for a Certificate of Citizenship for yourself or your child" },
  { id: "I-539",   name: "Change or Extend Nonimmigrant Status",          fee: 370,  category: "Visa",        description: "Extend your stay or change to another nonimmigrant visa category" },
];

const CATEGORY_STYLES = {
  "Green Card":  { bg: "#e6f3ec", color: "#1a6b3a" },
  "Citizenship": { bg: "#e8edf8", color: "#1a3a7a" },
  "DACA":        { bg: "#fdf0e0", color: "#8a5210" },
  "Family":      { bg: "#f0e8f8", color: "#5a1a7a" },
  "Work":        { bg: "#e0f0f8", color: "#0a4a6a" },
  "General":     { bg: "#f0ede8", color: "#4a3a2a" },
  "Travel":      { bg: "#e8f5f0", color: "#1a5a4a" },
  "Visa":        { bg: "#f8e8e8", color: "#6a1a1a" },
};

const STEPS = ["Eligibility", "Registration", "Application", "Review & File"];

const ELIGIBILITY = {
  default: [
    { id: "age",      question: "Are you 18 years of age or older?" },
    { id: "us_based", question: "Are you currently residing in the United States?" },
    { id: "no_prior", question: "Have you NOT been denied this application within the last 12 months?" },
  ],
  "N-400": [
    { id: "resident_5yr", question: "Have you been a Lawful Permanent Resident for at least 5 years (or 3 years if married to a U.S. citizen)?" },
    { id: "continuous",   question: "Have you continuously resided in the U.S. for at least 30 months of the last 5 years?" },
    { id: "moral_char",   question: "Do you consider yourself a person of good moral character?" },
    { id: "english",      question: "Are you able to read, write, and speak basic English?" },
  ],
  "I-765": [
    { id: "eligible",  question: "Do you have an eligible immigration status qualifying for employment authorization (e.g., pending asylum, pending I-485, TPS)?" },
    { id: "in_us",     question: "Are you currently residing in the United States?" },
    { id: "no_bar",    question: "Are you NOT currently in removal or deportation proceedings?" },
  ],
  "I-485": [
    { id: "visa_avail", question: "Is an immigrant visa immediately available for your preference category?" },
    { id: "admitted",   question: "Were you lawfully admitted or paroled into the United States?" },
    { id: "no_bars",    question: "Are you free of grounds of inadmissibility (no criminal bars, prior deportation orders, etc.)?" },
  ],
  "I-90": [
    { id: "have_gc",       question: "Do you currently have or have had a Green Card (Permanent Resident Card, Form I-551)?" },
    { id: "not_abandoned", question: "Have you NOT abandoned your U.S. permanent residency?" },
    { id: "lpr",           question: "Are you still a Lawful Permanent Resident (LPR) of the United States?" },
  ],
};

const APP_FIELDS = {
  default: [
    { id: "last_name",     label: "Last Name",                             type: "text",   span: 1 },
    { id: "first_name",    label: "First Name",                            type: "text",   span: 1 },
    { id: "middle_name",   label: "Middle Name (if any)",                  type: "text",   span: 1 },
    { id: "dob",           label: "Date of Birth",                         type: "date",   span: 1 },
    { id: "country_birth", label: "Country of Birth",                      type: "text",   span: 1 },
    { id: "alien_number",  label: "Alien Registration Number (A-Number)",  type: "text",   span: 1, placeholder: "e.g. A-123456789" },
    { id: "address",       label: "Street Address",                        type: "text",   span: 2 },
    { id: "city",          label: "City",                                  type: "text",   span: 1 },
    { id: "state",         label: "State",                                 type: "text",   span: 1 },
    { id: "zip",           label: "ZIP Code",                              type: "text",   span: 1 },
    { id: "phone",         label: "Daytime Phone Number",                  type: "tel",    span: 1 },
  ],
  "N-400": [
    { id: "last_name",     label: "Last Name",                             type: "text",   span: 1 },
    { id: "first_name",    label: "First Name",                            type: "text",   span: 1 },
    { id: "dob",           label: "Date of Birth",                         type: "date",   span: 1 },
    { id: "alien_number",  label: "Alien Registration Number (A-Number)",  type: "text",   span: 1, placeholder: "A-" },
    { id: "ssn",           label: "Social Security Number",                type: "text",   span: 1, placeholder: "XXX-XX-XXXX" },
    { id: "pr_date",       label: "Date You Became a Permanent Resident",  type: "date",   span: 1 },
    { id: "address",       label: "Street Address",                        type: "text",   span: 2 },
    { id: "city",          label: "City",                                  type: "text",   span: 1 },
    { id: "state",         label: "State",                                 type: "text",   span: 1 },
    { id: "marital_status",label: "Marital Status",                        type: "select", span: 1, options: ["Single", "Married", "Divorced", "Widowed"] },
    { id: "spouse_citizen",label: "Is Your Spouse a U.S. Citizen?",        type: "select", span: 1, options: ["Yes", "No", "N/A"] },
  ],
  "I-765": [
    { id: "last_name",       label: "Last Name",                           type: "text",   span: 1 },
    { id: "first_name",      label: "First Name",                          type: "text",   span: 1 },
    { id: "dob",             label: "Date of Birth",                       type: "date",   span: 1 },
    { id: "country_citizen", label: "Country of Citizenship",              type: "text",   span: 1 },
    { id: "alien_number",    label: "Alien Registration Number (A-Number)",type: "text",   span: 1, placeholder: "A-" },
    { id: "uscis_number",    label: "USCIS Online Account Number (if any)",type: "text",   span: 1 },
    { id: "eligibility_cat", label: "Eligibility Category (e.g. (c)(9))", type: "text",   span: 1 },
    { id: "address",         label: "Street Address",                      type: "text",   span: 2 },
    { id: "city",            label: "City",                                type: "text",   span: 1 },
    { id: "state",           label: "State",                               type: "text",   span: 1 },
    { id: "zip",             label: "ZIP Code",                            type: "text",   span: 1 },
  ],
};

// ─── Colors ────────────────────────────────────────────────────────────────

const C = {
  navy:          "#0d2444",
  navyMid:       "#1e3d6e",
  gold:          "#c8942a",
  goldLight:     "#fdf3e3",
  goldBorder:    "#e8d5a0",
  white:         "#ffffff",
  offWhite:      "#fafaf8",
  border:        "#e5dfd6",
  borderLight:   "#f0ece6",
  textSecondary: "#5a6478",
  textMuted:     "#9aa5b8",
  success:       "#2d7a4f",
  successLight:  "#e6f4ec",
  successBorder: "#a7d7bc",
  danger:        "#dc2626",
  dangerLight:   "#fef2f2",
  dangerBorder:  "#fca5a5",
};

// ─── Input helper ──────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%", padding: "11px 14px", fontSize: "14px",
  border: `1px solid ${C.border}`, borderRadius: "8px", outline: "none",
  fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.navy,
  background: C.white, transition: "border-color 0.15s",
};

function Field({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const style = { ...inputStyle, borderColor: focused ? C.gold : C.border };
  if (field.type === "select") {
    return (
      <select value={value || ""} onChange={e => onChange(e.target.value)}
        style={{ ...style, cursor: "pointer" }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
        <option value="">Select...</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input type={field.type} value={value || ""} placeholder={field.placeholder || ""}
      onChange={e => onChange(e.target.value)} style={style}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────

function Navbar({ onConsult, onSignIn }) {
  return (
    <nav style={{
      background: C.navy, padding: "0 2.5rem", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      height: "68px", position: "sticky", top: 0, zIndex: 100,
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "26px", color: C.white, letterSpacing: "-0.5px" }}>Apply</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "26px", color: C.gold, letterSpacing: "-0.5px" }}>US</span>
      </div>

      <div style={{ display: "flex", gap: "2rem" }}>
        {["Services", "About", "Resources", "Contact"].map(item => (
          <a key={item} style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", fontWeight: "500", textDecoration: "none", cursor: "pointer", transition: "color 0.15s" }}
            onMouseEnter={e => e.target.style.color = C.white}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.65)"}>
            {item}
          </a>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button onClick={onSignIn} style={{
          background: "transparent", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.25)",
          padding: "9px 20px", borderRadius: "7px", fontSize: "13px",
          fontWeight: "500", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = C.white; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}>
          Sign In
        </button>
        <button onClick={onConsult} style={{
          background: C.gold, color: C.white, border: "none",
          padding: "10px 22px", borderRadius: "7px", fontSize: "13px",
          fontWeight: "600", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#b07d1e"}
          onMouseLeave={e => e.currentTarget.style.background = C.gold}>
          Free Consultation
        </button>
      </div>
    </nav>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero({ onGetStarted }) {
  return (
    <div style={{ background: `linear-gradient(140deg, ${C.navy} 0%, #1b3b6a 100%)`, padding: "88px 2.5rem 96px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "380px", height: "380px", borderRadius: "50%", border: "1px solid rgba(200,148,42,0.12)" }} />
      <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "260px", height: "260px", borderRadius: "50%", border: "1px solid rgba(200,148,42,0.08)" }} />
      <div style={{ position: "absolute", bottom: "-100px", left: "3%", width: "450px", height: "450px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.03)" }} />

      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", position: "relative" }}>
        <div style={{
          display: "inline-block", background: "rgba(200,148,42,0.15)",
          border: "1px solid rgba(200,148,42,0.3)", borderRadius: "20px",
          padding: "6px 18px", marginBottom: "28px",
        }}>
          <span style={{ color: C.gold, fontSize: "12px", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Trusted U.S. Immigration Legal Services
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontWeight: "600",
          fontSize: "clamp(38px, 5vw, 60px)", color: C.white,
          lineHeight: "1.12", marginBottom: "20px",
        }}>
          Your Path to Legal Status<br />
          <span style={{ color: C.gold }}>Starts Here</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", maxWidth: "540px", margin: "0 auto 44px", lineHeight: "1.75", fontWeight: "300" }}>
          We guide individuals and families through every step of the U.S. immigration process — from applications to citizenship.
        </p>

        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onGetStarted} style={{
            background: C.gold, color: C.white, border: "none",
            padding: "15px 34px", borderRadius: "8px", fontSize: "15px",
            fontWeight: "600", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#b07d1e"}
            onMouseLeave={e => e.currentTarget.style.background = C.gold}>
            Start My Application
          </button>
          <button style={{
            background: "transparent", color: C.white,
            border: "1px solid rgba(255,255,255,0.28)",
            padding: "15px 34px", borderRadius: "8px", fontSize: "15px",
            fontWeight: "500", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Schedule a Consultation
          </button>
        </div>

        <div style={{ display: "flex", gap: "48px", justifyContent: "center", marginTop: "56px" }}>
          {[["25+", "Years Experience"], ["5,000+", "Cases Handled"], ["98%", "Approval Rate"]].map(([num, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ color: C.gold, fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: "600" }}>{num}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", fontWeight: "600", marginTop: "4px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Forms Section ─────────────────────────────────────────────────────────

function FormsSection() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const onSelectForm = (form) => navigate(`/apply/${form.id}`);
  const categories = ["All", ...new Set(FORMS.map(f => f.category))];
  const filtered = filter === "All" ? FORMS : FORMS.filter(f => f.category === filter);

  return (
    <div style={{ background: C.offWhite, padding: "72px 2.5rem 80px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "38px", fontWeight: "600", color: C.navy, marginBottom: "14px" }}>
            Immigration Form Packages
          </h2>
          <p style={{ color: C.textSecondary, fontSize: "16px", maxWidth: "480px", margin: "0 auto", lineHeight: "1.6" }}>
            Select the service you need. Our attorneys will guide you through every step of the process.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px", justifyContent: "center" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: "7px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: "500",
              cursor: "pointer", border: "1px solid", fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: filter === cat ? C.navy : C.white,
              color: filter === cat ? C.white : C.textSecondary,
              borderColor: filter === cat ? C.navy : C.border,
              transition: "all 0.15s",
            }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ background: C.white, borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "90px 1fr 120px 110px 140px",
            background: C.navy, padding: "14px 24px", gap: "16px",
          }}>
            {["Form", "Description", "Category", "Gov. Fee", ""].map((h, i) => (
              <div key={i} style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</div>
            ))}
          </div>

          {filtered.map((form, idx) => {
            const cs = CATEGORY_STYLES[form.category] || CATEGORY_STYLES["General"];
            return (
              <div key={form.id}
                style={{
                  display: "grid", gridTemplateColumns: "90px 1fr 120px 110px 140px",
                  padding: "18px 24px", gap: "16px", alignItems: "center",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none",
                  transition: "background 0.12s",
                  opacity: ["I-90", "N-400"].includes(form.id) ? 1 : 0.6,
                }}
                onMouseEnter={e => { if (["I-90", "N-400"].includes(form.id)) e.currentTarget.style.background = "#f8f6f2"; }}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", color: C.navy, fontSize: "15px" }}>{form.id}</div>
                <div>
                  <div style={{ fontWeight: "600", color: C.navy, fontSize: "14px", marginBottom: "3px" }}>{form.name}</div>
                  <div style={{ color: C.textMuted, fontSize: "12px", lineHeight: "1.4" }}>{form.description}</div>
                </div>
                <div>
                  <span style={{ background: cs.bg, color: cs.color, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                    {form.category}
                  </span>
                </div>
                <div style={{ color: C.textSecondary, fontSize: "14px", fontWeight: "600" }}>${form.fee.toLocaleString()}</div>
                {["I-90", "N-400"].includes(form.id) ? (
                  <button onClick={() => onSelectForm(form)} style={{
                    background: C.navy, color: C.white, border: "none",
                    padding: "9px 18px", borderRadius: "7px", fontSize: "13px",
                    fontWeight: "600", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "background 0.15s", whiteSpace: "nowrap",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = C.navyMid}
                    onMouseLeave={e => e.currentTarget.style.background = C.navy}>
                    Start Now →
                  </button>
                ) : (
                  <span style={{
                    background: C.borderLight, color: C.textMuted,
                    padding: "9px 18px", borderRadius: "7px", fontSize: "12px",
                    fontWeight: "600", fontFamily: "'Plus Jakarta Sans', sans-serif",
                    whiteSpace: "nowrap", display: "inline-block",
                  }}>
                    Coming Soon
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ color: C.textMuted, fontSize: "12px", textAlign: "center", marginTop: "18px", lineHeight: "1.6" }}>
          Government USCIS filing fees shown. Our attorney service fees are separate and will be outlined during onboarding.
        </p>
      </div>
    </div>
  );
}

// ─── Why Choose Us ─────────────────────────────────────────────────────────

function WhyUs() {
  const items = [
    { icon: "⚖️", title: "Licensed Attorneys", body: "Every case is handled by a licensed U.S. immigration attorney — not a paralegal or document preparer." },
    { icon: "🔒", title: "Secure & Confidential", body: "Your personal information is encrypted and protected under strict attorney-client privilege." },
    { icon: "📋", title: "Attorney Review Included", body: "We review every form before filing to ensure accuracy and reduce the risk of delays or denials." },
    { icon: "💬", title: "Dedicated Support", body: "Your assigned attorney is available to answer questions throughout the entire process." },
  ];
  return (
    <div style={{ background: C.white, padding: "72px 2.5rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", color: C.navy, marginBottom: "12px" }}>Why Choose Our Firm</h2>
          <p style={{ color: C.textSecondary, fontSize: "15px", maxWidth: "440px", margin: "0 auto" }}>We combine legal expertise with technology to make immigration accessible and stress-free.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
          {items.map(item => (
            <div key={item.title} style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "28px 24px" }}>
              <div style={{ fontSize: "28px", marginBottom: "14px" }}>{item.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", color: C.navy, marginBottom: "10px" }}>{item.title}</h3>
              <p style={{ color: C.textSecondary, fontSize: "13px", lineHeight: "1.65" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator ────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "44px" }}>
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "7px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: "700", transition: "all 0.3s",
                background: done ? C.gold : active ? C.navy : "transparent",
                color: done || active ? C.white : C.textMuted,
                border: `2px solid ${done ? C.gold : active ? C.navy : C.border}`,
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: "11px", fontWeight: active ? "700" : "400", color: active ? C.navy : C.textMuted, whiteSpace: "nowrap" }}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: "72px", height: "2px", background: done ? C.gold : C.border, margin: "0 8px 18px", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Nav Buttons ───────────────────────────────────────────────────────────

function NavButtons({ onBack, onNext, nextLabel = "Continue →", nextDisabled = false }) {
  return (
    <div style={{ display: "flex", justifyContent: onBack ? "space-between" : "flex-end", marginTop: "36px" }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: "transparent", color: C.textSecondary, border: `1px solid ${C.border}`,
          padding: "12px 26px", borderRadius: "8px", fontSize: "14px", fontWeight: "500",
          cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>← Back</button>
      )}
      <button onClick={onNext} disabled={nextDisabled} style={{
        background: nextDisabled ? C.border : C.gold,
        color: nextDisabled ? C.textMuted : C.white,
        border: "none", padding: "12px 30px", borderRadius: "8px",
        fontSize: "14px", fontWeight: "700", cursor: nextDisabled ? "not-allowed" : "pointer",
        fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.15s",
      }}
        onMouseEnter={e => { if (!nextDisabled) e.currentTarget.style.background = "#b07d1e"; }}
        onMouseLeave={e => { if (!nextDisabled) e.currentTarget.style.background = C.gold; }}>
        {nextLabel}
      </button>
    </div>
  );
}

// ─── Eligibility Step ──────────────────────────────────────────────────────

function EligibilityStep({ form, answers, setAnswers, onNext }) {
  const questions = ELIGIBILITY[form.id] || ELIGIBILITY.default;
  const allAnswered = questions.every(q => answers[q.id] !== undefined);
  const allYes      = questions.every(q => answers[q.id] === true);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", color: C.navy, marginBottom: "10px" }}>
          Check Your Eligibility
        </h3>
        <p style={{ color: C.textSecondary, fontSize: "14px" }}>
          Answer the following to confirm you qualify for {form.id} — {form.name}.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "640px", margin: "0 auto" }}>
        {questions.map((q, i) => {
          const ans = answers[q.id];
          const bg = ans === true ? C.successLight : ans === false ? C.dangerLight : C.offWhite;
          const bd = ans === true ? C.successBorder : ans === false ? C.dangerBorder : C.border;
          return (
            <div key={q.id} style={{ background: bg, border: `1px solid ${bd}`, borderRadius: "10px", padding: "18px 20px", transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: C.textMuted, fontSize: "10px", fontWeight: "700", display: "block", marginBottom: "5px", letterSpacing: "0.5px" }}>QUESTION {i + 1}</span>
                  <p style={{ color: C.navy, fontSize: "14px", fontWeight: "500", lineHeight: "1.55" }}>{q.question}</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0, marginTop: "2px" }}>
                  {[true, false].map(val => (
                    <button key={String(val)} onClick={() => setAnswers(p => ({ ...p, [q.id]: val }))} style={{
                      padding: "7px 18px", borderRadius: "7px", fontSize: "13px", fontWeight: "600",
                      cursor: "pointer", border: "1px solid", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
                      background: ans === val ? (val ? C.success : C.danger) : C.white,
                      color: ans === val ? C.white : C.textSecondary,
                      borderColor: ans === val ? (val ? C.success : C.danger) : C.border,
                    }}>{val ? "Yes" : "No"}</button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allAnswered && !allYes && (
        <div style={{ maxWidth: "640px", margin: "20px auto 0", background: C.dangerLight, border: `1px solid ${C.dangerBorder}`, borderRadius: "10px", padding: "18px 22px" }}>
          <p style={{ color: "#7f1d1d", fontSize: "14px", fontWeight: "500", lineHeight: "1.6" }}>
            Based on your answers, you may not currently qualify for this form. We recommend scheduling a free consultation with our attorneys to discuss your options and possible alternatives.
          </p>
          <button style={{ marginTop: "14px", background: C.navy, color: C.white, border: "none", padding: "10px 20px", borderRadius: "7px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Schedule Free Consultation
          </button>
        </div>
      )}

      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <NavButtons onNext={onNext} nextLabel="I'm Eligible — Continue →" nextDisabled={!allAnswered || !allYes} />
      </div>
    </div>
  );
}

// ─── Registration Step ─────────────────────────────────────────────────────

function RegistrationStep({ data, setData, onNext, onBack }) {
  const fields = [
    { id: "first_name",       label: "First Name",       type: "text",     span: 1 },
    { id: "last_name",        label: "Last Name",        type: "text",     span: 1 },
    { id: "email",            label: "Email Address",    type: "email",    span: 2 },
    { id: "phone",            label: "Phone Number",     type: "tel",      span: 1 },
    { id: "password",         label: "Create Password",  type: "password", span: 1 },
    { id: "confirm_password", label: "Confirm Password", type: "password", span: 1 },
  ];
  const passwordsMatch = !data.password || !data.confirm_password || data.password === data.confirm_password;
  const isValid = fields.every(f => data[f.id]?.trim()) && passwordsMatch && data.terms;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", color: C.navy, marginBottom: "10px" }}>Create Your Client Account</h3>
        <p style={{ color: C.textSecondary, fontSize: "14px" }}>Set up your secure portal to save progress and receive real-time case updates.</p>
      </div>

      <div style={{ maxWidth: "580px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {fields.map(f => (
            <div key={f.id} style={{ gridColumn: `span ${f.span}` }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.6px" }}>{f.label}</label>
              <Field field={f} value={data[f.id]} onChange={v => setData(p => ({ ...p, [f.id]: v }))} />
            </div>
          ))}
        </div>

        {!passwordsMatch && (
          <p style={{ color: C.danger, fontSize: "12px", marginTop: "10px" }}>Passwords do not match.</p>
        )}

        <div style={{ marginTop: "18px", padding: "14px 16px", background: C.offWhite, borderRadius: "8px", border: `1px solid ${C.border}` }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={data.terms || false} onChange={e => setData(p => ({ ...p, terms: e.target.checked }))} style={{ marginTop: "3px" }} />
            <span style={{ fontSize: "13px", color: C.textSecondary, lineHeight: "1.6" }}>
              I agree to the <span style={{ color: C.gold, cursor: "pointer" }}>Terms of Service</span> and <span style={{ color: C.gold, cursor: "pointer" }}>Privacy Policy</span>. I understand my information will be kept strictly confidential under attorney-client privilege.
            </span>
          </label>
        </div>

        <NavButtons onBack={onBack} onNext={onNext} nextLabel="Create Account →" nextDisabled={!isValid} />
      </div>
    </div>
  );
}

// ─── Application Step ──────────────────────────────────────────────────────

function ApplicationStep({ form, data, setData, onNext, onBack }) {
  const fields = APP_FIELDS[form.id] || APP_FIELDS.default;
  const isValid = fields.filter(f => !f.optional).every(f => data[f.id]?.toString().trim());

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", color: C.navy, marginBottom: "10px" }}>
          {form.id} Application Information
        </h3>
        <p style={{ color: C.textSecondary, fontSize: "14px" }}>
          This information will be used to prepare your official {form.id} package. Please fill in all fields accurately.
        </p>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {fields.map(f => (
            <div key={f.id} style={{ gridColumn: `span ${f.span || 1}` }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.6px" }}>{f.label}</label>
              <Field field={f} value={data[f.id]} onChange={v => setData(p => ({ ...p, [f.id]: v }))} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", background: C.goldLight, borderRadius: "9px", padding: "14px 18px", border: `1px solid ${C.goldBorder}` }}>
          <p style={{ fontSize: "13px", color: "#7a5810", lineHeight: "1.6" }}>
            <strong>Attorney Review Included:</strong> A licensed immigration attorney will review all information before your application is filed. You will be contacted directly if any corrections or clarifications are needed.
          </p>
        </div>

        <NavButtons onBack={onBack} onNext={onNext} nextLabel="Review Application →" nextDisabled={!isValid} />
      </div>
    </div>
  );
}

// ─── Review Step ───────────────────────────────────────────────────────────

function ReviewStep({ form, registration, application, onBack, onSubmit, submitted }) {
  const SERVICE_FEE = 299;
  const total = form.fee + SERVICE_FEE;

  if (submitted) {
    const ref = `${form.id}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    return (
      <div style={{ textAlign: "center", padding: "48px 20px" }}>
        <div style={{ width: "76px", height: "76px", background: C.successLight, border: `2px solid ${C.successBorder}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: "30px", color: C.success }}>✓</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", color: C.navy, marginBottom: "14px" }}>Application Received</h3>
        <p style={{ color: C.textSecondary, fontSize: "15px", maxWidth: "420px", margin: "0 auto 28px", lineHeight: "1.7" }}>
          Thank you, {registration.first_name}. Your {form.id} application has been submitted. An attorney will review your materials within 1–2 business days and contact you via email.
        </p>
        <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: "12px", padding: "18px 32px", display: "inline-block", marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", color: "#7a5810", fontWeight: "700", letterSpacing: "0.8px", marginBottom: "6px", textTransform: "uppercase" }}>Case Reference Number</div>
          <div style={{ fontSize: "24px", fontFamily: "'Playfair Display', serif", color: C.navy, fontWeight: "700" }}>{ref}</div>
        </div>
        <p style={{ color: C.textMuted, fontSize: "13px" }}>A confirmation email has been sent to <strong>{registration.email}</strong></p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", color: C.navy, marginBottom: "10px" }}>Review & Submit</h3>
        <p style={{ color: C.textSecondary, fontSize: "14px" }}>Review your application details carefully before proceeding to payment.</p>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "22px 26px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "16px", borderBottom: `1px solid ${C.borderLight}` }}>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", color: C.navy }}>Application Summary</h4>
            <span style={{ background: C.navy, color: C.white, padding: "4px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>{form.id}</span>
          </div>
          <p style={{ fontWeight: "600", color: C.navy, marginBottom: "4px" }}>{form.name}</p>
          <p style={{ color: C.textSecondary, fontSize: "13px", lineHeight: "1.5" }}>{form.description}</p>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "22px 26px", marginBottom: "16px" }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", color: C.navy, marginBottom: "18px" }}>Applicant Information</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {Object.entries(application).slice(0, 8).filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: "10px", color: C.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{k.replace(/_/g, " ")}</div>
                <div style={{ fontSize: "14px", color: C.navy, fontWeight: "500" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "22px 26px", marginBottom: "16px" }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", color: C.navy, marginBottom: "18px" }}>Fee Summary</h4>
          {[["USCIS Government Filing Fee", form.fee], ["Attorney Service & Review Fee", SERVICE_FEE]].map(([label, amount]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.borderLight}` }}>
              <span style={{ fontSize: "14px", color: C.textSecondary }}>{label}</span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: C.navy }}>${amount.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 4px" }}>
            <span style={{ fontWeight: "700", color: C.navy, fontSize: "15px" }}>Total Due Today</span>
            <span style={{ fontWeight: "800", fontSize: "20px", color: C.navy }}>${total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "22px 26px", marginBottom: "24px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "700", color: C.navy, marginBottom: "16px" }}>Payment Information</h4>
          <div style={{ display: "grid", gap: "12px" }}>
            <input placeholder="Card Number" style={{ ...inputStyle }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <input placeholder="MM / YY" style={{ ...inputStyle }} />
              <input placeholder="CVV" style={{ ...inputStyle }} />
            </div>
            <input placeholder="Name on Card" style={{ ...inputStyle }} />
          </div>
          <p style={{ fontSize: "12px", color: C.textMuted, marginTop: "12px" }}>
            🔒 Payments encrypted and processed securely via Stripe.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={onBack} style={{ background: "transparent", color: C.textSecondary, border: `1px solid ${C.border}`, padding: "12px 26px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ← Back
          </button>
          <button onClick={onSubmit} style={{
            background: C.navy, color: C.white, border: "none",
            padding: "14px 28px", borderRadius: "8px", fontSize: "14px",
            fontWeight: "700", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.navyMid}
            onMouseLeave={e => e.currentTarget.style.background = C.navy}>
            Submit & Pay ${total.toLocaleString()} →
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Pricing Selection ──────────────────────────────────────────────────────

const DIY_FEATURES = [
  "Official USCIS form package (PDF)",
  "Step-by-step filing instructions",
  "Document checklist",
  "Mailing address guide by state",
  "Eligibility information",
  "Cover letter template",
  "Filing fee guidance",
  "Email support for general questions",
];

const ONLINE_FEATURES = [
  "Everything in the DIY Kit",
  "Guided online application (question by question)",
  "Attorney review of your completed form",
  "Auto-filled official USCIS PDF",
  "Direct attorney communication",
  "USCIS submission on your behalf",
  "Case status monitoring",
  "Dedicated case manager",
];

function PricingSelection({ form, onSelectDIY, onSelectOnline, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(13,36,68,0.75)", display: "flex",
      alignItems: "flex-start", justifyContent: "center",
      padding: "40px 20px 60px", overflowY: "auto",
    }}>
      <div style={{ background: C.white, borderRadius: "18px", width: "100%", maxWidth: "820px", padding: "48px", position: "relative" }}>
        
        <button onClick={onClose} style={{
          position: "absolute", top: "18px", right: "18px",
          background: C.offWhite, border: `1px solid ${C.border}`,
          borderRadius: "50%", width: "36px", height: "36px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: "18px", color: C.textSecondary,
          fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1,
        }}>×</button>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: C.gold, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "10px" }}>
            {form.id} — {form.name}
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: C.navy, marginBottom: "12px" }}>
            Choose How You'd Like to File
          </h2>
          <p style={{ color: C.textSecondary, fontSize: "15px", maxWidth: "460px", margin: "0 auto", lineHeight: "1.65" }}>
            Both options get you the official USCIS form. Choose what level of support works best for you.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          {/* DIY Kit */}
          <div style={{
            border: `1.5px solid ${C.border}`, borderRadius: "14px",
            padding: "32px 28px", display: "flex", flexDirection: "column",
          }}>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                Do It Yourself
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", fontWeight: "700", color: C.navy, lineHeight: "1" }}>
                $150
              </div>
              <div style={{ color: C.textMuted, fontSize: "12px", marginTop: "6px" }}>One-time kit purchase</div>
            </div>

            <div style={{ flex: 1, marginBottom: "28px" }}>
              {DIY_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: C.borderLight, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px", fontSize: "10px", color: C.textSecondary, fontWeight: "700" }}>✓</div>
                  <span style={{ fontSize: "13px", color: C.textSecondary, lineHeight: "1.5" }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={onSelectDIY} style={{
              background: C.white, color: C.navy,
              border: `2px solid ${C.navy}`,
              padding: "13px 20px", borderRadius: "8px", fontSize: "14px",
              fontWeight: "700", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              width: "100%", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.navy; }}>
              Get the DIY Kit →
            </button>
          </div>

          {/* File Online */}
          <div style={{
            border: `2px solid ${C.gold}`, borderRadius: "14px",
            padding: "32px 28px", display: "flex", flexDirection: "column",
            position: "relative", background: C.goldLight,
          }}>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.gold, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                File Online with Attorney
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", fontWeight: "700", color: C.navy, lineHeight: "1" }}>
                $280
              </div>
              <div style={{ color: C.textMuted, fontSize: "12px", marginTop: "6px" }}>Attorney-assisted filing</div>
            </div>

            <div style={{ flex: 1, marginBottom: "28px" }}>
              {ONLINE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px", fontSize: "10px", color: C.white, fontWeight: "700" }}>✓</div>
                  <span style={{ fontSize: "13px", color: C.navy, lineHeight: "1.5", fontWeight: i === 0 ? "400" : "400" }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={onSelectOnline} style={{
              background: C.gold, color: C.white, border: "none",
              padding: "13px 20px", borderRadius: "8px", fontSize: "14px",
              fontWeight: "700", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              width: "100%", transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#b07d1e"}
              onMouseLeave={e => e.currentTarget.style.background = C.gold}>
              Start My Application →
            </button>
          </div>

        </div>

        <p style={{ textAlign: "center", color: C.textMuted, fontSize: "12px", marginTop: "22px", lineHeight: "1.6" }}>
          Government USCIS filing fees (${form.fee.toLocaleString()}) are separate and paid directly to USCIS. Both options include a refund if you are found ineligible.
        </p>
      </div>
    </div>
  );
}

// ─── Application Flow Modal ────────────────────────────────────────────────

function ApplicationFlow({ form, onClose }) {
  const [step,        setStep]        = useState(0);
  const [eligibility, setEligibility] = useState({});
  const [registration,setRegistration]= useState({});
  const [application, setApplication] = useState({});
  const [submitted,   setSubmitted]   = useState(false);

  if (form.id === "I-90") return <I90SmartForm onClose={onClose} />;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(13,36,68,0.72)", display: "flex",
      alignItems: "flex-start", justifyContent: "center",
      padding: "32px 20px 48px", overflowY: "auto",
    }}>
      <div style={{ background: C.white, borderRadius: "18px", width: "100%", maxWidth: "860px", padding: "44px 48px", position: "relative", minHeight: "540px" }}>
        <button onClick={onClose} style={{
          position: "absolute", top: "18px", right: "18px",
          background: C.offWhite, border: `1px solid ${C.border}`,
          borderRadius: "50%", width: "36px", height: "36px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: "18px", color: C.textSecondary,
          fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1,
        }}>×</button>

        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: C.gold, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px" }}>
            {form.id} — {form.category}
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: C.navy }}>
            {form.name}
          </h2>
        </div>

        {!submitted && <StepIndicator current={step} />}

        {step === 0 && <EligibilityStep form={form} answers={eligibility} setAnswers={setEligibility} onNext={() => setStep(1)} />}
        {step === 1 && <RegistrationStep data={registration} setData={setRegistration} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <ApplicationStep form={form} data={application} setData={setApplication} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <ReviewStep form={form} registration={registration} application={application} onBack={() => setStep(2)} onSubmit={() => setSubmitted(true)} submitted={submitted} />}
      </div>
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: C.navy, padding: "52px 2.5rem 32px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "40px", marginBottom: "44px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "14px" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "26px", color: C.white }}>Apply</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "26px", color: C.gold }}>US</span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.8", maxWidth: "260px" }}>
              Providing expert immigration legal services to individuals and families across the United States since 2000.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              {["f", "in", "tw"].map(s => (
                <div key={s} style={{ width: "32px", height: "32px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "600" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          {[
            ["Services", ["Green Card", "Citizenship", "Work Authorization", "Family Petitions", "Visa Changes"]],
            ["Resources", ["FAQ", "Blog", "USCIS Case Status", "Form Finder", "Glossary"]],
            ["Firm", ["About Us", "Schedule Consultation", "Client Portal", "Privacy Policy", "Terms of Service"]],
          ].map(([title, links]) => (
            <div key={title}>
              <div style={{ color: C.white, fontWeight: "700", fontSize: "12px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</div>
              {links.map(l => (
                <a key={l} href="#" style={{ display: "block", color: "rgba(255,255,255,0.45)", fontSize: "13px", marginBottom: "10px", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.8)"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}>
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "22px", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
          <span>© 2025 ApplyUS. All rights reserved.</span>
          <span>Attorney advertising. Prior results do not guarantee similar outcomes.</span>
        </div>
      </div>
    </footer>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

function NavbarWithRouter({ onConsult }) {
  const navigate = useNavigate();
  return <Navbar onConsult={onConsult} onSignIn={() => navigate("/login")} />;
}

export default function App() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = "* { box-sizing: border-box; margin: 0; padding: 0; } body { margin: 0; background: #fafaf8; }";
    document.head.appendChild(style);
  }, []);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <NavbarWithRouter onConsult={() => alert("Consultation scheduling — connect your calendar here.")} />
      <Hero onGetStarted={() => document.getElementById("forms")?.scrollIntoView({ behavior: "smooth" })} />
      <div id="forms">
        <FormsSection />
      </div>
      <WhyUs />
      <Footer />
    </div>
  );
}
