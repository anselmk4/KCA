import { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = {
  title: 'Vérification de Certificat — ANSELLA',
  description: 'Vérifiez l\'authenticité d\'un certificat ANSELLA.',
};

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  return <VerifyClient code={resolvedParams.code} />;
}
