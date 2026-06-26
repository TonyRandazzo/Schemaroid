export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}