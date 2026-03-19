export default function FormFieldCard({ field, value, index, onEdit }) {
  return (
    <div className="sff-field-card">
      <div className="sff-field-card-left">
        <div className="sff-field-card-label">{field.label || field.name}</div>
        <div className="sff-field-card-value">{value || "—"}</div>
      </div>
      <button
        className="sff-field-card-edit"
        onClick={() => onEdit(index)}
        title="Edit this field"
        type="button"
      >
        ✎
      </button>
    </div>
  );
}
