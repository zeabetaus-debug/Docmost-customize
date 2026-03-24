import { useState } from "react";

export function useAiSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [streamingAnswer, setStreamingAnswer] = useState<any>(null);
  const [streamingSources, setStreamingSources] = useState<any[]>([]);

  async function mutate(params?: any) {
    setIsLoading(true);
    setStreamingAnswer(null);
    setStreamingSources([]);

    // simulate async AI search
    setTimeout(() => {
      setData({ query: params?.query, answer: null });
      setIsLoading(false);
    }, 200);
  }

  function clearStreaming() {
    setStreamingAnswer(null);
    setStreamingSources([]);
  }

  return {
    data,
    isPending: isLoading,
    mutate,
    reset: () => setData(null),
    error: undefined,
    streamingAnswer,
    streamingSources,
    clearStreaming,
  } as const;
}
