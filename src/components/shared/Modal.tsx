interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className = '' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay mit höchstem z-index */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]" onClick={onClose} />
      
      {/* Modal-Container */}
      <div className={`fixed inset-0 flex items-center justify-center p-4 z-[9999] pointer-events-none ${className}`}>
        <div className="bg-white rounded-lg max-w-md w-full p-6 pointer-events-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}; 