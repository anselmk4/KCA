import { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = {
  title: 'Vérification de Certificat — ANSELLA',
  description: 'Vérifiez l\'authenticité d\'un certificat ANSELLA Crypto Academy.',
};

export default function VerifyPage({ params }: { params: { code: string } }) {
  return <VerifyClient code={params.code} />;
}
