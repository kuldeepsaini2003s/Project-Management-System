import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import Divider from "../../components/auth/Divider.jsx";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const oneTapInProgress = useSelector((state) => state.auth.oneTapInProgress);
  const oneTapError = useSelector((state) => state.auth.oneTapError);

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
    run(() => register(form));
  };

  const handleGoogle = (accessToken) => run(() => loginWithGoogle(accessToken));

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start building with your team on Up To Date."
    >
      <div className="flex flex-col gap-4">
        <FormError message={error || oneTapError} />

        <GoogleAuthButton onToken={handleGoogle} onError={setError} isLoading={oneTapInProgress}>
          Sign up with Google
        </GoogleAuthButton>

        <Divider />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="name"
            name="name"
            label="Full name"
            placeholder="Ada Lovelace"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
          />
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
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            required
          />
          <Button type="submit" isLoading={loading || oneTapInProgress}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-fg-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-fg hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
