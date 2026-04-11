'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { LibraryDocumentView } from '@/lib/queries';
import RebalanceDocumentView from './RebalanceDocumentView';
import DeltaRequestDocumentView from './DeltaRequestDocumentView';
import DeliberationDocumentView from './DeliberationDocumentView';
import EvolutionSourcesDocumentView from './EvolutionSourcesDocumentView';

export default function LibraryDocumentBody({
  view,
  markdown,
  payload,
}: {
  view: LibraryDocumentView;
  markdown: string;
  payload: Record<string, unknown> | null;
}) {
  switch (view) {
    case 'rebalance':
      return <RebalanceDocumentView payload={payload} fallbackMarkdown={markdown} />;
    case 'delta_request':
      return <DeltaRequestDocumentView payload={payload} />;
    case 'deliberation':
      return <DeliberationDocumentView payload={payload} fallbackMarkdown={markdown} />;
    case 'evolution_sources':
      return <EvolutionSourcesDocumentView payload={payload} fallbackMarkdown={markdown} />;
    default:
      return (
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      );
  }
}
