"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function PaymentRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  useEffect(() => {
    if (courseId) {
      router.replace(`/dashboard/payment/${courseId}`);
    } else {
      router.replace("/courses");
    }
  }, [courseId, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Redirection vers le paiement sécurisé...
      </p>
    </div>
  );
}

export default function PaymentQueryRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      }
    >
      <PaymentRedirectContent />
    </Suspense>
  );
}
