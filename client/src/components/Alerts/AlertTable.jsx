function AlertTable({ children }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 18 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
    </div>
  );
}

export default AlertTable;
