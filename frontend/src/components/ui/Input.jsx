export default function Input({ label, type = 'text', className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <input type={type} className="field" {...props} />
    </div>
  );
}
