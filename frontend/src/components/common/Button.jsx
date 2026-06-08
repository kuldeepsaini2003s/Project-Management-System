export default function Button({ children, onClick, type = "button", disabled }) {
  return (
    <button className="btn" type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
