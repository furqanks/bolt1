import { PaperEditor } from '@/components/editor/paper-editor';

export async function generateStaticParams() {
  // Return empty array since paper IDs are dynamic and user-generated
  // This satisfies Next.js static export requirements
  return [];
}

export default function EditorPage({ params }: { params: { id: string } }) {
  return <PaperEditor paperId={params.id} />;
}