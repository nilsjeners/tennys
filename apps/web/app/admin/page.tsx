import type { Metadata } from "next";
import { Logo } from "../Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Tennys Admin",
  robots: { index: false, follow: false },
};

export default function AdminLogin() {
  return (
    <main className="login-wrap">
      <div className="login">
        <div className="login-head">
          <Logo size={44} />
          <div>
            <h1 className="display">Admin</h1>
            <p>Tennys Verwaltung</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
