import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import ImmigrationPortal from "./immigration-portal";
import PricingPage from "./PricingPage";
import DIYKitPage from "./DIYKitPage";
import LoginPage from "./LoginPage";
import I90SmartForm from "./I90SmartForm";

function FormRoute() {
  const { formId } = useParams();
  const navigate = useNavigate();

  if (formId === "I-90") {
    return <I90SmartForm onClose={() => navigate("/")} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fafaf8" }}>
      <div style={{ textAlign: "center", padding: "48px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#0d2444", marginBottom: "14px" }}>Online filing for {formId} is coming soon.</div>
        <button onClick={() => navigate("/")} style={{ padding: "12px 28px", background: "#0d2444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", fontWeight: "600" }}>
          ← Back to ApplyUS
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ImmigrationPortal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/apply/:formId" element={<PricingPage />} />
        <Route path="/apply/:formId/diy" element={<DIYKitPage />} />
        <Route path="/apply/:formId/start" element={<FormRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
