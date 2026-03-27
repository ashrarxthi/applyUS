import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const SQUARE_APP_ID      = import.meta.env.VITE_SQUARE_APP_ID;
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID;

const FORMS = {
  "I-90":  { name: "Green Card Renewal / Replacement",  kit: "I90_DIY_Kit_ApplyUS.pdf"  },
  "N-400": { name: "U.S. Citizenship (Naturalization)", kit: "N400_DIY_Kit_ApplyUS.pdf" },
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

function FocusInput({ label, placeholder, value, onChange, type = "text", hint, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
        {label}
      </label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "12px 16px", fontSize: "14px",
          border: `1.5px solid ${error ? C.danger : focused ? C.navy : C.border}`,
          borderRadius: "8px", outline: "none",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: C.navy, background: C.white,
          transition: "border-color 0.15s", boxSizing: "border-box",
        }}
      />
      {hint  && <p style={{ color: C.textMuted, fontSize: "11px", marginTop: "4px" }}>{hint}</p>}
      {error && <p style={{ color: C.danger,    fontSize: "11px", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

export default function DIYKitPage() {
  const { formId } = useParams();
  const navigate   = useNavigate();
  const form       = FORMS[formId];

  const [screen,   setScreen]   = useState("checkout");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [sqReady,  setSqReady]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [sqError,  setSqError]  = useState("");

  const cardRef = useRef(null);

  // Load Square Web SDK and initialize card form
  useEffect(() => {
    if (!document.querySelector("#applyus-fonts")) {
      const l = document.createElement("link"); l.id = "applyus-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    window.scrollTo(0, 0);

    // Load Square SDK
    const existing = document.querySelector("#square-sdk");
    if (existing) { initSquare(); return; }

    const script = document.createElement("script");
    script.id  = "square-sdk";
    script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
    script.onload = initSquare;
    document.head.appendChild(script);

    return () => {
      if (cardRef.current) {
        cardRef.current.destroy().catch(() => {});
        cardRef.current = null;
      }
    };
  }, []);

  const initSquare = async () => {
    try {
      if (!window.Square) { setSqError("Square SDK failed to load. Please refresh."); return; }

      const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
      const card     = await payments.card({
        style: {
          ".input-container": { borderRadius: "8px", borderColor: "#e5dfd6" },
          ".input-container.is-focus": { borderColor: "#0d2444" },
          ".input-container.is-error": { borderColor: "#dc2626" },
          input: { fontSize: "14px", color: "#0d2444" },
          "input::placeholder": { color: "#9aa5b8" },
        },
      });
      await card.attach("#square-card-container");
      cardRef.current = card;
      setSqReady(true);
    } catch (err) {
      setSqError("Failed to initialize payment form. Please refresh and try again.");
      console.error(err);
    }
  };

  const validate = () => {
    const e = {};
    if (!name.trim())  e.name = "Name is required";
    if (!email.trim() || !email.includes("@")) e.email = "Valid email required";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (!agreed) e.agreed = "You must agree to the terms to continue";
    return e;
  };

  const handlePurchase = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (!sqReady || !cardRef.current) { setSqError("Payment form not ready. Please wait a moment and try again."); return; }

    setErrors({});
    setSqError("");
    setLoading(true);

    try {
      // Tokenize the card with Square
      const result = await cardRef.current.tokenize();

      if (result.status !== "OK") {
        const msg = result.errors?.[0]?.message || "Card details are invalid. Please check and try again.";
        setSqError(msg);
        setLoading(false);
        return;
      }

      // Send token to our serverless function
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          amount: 15000, // $150.00 in cents
          email,
          name,
          formId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSqError(data.error || "Payment failed. Please try again.");
        setLoading(false);
        return;
      }

      // Save account to localStorage
      const accounts = JSON.parse(localStorage.getItem("applyus_accounts") || "{}");
      accounts[email] = { name, password, purchases: [formId] };
      localStorage.setItem("applyus_accounts", JSON.stringify(accounts));
      localStorage.setItem("applyus_user", JSON.stringify({ email, name }));

      setLoading(false);
      setScreen("success");

    } catch (err) {
      setSqError("Something went wrong. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href     = `/${form.kit}`;
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
          <button onClick={() => navigate(`/apply/${formId}`)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.65)", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.white }}>Apply</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.gold, marginLeft: "-8px" }}>US</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>Secure checkout</span>
        </div>
      </nav>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "56px 2rem 80px" }}>

        {screen === "checkout" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.gold, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>DIY Kit — {formId}</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: C.navy, marginBottom: "10px" }}>{form.name}</h1>
              <p style={{ color: C.textSecondary, fontSize: "14px", lineHeight: "1.65" }}>Complete your purchase to instantly download your kit and receive a copy by email.</p>
            </div>

            {/* Order summary */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px 24px", marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "14px" }}>Order Summary</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: `1px solid ${C.borderLight}`, marginBottom: "12px" }}>
                <div>
                  <div style={{ fontWeight: "600", color: C.navy, fontSize: "14px" }}>{formId} DIY Filing Kit</div>
                  <div style={{ color: C.textMuted, fontSize: "12px", marginTop: "3px" }}>PDF download + email delivery</div>
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: "700", color: C.navy }}>$150</div>
              </div>
              {["Step-by-step filing instructions", "Complete document checklist", "Cover letter template", "Mailing address guide by state"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: C.successLight, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: C.success, fontWeight: "700", flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: "12px", color: C.textSecondary }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Your Info */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "28px 24px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "20px" }}>Your Information</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <FocusInput label="Full Name" placeholder="Your full name" value={name} onChange={setName} error={errors.name} />
                <FocusInput label="Email Address" placeholder="you@email.com" value={email} onChange={setEmail} type="email" hint="Your kit will be emailed here after purchase." error={errors.email} />
                <FocusInput label="Create Password" placeholder="Min. 6 characters" value={password} onChange={setPassword} type="password" hint="This creates your ApplyUS account so you can access your kit anytime." error={errors.password} />
              </div>
            </div>

            {/* Payment */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "28px 24px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "20px" }}>Payment Details</div>

              {/* Square card form mounts here */}
              <div id="square-card-container" style={{ marginBottom: "16px", minHeight: "90px" }} />

              {!sqReady && !sqError && (
                <p style={{ fontSize: "12px", color: C.textMuted, textAlign: "center", marginBottom: "12px" }}>Loading secure payment form…</p>
              )}
              {sqError &&!sqReady &&(
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                  <p style={{ color: C.danger, fontSize: "13px" }}>{sqError}</p>
                </div>
              )}

              <p style={{ fontSize: "11px", color: C.textMuted, display: "flex", alignItems: "center", gap: "6px" }}>
                🔒 Payments processed securely by Square. ApplyUS never stores your card details.
              </p>
            </div>

            {/* Terms */}
            <div style={{ background: C.white, border: `1px solid ${errors.agreed ? C.danger : C.border}`, borderRadius: "10px", padding: "16px 20px", marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: "3px", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: C.textSecondary, lineHeight: "1.65" }}>
                  I understand that this is a <strong>document preparation kit</strong> and does not constitute legal advice or attorney representation. ApplyUS is not responsible for USCIS decisions. I agree to the <span style={{ color: C.gold, cursor: "pointer" }}>Terms of Service</span> and <span style={{ color: C.gold, cursor: "pointer" }}>Privacy Policy</span>.
                </span>
              </label>
              {errors.agreed && <p style={{ color: C.danger, fontSize: "11px", marginTop: "8px" }}>{errors.agreed}</p>}
            </div>

            <button onClick={handlePurchase} disabled={loading || !sqReady} style={{
              width: "100%", padding: "15px", borderRadius: "9px", border: "none",
              background: loading || !sqReady ? C.border : C.navy,
              color: loading || !sqReady ? C.textMuted : C.white,
              fontSize: "15px", fontWeight: "700",
              cursor: loading || !sqReady ? "not-allowed" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
            }}>
              {loading ? "Processing payment…" : "Purchase Kit — $150"}
            </button>

            <p style={{ textAlign: "center", fontSize: "11px", color: C.textMuted, marginTop: "12px", lineHeight: "1.6" }}>
              Refund available if you are found ineligible to file.
            </p>
          </>
        )}

        {screen === "success" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: C.successLight, border: `2px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: "34px" }}>✓</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", color: C.navy, marginBottom: "14px" }}>You're all set!</h2>
            <p style={{ color: C.textSecondary, fontSize: "15px", lineHeight: "1.75", marginBottom: "36px", maxWidth: "400px", margin: "0 auto 36px" }}>
              Your {formId} DIY Kit is ready. Download it below — we've also sent a copy to <strong style={{ color: C.navy }}>{email}</strong>.
            </p>

            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "28px", marginBottom: "16px" }}>
              <div style={{ fontSize: "40px", marginBottom: "14px" }}>📄</div>
              <div style={{ fontWeight: "700", color: C.navy, fontSize: "16px", marginBottom: "6px" }}>{formId} DIY Filing Kit</div>
              <div style={{ color: C.textMuted, fontSize: "13px", marginBottom: "22px" }}>PDF · Instructions, checklist, cover letter, and mailing guide</div>
              <button onClick={handleDownload} style={{
                width: "100%", padding: "14px", borderRadius: "9px", border: "none",
                background: C.navy, color: C.white, fontSize: "15px", fontWeight: "700",
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.navyMid}
                onMouseLeave={e => e.currentTarget.style.background = C.navy}>
                ⬇ Download My Kit
              </button>
            </div>

            <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: "10px", padding: "16px 20px", marginBottom: "24px" }}>
              <p style={{ fontSize: "13px", color: "#7a5810", lineHeight: "1.65" }}>
                <strong>Check your inbox.</strong> A copy has been sent to {email}. Check spam if you don't see it within a few minutes.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => navigate(`/apply/${formId}/start`)} style={{
                background: "transparent", color: C.navy, border: `1.5px solid ${C.border}`,
                padding: "12px 24px", borderRadius: "8px", fontSize: "14px",
                fontWeight: "600", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                Upgrade to Attorney Filing — Credit $150 →
              </button>
              <button onClick={() => navigate("/")} style={{
                background: "transparent", color: C.textSecondary, border: "none",
                padding: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
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
