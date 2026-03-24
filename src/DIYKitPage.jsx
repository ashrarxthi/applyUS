import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const FORMS = {
  "I-90":  { name: "Green Card Renewal / Replacement",   kit: "I90_DIY_Kit_ApplyUS.pdf" },
  "N-400": { name: "U.S. Citizenship (Naturalization)",  kit: "N400_DIY_Kit_ApplyUS.pdf" },
};

const C = {
  navy: "#0d2444", navyMid: "#1e3d6e", gold: "#c8942a",
  goldLight: "#fdf3e3", goldBorder: "#e8d5a0",
  white: "#ffffff", offWhite: "#fafaf8",
  border: "#e5dfd6", borderLight: "#f0ece6",
  textSecondary: "#5a6478", textMuted: "#9aa5b8",
  success: "#2d7a4f", successLight: "#e6f4ec", successBorder: "#a7d7bc",
  danger: "#dc2626",
};

function inputStyle(focused) {
  return {
    width: "100%", padding: "12px 16px", fontSize: "14px",
    border: `1.5px solid ${focused ? C.navy : C.border}`,
    borderRadius: "8px", outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: C.navy, background: C.white,
    transition: "border-color 0.15s", boxSizing: "border-box",
  };
}

function FocusInput({ placeholder, value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={inputStyle(focused)}
    />
  );
}

