import { storageService } from '../../services/storage';
import { SSLDocumentView } from '../admin/SSLDocumentView';

interface PublicSSLModalProps {
  tokenOrId: string;
  onClose: () => void;
}

export function PublicSSLModal({ tokenOrId, onClose }: PublicSSLModalProps) {
  const forms = storageService.getSSLForms();
  const form = forms.find(
    (f) => f.shareToken === tokenOrId || f.id === tokenOrId
  );

  if (!form) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
          <h4 className="font-bold text-slate-900 text-lg">SSL Document Not Found</h4>
          <p className="text-xs text-slate-500">
            The requested verification link may have expired or was typed incorrectly.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return <SSLDocumentView form={form} onClose={onClose} />;
}
