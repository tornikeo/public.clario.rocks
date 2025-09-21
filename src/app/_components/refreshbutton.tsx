"use client";

import { useState } from "react";

export function RefreshButton() {
  
  const [loading, setLoading] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const isDevelopment = false;
  const endpoints = [
    { url: "/api/news", method: "POST" },
    { url: "/api/ai/filter/relevancy", method: "POST" },
    { url: "/api/ai/filter/urgency", method: "POST" },
    { url: "/api/ai/event", method: "POST" },
    { url: "/api/ai/reqs/watson", method: "GET" },
  ];

  const handleTestEndpoint = async (endpoint: string, method = "GET") => {
    setLoading(endpoint);
    try {
      const response = await fetch(endpoint, { method });
      const data = await response.json();
      setModalContent(JSON.stringify(data, null, 2));
    } catch (error) {
      setModalContent(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRefresh = async () => {
    setProgress(0);
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      if (!endpoint) continue; // Ensure endpoint is valid

      const { url, method } = endpoint;
      setLoading(url);
      try {
        await fetch(url, { method });
      } catch (error) {
        console.error(`Error refreshing ${url}:`, error);
      } finally {
        setProgress(((i + 1) / endpoints.length) * 100);
      }
    }
    setLoading(null);
  };

  const closeModal = () => {
    setModalContent(null);
  };
  // TODO: 
  // Add generous spacing between navbar icon, refresh button and progress bar
  // progress bar must not appear before clicking the refresh
  // progress bar must not be placed on navbar - it must be placed just on the upper border
  // of the navbar, like a thin blue border that fills up from left to right. 
// As the refresh is happening, the cards must appear in suspense as loading
  return (
    <div className="px-2">
      {isDevelopment ? (
        <>
          {endpoints.map(({ url, method }) => (
            <button
              key={url}
              onClick={() => handleTestEndpoint(url, method)}
              disabled={loading === url}
              className={`bg-none ${
                loading === url ? "bg-gray-400" : "bg-gray-500 hover:bg-gray-600"
              } text-white`}
            >
              {loading === url ? "Loading..." : `Test ${url}`}
            </button>
          ))}
        </>
      ) : (
        <button
          onClick={handleRefresh}
          disabled={loading !== null}
          className={`bg-none ${
            loading ? "bg-none" : " hover:underline hover:"
          } text-black`}
        >
          {loading ? "Refreshing..." : "Refresh   "}
        </button>
      )}

      {/* Progress Bar */}
      {!isDevelopment && progress > 0 && progress < 100 && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200">
          <div
            className="bg-black h-0.5"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-lg font-bold mb-4">Response</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64 text-sm">
              {modalContent}
            </pre>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}