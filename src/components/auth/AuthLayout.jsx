// =======================================================
// File: AuthLayout.jsx
// Purpose: Common Layout for Authentication Pages
// =======================================================

export default function AuthLayout({ title, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
      >
        <h2>{title}</h2>

        {children}
      </div>
    </div>
  );
}