export default function DIYKitPage() {
  const { formId } = useParams();
  const navigate   = useNavigate();
  const form       = FORMS[formId];

  const [screen,   setScreen]   = useState("checkout"); // checkout | success
  const [email,    setEmail]    = useState("");
  const [name,     setName]     = useState("");
  const [card,     setCard]     = useState("");
  const [expiry,   setExpiry]   = useState("");
  const [cvv,      setCvv]      = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (!document.querySelector("#applyus-fonts")) {
      const l = document.createElement("link");
      l.id = "applyus-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    window.scrollTo(0, 0);
  }, []);

  // Auto-format card number
  const handleCard = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCard(formatted);
  };

  // Auto-format expiry
  const handleExpiry = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) setExpiry(digits.slice(0, 2) + " / " + digits.slice(2));
    else setExpiry(digits);
  };

  const validate = () => {
    const e = {};
    if (!name.trim())    e.name   = "Name is required";
    if (!email.trim() || !email.includes("@")) e.email = "Valid email required";
    if (password.length < 6)                    e.password = "Password must be at least 6 characters";
    if (card.replace(/\s/g,"").length < 16)    e.card  = "Enter a valid 16-digit card number";
    if (!expiry.includes("/"))                  e.expiry= "Enter expiry as MM / YY";
    if (cvv.length < 3)                         e.cvv   = "Enter a valid CVV";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      // Save account to localStorage
      const accounts = JSON.parse(localStorage.getItem("applyus_accounts") || "{}");
      accounts[email] = { name, password, purchases: [formId] };
      localStorage.setItem("applyus_accounts", JSON.stringify(accounts));
      localStorage.setItem("applyus_user", JSON.stringify({ email, name }));
      setLoading(false);
      setScreen("success");
    }, 2000);
  };

  const handleDownload = () => {
    // In production this would be a signed URL from your backend/storage
    const link = document.createElement("a");
    link.href  = `/${form.kit}`;
    link.download = form.kit;
    link.click();
  };

  if (!form) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: C.textSecondary, marginBottom: "20px" }}>Kit not found.</p>
        <button onClick={() => navigate("/")} style={{ padding: "12px 24px", background: C.navy, color: C.white, border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.offWhite, minHeight: "100vh" }}>

      {/* Navbar */}
      <nav style={{ background: C.navy, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(`/apply/${formId}`)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.65)", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
            ← Back
          </button>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.white }}>Apply</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.gold, marginLeft: "-8px" }}>US</span>
        </div>
      </nav>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "56px 2rem 80px" }}>

        {screen === "checkout" && (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.gold, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
                DIY Kit — {formId}
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: C.navy, marginBottom: "10px" }}>
                {form.name}
              </h1>
              <p style={{ color: C.textSecondary, fontSize: "14px", lineHeight: "1.65" }}>
                Complete your purchase to instantly download your kit and receive a copy by email.
              </p>
            </div>

            {/* Order summary */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px 24px", marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "14px" }}>
                Order Summary
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: `1px solid ${C.borderLight}`, marginBottom: "12px" }}>
                <div>
                  <div style={{ fontWeight: "600", color: C.navy, fontSize: "14px" }}>{formId} DIY Filing Kit</div>
                  <div style={{ color: C.textMuted, fontSize: "12px", marginTop: "3px" }}>PDF download + email delivery</div>
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "700", color: C.navy }}>$150</div>
              </div>
              {[
                "Step-by-step filing instructions",
                "Document checklist",
                "Cover letter template",
                "Mailing address guide",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: C.successLight, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: C.success, fontWeight: "700", flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: "12px", color: C.textSecondary }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Checkout form */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "28px 24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "20px" }}>
                Your Information
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Full Name</label>
                  <FocusInput placeholder="Your full name" value={name} onChange={setName} />
                  {errors.name && <p style={{ color: C.danger, fontSize: "11px", marginTop: "4px" }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Email Address</label>
                  <FocusInput placeholder="you@email.com" value={email} onChange={setEmail} type="email" />
                  {errors.email && <p style={{ color: C.danger, fontSize: "11px", marginTop: "4px" }}>{errors.email}</p>}
                  <p style={{ fontSize: "11px", color: C.textMuted, marginTop: "5px" }}>Your kit will be emailed here after purchase.</p>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Create Password</label>
                  <FocusInput placeholder="Min. 6 characters" value={password} onChange={setPassword} type="password" />
                  {errors.password && <p style={{ color: C.danger, fontSize: "11px", marginTop: "4px" }}>{errors.password}</p>}
                  <p style={{ fontSize: "11px", color: C.textMuted, marginTop: "5px" }}>This creates your ApplyUS account so you can access your kit anytime.</p>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: "20px", marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "16px" }}>
                  Payment Details
                </div>
                <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#7a5810" }}>🔒 Payments are encrypted and processed securely. Stripe integration coming soon — no charge will be made.</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Card Number</label>
                    <FocusInput placeholder="1234 5678 9012 3456" value={card} onChange={handleCard} />
                    {errors.card && <p style={{ color: C.danger, fontSize: "11px", marginTop: "4px" }}>{errors.card}</p>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Expiry</label>
                      <FocusInput placeholder="MM / YY" value={expiry} onChange={handleExpiry} />
                      {errors.expiry && <p style={{ color: C.danger, fontSize: "11px", marginTop: "4px" }}>{errors.expiry}</p>}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>CVV</label>
                      <FocusInput placeholder="123" value={cvv} onChange={v => setCvv(v.replace(/\D/g,"").slice(0,4))} />
                      {errors.cvv && <p style={{ color: C.danger, fontSize: "11px", marginTop: "4px" }}>{errors.cvv}</p>}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Name on Card</label>
                    <FocusInput placeholder="As it appears on your card" value={name} onChange={setName} />
                  </div>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading} style={{
                width: "100%", padding: "15px", borderRadius: "9px",
                border: "none", background: loading ? C.border : C.navy,
                color: loading ? C.textMuted : C.white, fontSize: "15px",
                fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.15s",
              }}>
                {loading ? "Processing…" : "Purchase Kit — $150"}
              </button>

              <p style={{ textAlign: "center", fontSize: "11px", color: C.textMuted, marginTop: "12px", lineHeight: "1.6" }}>
                By purchasing you agree to our Terms of Service. Refunds available if ineligible to file.
              </p>
            </div>
          </>
        )}

        {screen === "success" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: C.successLight, border: `2px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: "34px" }}>✓</div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", color: C.navy, marginBottom: "14px" }}>
              You're all set!
            </h2>
            <p style={{ color: C.textSecondary, fontSize: "15px", lineHeight: "1.75", marginBottom: "36px", maxWidth: "400px", margin: "0 auto 36px" }}>
              Your {formId} DIY Kit is ready. Download it below — we've also sent a copy to <strong style={{ color: C.navy }}>{email}</strong>.
            </p>

            {/* Download card */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "28px", marginBottom: "16px" }}>
              <div style={{ fontSize: "40px", marginBottom: "14px" }}>📄</div>
              <div style={{ fontWeight: "700", color: C.navy, fontSize: "16px", marginBottom: "6px" }}>{formId} DIY Filing Kit</div>
              <div style={{ color: C.textMuted, fontSize: "13px", marginBottom: "22px" }}>PDF · Includes instructions, checklist, cover letter, and mailing guide</div>
              <button onClick={handleDownload} style={{
                width: "100%", padding: "14px", borderRadius: "9px",
                border: "none", background: C.navy, color: C.white,
                fontSize: "15px", fontWeight: "700", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.navyMid}
                onMouseLeave={e => e.currentTarget.style.background = C.navy}>
                ⬇ Download My Kit
              </button>
            </div>

            <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: "10px", padding: "16px 20px", marginBottom: "24px" }}>
              <p style={{ fontSize: "13px", color: "#7a5810", lineHeight: "1.65" }}>
                <strong>Check your inbox.</strong> A copy of your kit has been sent to {email}. Check your spam folder if you don't see it within a few minutes.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "13px", color: C.textSecondary, lineHeight: "1.6" }}>
                Changed your mind? You can upgrade to attorney-assisted filing at any time — we'll credit your $150 toward the $280 fee.
              </p>
              <button onClick={() => navigate(`/apply/${formId}/start`)} style={{
                background: "transparent", color: C.navy, border: `1.5px solid ${C.border}`,
                padding: "12px 24px", borderRadius: "8px", fontSize: "14px",
                fontWeight: "600", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                Upgrade to Attorney Filing Instead →
              </button>
              <button onClick={() => navigate("/")} style={{
                background: "transparent", color: C.textSecondary, border: "none",
                padding: "10px", fontSize: "13px", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                ← Back to ApplyUS
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
