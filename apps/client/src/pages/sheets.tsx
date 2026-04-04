export default function SheetsPage() {
  return (
    <div
      style={{
        width: "100%",
        height: "calc(111vh - 60px)", // ✅ IMPORTANT FIX
        overflow: "hidden",
      }}
    >
      <iframe
        src="http://localhost:5175"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  );
}