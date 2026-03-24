import React from "react";

export function AiSearchResult({ result, isLoading, streamingAnswer, streamingSources }: { result: any; isLoading?: boolean; streamingAnswer?: any; streamingSources?: any[] }) {
  if (isLoading) return <div>Loading AI answer...</div>;
  if (!result && !streamingAnswer) return <div>No AI result</div>;
  return (
    <div>
      <strong>AI Answer</strong>
      <div>{streamingAnswer ?? JSON.stringify(result)}</div>
      {streamingSources && streamingSources.length > 0 && (
        <div>
          <em>Sources:</em>
          <ul>
            {streamingSources.map((s, i) => (
              <li key={i}>{JSON.stringify(s)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
