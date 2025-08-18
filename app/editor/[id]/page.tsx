export const dynamic = 'force-dynamic';

import { PaperEditor } from '@/components/editor/paper-editor';

export default function EditorPage({ params }: { params: { id: string } }) {
  return <PaperEditor paperId={params.id} />;
}