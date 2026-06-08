import useFetch from "../hooks/useFetch.js";
import { userService } from "../services/userService.js";
import Loader from "../components/common/Loader.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";

export default function Users() {
  const { data: users, loading, error } = useFetch(userService.getAll);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <section>
      <h1>Users</h1>
      {(!users || users.length === 0) && <p>No users yet.</p>}
      <ul className="user-list">
        {users?.map((u) => (
          <li key={u.id}>
            <strong>{u.name || "Unnamed"}</strong> — {u.email}
            {u.posts?.length ? ` (${u.posts.length} posts)` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
