const buildStamp = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
};

const downloadText = (message, sendResponse) => {
  const content = typeof message.content === "string" ? message.content : "";
  const filename =
    typeof message.filename === "string" && message.filename.trim()
      ? message.filename.trim()
      : `inspiration-${buildStamp()}.txt`;
  const mimeType =
    typeof message.mimeType === "string" && /^[\\w.+-]+\/[\\w.+-]+$/.test(message.mimeType)
      ? message.mimeType
      : "text/plain";
  const saveAs = typeof message.saveAs === "boolean" ? message.saveAs : true;

  const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;

  chrome.downloads.download(
    {
      url: dataUrl,
      filename,
      saveAs
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true, downloadId });
    }
  );
};

const askAgent = async (message, sendResponse) => {
  const config = message?.config || {};
  const endpoint = typeof config.endpoint === "string" ? config.endpoint.trim() : "";
  const model = typeof config.model === "string" ? config.model.trim() : "";
  const apiKey = typeof config.apiKey === "string" ? config.apiKey.trim() : "";
  const systemPrompt = typeof config.systemPrompt === "string" ? config.systemPrompt : "";
  const question = typeof message.question === "string" ? message.question.trim() : "";
  const context = typeof message.context === "string" ? message.context : "";

  let temperature = Number(config.temperature);
  if (Number.isNaN(temperature)) {
    temperature = 0.4;
  }
  temperature = Math.max(0, Math.min(2, temperature));

  if (!endpoint || !model || !apiKey || !question) {
    sendResponse({ ok: false, error: "Missing endpoint/model/apiKey/question." });
    return;
  }

  const payload = {
    model,
    temperature,
    messages: [
      { role: "system", content: systemPrompt || "You are a helpful innovation assistant." },
      {
        role: "user",
        content: [
          "Use the context notes below to answer the question.",
          "Focus on synthesis, prioritization, and actionable next steps.",
          "",
          "Question:",
          question,
          "",
          "Context:",
          context
        ].join("\n")
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    let data = null;

    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail =
        (data && (data.error?.message || data.message)) ||
        raw.slice(0, 260) ||
        `HTTP ${response.status}`;
      sendResponse({ ok: false, error: `Agent API error: ${detail}` });
      return;
    }

    const answer = data?.choices?.[0]?.message?.content;
    if (!answer || typeof answer !== "string") {
      sendResponse({ ok: false, error: "No assistant message returned by API." });
      return;
    }

    sendResponse({ ok: true, answer });
  } catch (error) {
    sendResponse({ ok: false, error: error?.message || "Network error while calling agent API." });
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "DOWNLOAD_TEXT") {
    downloadText(message, sendResponse);
    return true;
  }

  if (message?.type === "ASK_AGENT") {
    askAgent(message, sendResponse);
    return true;
  }

  return false;
});
