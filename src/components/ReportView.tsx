'use client';

import { useMemo } from 'react';
import { marked } from 'marked';

interface ReportViewProps {
  report: string;
}

export function ReportView({ report }: ReportViewProps) {
  const html = useMemo(() => {
    if (!report) return '';
    return marked(report) as string;
  }, [report]);

  if (!report) return null;

  return (
    <div className="mt-6 bg-white rounded-xl border-2 border-blue-300 shadow-lg overflow-hidden">
      <div className="bg-blue-600 px-6 py-4">
        <h3 className="text-xl font-bold text-white">
          Psikiyatrik Degerlendirme Raporu
        </h3>
      </div>
      <div
        className="p-6 prose prose-blue max-w-none prose-headings:text-blue-800 prose-strong:text-blue-900"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
