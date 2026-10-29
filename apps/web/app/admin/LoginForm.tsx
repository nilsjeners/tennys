"use client";

import { useState } from "react";

// ponytail: no auth backend yet — every submit is rejected. Wire to Better Auth
// (admin role) when the admin panel lands.
export function LoginForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("Admin-Login ist noch nicht eingerichtet.");
      }}
    >
      <label className="field">
        <span className="label">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" required />
      </label>
      <label className="field">
        <span className="label">Passwort</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <button className="btn" type="submit" disabled={!name.trim() || !password}>
        Anmelden
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
