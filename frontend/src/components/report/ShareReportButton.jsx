import { useState } from 'react';
import { ShareIcon } from '@heroicons/react/24/outline';
import ShareReportModal from './ShareReportModal';

export default function ShareReportButton({ reportTitle }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <ShareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
        Share Report
      </button>

      <ShareReportModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        reportTitle={reportTitle} 
      />
    </>
  );
}
