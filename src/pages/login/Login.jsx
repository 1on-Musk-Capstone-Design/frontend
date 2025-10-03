export default function Login() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>
        <form style={styles.form}>
          <input type="email" placeholder="Email" style={styles.input} />
          <input type="password" placeholder="Password" style={styles.input} />
          <button type="submit" style={styles.button}>Login</button>
        </form>
        <p style={styles.text}>
          Don’t have an account?{" "}
          <a href="/signup" style={styles.link}>Sign up</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f3f4f6" },
  card: { background: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "350px", textAlign: "center" },
  title: { fontSize: "28px", marginBottom: "20px", color: "#333" },
  form: { display: "flex", flexDirection: "column" },
  input: { padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px" },
  button: { padding: "12px", background: "#4CAF50", color: "white", fontSize: "16px", border: "none", borderRadius: "5px", cursor: "pointer" },
  text: { marginTop: "15px", fontSize: "14px" },
  link: { color: "#4CAF50", textDecoration: "none", fontWeight: "bold" }
};
