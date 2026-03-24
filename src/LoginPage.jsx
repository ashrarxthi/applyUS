import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const C = {
  navy: "#0d2444", navyMid: "#1e3d6e", gold: "#c8942a",
  goldLight: "#fdf3e3", goldBorder: "#e8d5a0",
  white: "#ffffff", offWhite: "#fafaf8",
  border: "#e5dfd6", borderLight: "#f0ece6",
  textSecondary: "#5a6478", textMuted: "#9aa5b8",
  danger: "#dc2626", dangerLight: "#fef2f2",
};

function FocusInput({ label, placeholder, value, onChange, type = "text", error }) {
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
      {error && <p style={{ color: C.danger, fontSize: "11px", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [tab,     setTab]     = useState("signin"); // signin | create
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [notice,  setNotice]  = useState("");

  const from = location.state?.from || "/";

  useEffect(() => {
    if (!document.querySelector("#applyus-fonts")) {
      const l = document.createElement("link"); l.id = "applyus-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    // If already logged in, redirect
    const user = localStorage.getItem("applyus_user");
    if (user) navigate(from, { replace: true });
  }, []);

  const handleSignIn = () => {
    const e = {};
    if (!email.trim() || !email.includes("@")) e.email = "Enter a valid email address";
    if (!password.trim()) e.password = "Password is required";
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setErrors({});
    setLoading(true);

    // Check localStorage for account
    const accounts = JSON.parse(localStorage.getItem("applyus_accounts") || "{}");
    setTimeout(() => {
      setLoading(false);
      if (accounts[email] && accounts[email].password === password) {
        localStorage.setItem("applyus_user", JSON.stringify({ email, name: accounts[email].name }));
        navigate(from, { replace: true });
      } else if (accounts[email]) {
        setErrors({ password: "Incorrect password" });
      } else {
        setErrors({ email: "No account found with this email. Accounts are created when you purchase a kit or file online." });
      }
    }, 800);
  };

  const handleCreateTab = () => {
    setTab("create");
    setNotice("");
    setErrors({});
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.offWhite, minHeight: "100vh" }}>

      {/* Navbar */}
      <nav style={{ background: C.navy, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.65)", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.white }}>Apply</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.gold, marginLeft: "-8px" }}>US</span>
        </div>
      </nav>

      <div style={{ maxWidth: "440px", margin: "0 auto", padding: "64px 2rem 80px" }}>

        {/* Logo mark */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px", color: C.gold }}>A</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", color: C.navy, marginBottom: "8px" }}>
            {tab === "signin" ? "Welcome back" : "Create an Account"}
          </h1>
          <p style={{ color: C.textSecondary, fontSize: "14px", lineHeight: "1.6" }}>
            {tab === "signin"
              ? "Sign in to access your purchased kits and filed applications."
              : "ApplyUS accounts are created automatically when you purchase a kit or start an application."
            }
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "4px", marginBottom: "24px" }}>
          {[["signin", "Sign In"], ["create", "Create Account"]].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setErrors({}); }} style={{
              flex: 1, padding: "10px", borderRadius: "7px", border: "none",
              background: tab === id ? C.navy : "transparent",
              color: tab === id ? C.white : C.textSecondary,
              fontSize: "13px", fontWeight: "600", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
            }}>{label}</button>
          ))}
        </div>

        {tab === "signin" && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "32px 28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <FocusInput label="Email Address" placeholder="you@email.com" value={email} onChange={setEmail} type="email" error={errors.email} />
              <FocusInput label="Password" placeholder="Your password" value={password} onChange={setPassword} type="password" error={errors.password} />
            </div>

            <button onClick={handleSignIn} disabled={loading} style={{
              width: "100%", padding: "14px", borderRadius: "9px", border: "none",
              background: loading ? C.border : C.navy, color: loading ? C.textMuted : C.white,
              fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
            }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: C.textMuted, marginTop: "16px" }}>
              Don't have an account?{" "}
              <span onClick={handleCreateTab} style={{ color: C.gold, fontWeight: "600", cursor: "pointer" }}>
                Learn how to create one
              </span>
            </p>
          </div>
        )}

        {tab === "create" && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "20px" }}>🔐</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: C.navy, marginBottom: "12px" }}>
              No sign-up required
            </h3>
            <p style={{ color: C.textSecondary, fontSize: "14px", lineHeight: "1.7", marginBottom: "28px" }}>
              Your account is created automatically when you purchase a DIY kit or start an application. You'll set your password during checkout.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => navigate("/apply/I-90")} style={{
                width: "100%", padding: "13px", borderRadius: "9px", border: "none",
                background: C.navy, color: C.white, fontSize: "14px", fontWeight: "700",
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                Browse Available Forms →
              </button>
              <button onClick={() => setTab("signin")} style={{
                width: "100%", padding: "13px", borderRadius: "9px",
                border: `1.5px solid ${C.border}`, background: "transparent",
                color: C.textSecondary, fontSize: "14px", fontWeight: "500",
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                Already have an account? Sign In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
