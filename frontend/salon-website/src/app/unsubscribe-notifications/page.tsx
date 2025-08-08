"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { unsubscribeNotificationEmails } from "@/lib/api";

function UnsubscribeNotificationsContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("Brak tokenu do rezygnacji z subskrypcji.");
      return;
    }

    setStatus("loading");
    try {
      await unsubscribeNotificationEmails(token);

      setStatus("success");
      setMessage(
        "Pomyślnie zrezygnowano z subskrypcji emaili z powiadomieniami."
      );
    } catch {
      setStatus("error");
      setMessage("Wystąpił błąd podczas łączenia z serwerem.");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      handleUnsubscribe();
    } else {
      setStatus("error");
      setMessage("Nieprawidłowy link do rezygnacji z subskrypcji.");
    }
  }, [token, handleUnsubscribe]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Rezygnacja z subskrypcji
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Przetwarzanie żądania...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Rezygnacja zakończona
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nie będziesz już otrzymywać emaili z powiadomieniami o
                rezerwacjach.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Błąd
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jeśli problem się powtarza, skontaktuj się z nami bezpośrednio.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribeNotificationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ładowanie...
            </h1>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeNotificationsContent />
    </Suspense>
  );
}
