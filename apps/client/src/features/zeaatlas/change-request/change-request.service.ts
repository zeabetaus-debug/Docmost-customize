async function postChangeRequestAction(id: string, action: "approve" | "reject") {
  const response = await fetch(`/api/zeaatlas/change-request/${id}/${action}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const rawText = await response.text();
  let data: unknown = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  console.log(`${action === "approve" ? "Approve" : "Reject"} Response:`, data);

  if (!response.ok) {
    console.error(`Change request ${action} failed`, {
      id,
      status: response.status,
      statusText: response.statusText,
      data,
    });

    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: string }).message)
        : `Failed to ${action} request`;

    throw new Error(message);
  }

  return data;
}

export async function approveChangeRequest(id: string) {
  return postChangeRequestAction(id, "approve");
}

export async function rejectChangeRequest(id: string) {
  return postChangeRequestAction(id, "reject");
}
