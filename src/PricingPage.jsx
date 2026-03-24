import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const FORMS = [
  { id: "I-90",   name: "Green Card Renewal / Replacement",        fee: 540  },
  { id: "N-400",  name: "U.S. Citizenship (Naturalization)",        fee: 725  },
  { id: "I-821D", name: "Deferred Action Renewal (DACA)",           fee: 495  },
  { id: "I-130",  name: "Sponsor Your Relative for a Green Card",   fee: 535  },
  { id: "N-565",  name: "Replace Naturalization / Citizenship Doc", fee: 555  },
  { id: "I-765",  name: "Employment Authorization",                 fee: 410  },
  { id: "I-824",  name: "Action on Approved Application/Petition",  fee: 465  },
  { id: "I-751",  name: "Petition to Remove Conditions",            fee: 595  },
  { id: "I-131",  name: "Travel Document Application",              fee: 575  },
  { id: "I-485",  name: "Register Permanent Residence",             fee: 1440 },
  { id: "I-129F", name: "Petition for Alien Fiancé(e)",             fee: 535  },
  { id: "N-600",  name: "Certificate of Citizenship Application",   fee: 1170 },
  { id: "I-539",  name: "Change or Extend Nonimmigrant Status",     fee: 370  },
];

const DIY_FEATURES = [
  "Official USCIS form (PDF download)",
  "Step-by-step filing instructions",
  "Complete document checklist",
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
  "Dedicated case manager assigned to you",
];

const C = {
  navy: "#0d2444", navyMid: "#1e3d6e", gold: "#c8942a",
  goldLight: "#fdf3e3", goldBorder: "#e8d5a0",
  white: "#ffffff", offWhite: "#fafaf8",
  border: "#e5dfd6", borderLight: "#f0ece6",
  textSecondary: "#5a6478", textMuted: "#9aa5b8",
};

