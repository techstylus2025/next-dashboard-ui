"use client";

type ExamQuestionPreviewModalProps = {
  open: boolean;
  title: string;
  fileUrl: string;
  onClose: () => void;
};

const ExamQuestionPreviewModal = ({
  open,
  title,
  fileUrl,
  onClose,
}: ExamQuestionPreviewModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-5xl h-[80vh] bg-white rounded-md overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-lg font-semibold">Preview: {title}</h3>
            <p className="text-sm text-slate-600">Review the document before approving.</p>
          </div>
          <button
            type="button"
            className="text-slate-600 hover:text-slate-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="h-[calc(100%-72px)] bg-slate-100">
          <iframe
            src={fileUrl}
            className="h-full w-full"
            title={title}
            frameBorder="0"
          />
        </div>

        <div className="border-t border-slate-200 p-4 text-sm text-slate-700">
          If the document does not render, you can open it in a new tab:
          <a
            className="ml-1 text-blue-600 underline"
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open file
          </a>
        </div>
      </div>
    </div>
  );
};

export default ExamQuestionPreviewModal;
