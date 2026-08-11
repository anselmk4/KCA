import { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = {
  title: 'Certificate Verification — ANSELLA',
  description: 'Verify the authenticity of an official ANSELLA certificate.',
};

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  return <VerifyClient code={resolvedParams.code} />;
}
