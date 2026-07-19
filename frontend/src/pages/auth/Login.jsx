import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import Divider from "../../components/auth/Divider.jsx";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const run = async (action) => {
    setError("");
    setLoading(true);
    try {
      await action();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    run(() => login(form.email, form.password));
  };

  const handleGoogle = (accessToken) => run(() => loginWithGoogle(accessToken));

  return (
    <AuthLayout title="Log in to Up To Date">
      <div className="flex flex-col gap-4">
        <FormError message={error} />

        <GoogleAuthButton onToken={handleGoogle} onError={setError}>
          Continue with Google
        </GoogleAuthButton>

        <Divider />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@company.com"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Button type="submit" isLoading={loading}>
            {loading ? "Logging in..." : "Continue with email"}
          </Button>
        </form>

        <p className="text-center text-sm text-fg-muted">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-fg hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