export default function PricingPage() {
  const { formId } = useParams();
  const navigate   = useNavigate();
  const form       = FORMS.find(f => f.id === formId);

  useEffect(() => {
    if (!document.querySelector("#applyus-fonts")) {
      const l = document.createElement("link");
      l.id = "applyus-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    window.scrollTo(0, 0);
  }, []);

  if (!form) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.textSecondary, marginBottom: "20px" }}>Form not found.</p>
          <button onClick={() => navigate("/")} style={{ padding: "12px 24px", background: C.navy, color: C.white, border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.offWhite, minHeight: "100vh" }}>

      {/* Navbar */}
      <nav style={{ background: C.navy, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.65)", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
            ← Back
          </button>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.white }}>Apply</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.gold, marginLeft: "-8px" }}>US</span>
        </div>
        <button style={{ background: C.gold, color: C.white, border: "none", padding: "9px 20px", borderRadius: "7px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
          Free Consultation
        </button>
      </nav>

      {/* Header */}
      <div style={{ background: C.navy, padding: "60px 2.5rem 72px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: C.gold, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "12px" }}>
          {form.id}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "600", color: C.white, marginBottom: "16px", lineHeight: "1.15" }}>
          {form.name}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", maxWidth: "480px", margin: "0 auto" }}>
          Choose the level of support that works best for your situation. Both options use the official USCIS form.
        </p>
      </div>

      {/* Pricing cards */}
      <div style={{ maxWidth: "940px", margin: "-40px auto 0", padding: "0 2.5rem 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>

          {/* DIY Kit */}
          <div style={{ background: C.white, borderRadius: "16px", border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "36px 36px 28px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "12px" }}>
                Do It Yourself
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "48px", fontWeight: "700", color: C.navy, lineHeight: "1" }}>$150</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: "13px", marginBottom: "28px" }}>
                One-time kit download
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {DIY_FEATURES.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: C.borderLight, border: `1.5px solid ${C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px", fontSize: "10px",
                      color: C.textSecondary, fontWeight: "700",
                    }}>✓</div>
                    <span style={{ fontSize: "14px", color: C.textSecondary, lineHeight: "1.5" }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => alert("DIY Kit purchase — Stripe coming soon!")}
                style={{
                  width: "100%", padding: "14px", borderRadius: "9px",
                  border: `2px solid ${C.navy}`, background: C.white,
                  color: C.navy, fontSize: "15px", fontWeight: "700",
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = C.white; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.navy; }}
              >
                Get the DIY Kit →
              </button>
            </div>

            <div style={{ background: C.offWhite, borderTop: `1px solid ${C.borderLight}`, padding: "14px 36px" }}>
              <p style={{ fontSize: "12px", color: C.textMuted, lineHeight: "1.6" }}>
                Best for: people comfortable filing paperwork independently and looking to save on service fees.
              </p>
            </div>
          </div>

          {/* File Online */}
          <div style={{ background: C.white, borderRadius: "16px", border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "36px 36px 28px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "12px" }}>
                File Online with Attorney
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "48px", fontWeight: "700", color: C.navy, lineHeight: "1" }}>$280</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: "13px", marginBottom: "28px" }}>
                Full attorney-assisted filing
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {ONLINE_FEATURES.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: C.borderLight, border: `1.5px solid ${C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px", fontSize: "10px",
                      color: C.textSecondary, fontWeight: "700",
                    }}>✓</div>
                    <span style={{ fontSize: "14px", color: C.textSecondary, lineHeight: "1.5" }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate(`/apply/${formId}/start`)}
                style={{
                  width: "100%", padding: "14px", borderRadius: "9px",
                  border: `2px solid ${C.navy}`, background: C.white,
                  color: C.navy, fontSize: "15px", fontWeight: "700",
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = C.white; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.navy; }}
              >
                Start My Application →
              </button>
            </div>

            <div style={{ background: C.offWhite, borderTop: `1px solid ${C.borderLight}`, padding: "14px 36px" }}>
              <p style={{ fontSize: "12px", color: C.textMuted, lineHeight: "1.6" }}>
                Best for: people who want peace of mind that a licensed attorney has reviewed and filed their application.
              </p>
            </div>
          </div>

        </div>

        {/* Gov fee disclaimer */}
        <div style={{ marginTop: "28px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px 24px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: C.borderLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px", color: C.textSecondary, fontWeight: "700", marginTop: "1px" }}>i</div>
          <p style={{ fontSize: "13px", color: C.textSecondary, lineHeight: "1.65" }}>
            <strong style={{ color: C.navy }}>Government filing fee not included.</strong> USCIS charges a separate filing fee of ${form.fee.toLocaleString()} for Form {form.id}, paid directly to the U.S. Department of Homeland Security. This fee is required regardless of which service option you choose and is not refundable by USCIS.
          </p>
        </div>

        {/* FAQ strip */}
        <div style={{ marginTop: "48px" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: C.navy, textAlign: "center", marginBottom: "28px" }}>
            Common Questions
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              ["Can I switch from DIY to attorney-assisted?", "Yes — if you purchase the DIY kit and later want attorney assistance, we'll credit your $150 toward the $280 online filing fee."],
              ["What if I'm found ineligible?", "If you begin the process and are found ineligible before filing, we'll issue a full refund of our service fee. Government fees paid to USCIS are non-refundable."],
              ["How long does the attorney review take?", "Attorney review typically takes 1–2 business days. You'll receive a confirmation email once your application is reviewed and ready to file."],
              ["Is my information kept confidential?", "Yes. All information shared with ApplyUS is protected under attorney-client privilege and our strict privacy policy."],
            ].map(([q, a]) => (
              <div key={q} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "20px 22px" }}>
                <div style={{ fontWeight: "600", color: C.navy, fontSize: "14px", marginBottom: "8px", lineHeight: "1.4" }}>{q}</div>
                <div style={{ color: C.textSecondary, fontSize: "13px", lineHeight: "1.6" }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
