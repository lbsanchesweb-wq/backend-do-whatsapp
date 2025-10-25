import React, { useState } from 'react';
import { Report } from '../types';
import { Modal } from './Modal';
import { EyeIcon, TrashIcon, LoaderIcon } from './icons';

const API_URL = 'https://backend-do-whatsapp.onrender.com';

interface ReportsProps {
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const Reports: React.FC<ReportsProps> = ({ reports, setReports, showToast }) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (reportId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.')) {
      setDeletingId(reportId);
      try {
        const response = await fetch(`${API_URL}/reports/${reportId}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Falha ao excluir o relatório.');
        }
        setReports(prev => prev.filter(r => r.id !== reportId));
        showToast('Relatório excluído com sucesso!', 'success');
      } catch (error) {
        console.error("Error deleting report:", error);
        showToast("Não foi possível excluir o relatório. Tente novamente.", 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleView = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6">Histórico de Relatórios</h2>

      {reports.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Nenhum relatório gerado ainda.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Gere um relatório a partir de uma conversa na aba WhatsApp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reports.map(report => (
            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{report.contactName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Gerado em: {new Date(report.generatedAt).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 h-20 overflow-hidden text-ellipsis">
                  {report.summary}
                </p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2">
                <button onClick={() => handleView(report)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Visualizar Relatório">
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => handleDelete(report.id)} 
                  disabled={deletingId === report.id}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50 disabled:cursor-wait" 
                  title="Excluir Relatório"
                >
                  {deletingId === report.id ? <LoaderIcon className="h-5 w-5"/> : <TrashIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Relatório de ${selectedReport.contactName}`}>
          <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 text-sm font-sans leading-relaxed bg-gray-100 dark:bg-gray-700 p-4 rounded-md max-h-[60vh] overflow-y-auto">
            {selectedReport.summary}
          </pre>
        </Modal>
      )}
    </div>
  );
};
