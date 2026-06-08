import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        Fullstack App
      </Link>
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
      </nav>
    </header>
  );
}
