(() => {
  const ROOT_ID = "icp-root";
  const STORAGE_KEY = "inspirationNotesV3";
  const LEGACY_KEYS = ["inspirationNotesV2", "inspirationNotesV1"];
  const LINKS_KEY = "inspirationLinksV1";
  const AGENT_CONFIG_KEY = "inspirationAgentConfigV1";
  const UI_PREFS_KEY = "inspirationUiPrefsV1";

  const CATEGORY_META = [
    { value: "database", label: "Database" },
    { value: "method", label: "Method" },
    { value: "creative", label: "Creative" },
    { value: "research", label: "Research" },
    { value: "product", label: "Product" },
    { value: "workflow", label: "Workflow" },
    { value: "other", label: "Other" }
  ];

  const CATEGORY_LABEL = Object.fromEntries(CATEGORY_META.map((item) => [item.value, item.label]));
  const CATEGORY_ORDER = CATEGORY_META.map((item) => item.value);
  const VALID_CATEGORIES = new Set(CATEGORY_ORDER);

  const DEFAULT_AGENT_CONFIG = {
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4.1-mini",
    apiKey: "",
    systemPrompt:
      "You are a strategic innovation partner. Synthesize notes, connect ideas across domains, and propose practical next experiments.",
    temperature: 0.4
  };

  const LINK_RELATIONS = ["supports", "extends", "contrasts", "applies_to", "inspired_by"];

  const CATEGORY_KEYWORDS = {
    database: ["database", "sql", "nosql", "postgres", "mysql", "sqlite", "redis", "mongodb", "vector", "schema", "index"],
    method: ["method", "algorithm", "framework", "pipeline", "approach", "pattern", "benchmark", "ab test", "protocol"],
    creative: ["idea", "creative", "inspiration", "story", "branding", "concept", "copywriting", "campaign"],
    research: ["research", "paper", "study", "arxiv", "hypothesis", "experiment", "citation", "journal"],
    product: ["product", "feature", "roadmap", "growth", "user", "retention", "pricing", "business"],
    workflow: ["automation", "agent", "workflow", "integration", "toolchain", "devops", "process", "ops"]
  };

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const categoryOptions = [`<option value="auto">Auto</option>`]
    .concat(CATEGORY_META.map((item) => `<option value="${item.value}">${item.label}</option>`))
    .join("");

  const filterOptions = [`<option value="all">All Categories</option>`]
    .concat(CATEGORY_META.map((item) => `<option value="${item.value}">${item.label}</option>`))
    .join("");

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "icp-collapsed";

  root.innerHTML = `
    <button id="icp-toggle" title="Expand inspiration panel">Inspire</button>
    <button id="icp-toggle-lock" title="Lock panel position" aria-label="Lock panel position"></button>
    <section id="icp-panel" aria-label="Inspiration capture panel">
      <header id="icp-header">
        <div class="icp-header-title">
          <strong>Inspiration Hub</strong>
        </div>
        <div class="icp-header-actions">
          <button id="icp-collapse" title="Collapse">_</button>
        </div>
      </header>

      <div class="icp-source" id="icp-source-box">
        <div>
          <div class="icp-source-title" id="icp-source-title">Current source page</div>
          <a id="icp-source-link" target="_blank" rel="noopener noreferrer"></a>
        </div>
        <button id="icp-bind-page" title="Bind current page as source">Use This Page</button>
      </div>

      <div class="icp-fields">
        <input id="icp-title" type="text" placeholder="Title (optional)" />
        <div class="icp-row">
          <select id="icp-category">${categoryOptions}</select>
          <input id="icp-tags" type="text" placeholder="Tags (comma separated)" />
        </div>
        <label class="icp-checkline" for="icp-is-todo">
          <input id="icp-is-todo" type="checkbox" />
          <span>Track this note as TODO</span>
        </label>
        <textarea id="icp-content" placeholder="Paste or write your note..."></textarea>
      </div>

      <div class="icp-actions">
        <button id="icp-selection">Use Selection</button>
        <button id="icp-clipboard">Read Clipboard</button>
        <button id="icp-autocat">Auto Category</button>
        <button id="icp-save">Save Note</button>
        <button id="icp-cancel" hidden>Cancel Edit</button>
        <button id="icp-export-txt">Export TXT</button>
        <button id="icp-export-json">Export JSON</button>
        <button id="icp-export-obsidian">Export Obsidian</button>
        <button id="icp-clear">Clear All</button>
      </div>

      <div class="icp-filter">
        <select id="icp-filter-category">${filterOptions}</select>
        <input id="icp-search" type="text" placeholder="Search title/content/tags/source..." />
      </div>
      <label class="icp-checkline icp-filter-check" for="icp-show-archived">
        <input id="icp-show-archived" type="checkbox" />
        <span>Show archived TODO notes</span>
      </label>

      <div class="icp-ai-actions">
        <button id="icp-generate-brief">Generate AI Brief</button>
        <button id="icp-copy-brief">Copy Brief</button>
        <button id="icp-export-brief">Export Brief</button>
      </div>

      <textarea id="icp-brief" readonly placeholder="AI discussion pack will appear here..."></textarea>

      <div class="icp-link-tools">
        <div class="icp-link-actions">
          <button id="icp-auto-link">AI Auto-Link</button>
          <button id="icp-accept-links">Accept Proposals</button>
          <button id="icp-clear-links">Clear Proposals</button>
        </div>
        <ul id="icp-link-list"></ul>
      </div>

      <details id="icp-agent-config-wrap">
        <summary>Agent API Settings</summary>
        <div class="icp-agent-config">
          <input id="icp-api-endpoint" type="text" placeholder="API endpoint" />
          <div class="icp-row">
            <input id="icp-api-model" type="text" placeholder="Model" />
            <input id="icp-api-temp" type="number" min="0" max="2" step="0.1" placeholder="Temperature" />
          </div>
          <input id="icp-api-key" type="password" placeholder="API key" />
          <textarea id="icp-api-system" placeholder="System prompt for agent..."></textarea>
          <button id="icp-save-agent">Save API Settings</button>
        </div>
      </details>

      <div class="icp-agent-chat">
        <textarea id="icp-agent-question" placeholder="Ask agent: based on current filtered notes, what should I build/research next?"></textarea>
        <div class="icp-agent-chat-actions">
          <button id="icp-ask-agent">Ask Agent</button>
          <button id="icp-copy-agent">Copy Reply</button>
        </div>
        <textarea id="icp-agent-response" readonly placeholder="Agent response appears here..."></textarea>
      </div>

      <p id="icp-status" role="status" aria-live="polite"></p>
      <ul id="icp-list"></ul>
    </section>
  `;

  document.documentElement.appendChild(root);

  const toggleBtn = root.querySelector("#icp-toggle");
  const toggleLockBtn = root.querySelector("#icp-toggle-lock");
  const collapseBtn = root.querySelector("#icp-collapse");

  const sourceTitleEl = root.querySelector("#icp-source-title");
  const sourceLinkEl = root.querySelector("#icp-source-link");
  const bindPageBtn = root.querySelector("#icp-bind-page");

  const titleInput = root.querySelector("#icp-title");
  const categorySelect = root.querySelector("#icp-category");
  const tagsInput = root.querySelector("#icp-tags");
  const todoCheckbox = root.querySelector("#icp-is-todo");
  const contentInput = root.querySelector("#icp-content");

  const useSelectionBtn = root.querySelector("#icp-selection");
  const readClipboardBtn = root.querySelector("#icp-clipboard");
  const autoCategoryBtn = root.querySelector("#icp-autocat");
  const saveBtn = root.querySelector("#icp-save");
  const cancelEditBtn = root.querySelector("#icp-cancel");
  const exportTxtBtn = root.querySelector("#icp-export-txt");
  const exportJsonBtn = root.querySelector("#icp-export-json");
  const exportObsidianBtn = root.querySelector("#icp-export-obsidian");
  const clearBtn = root.querySelector("#icp-clear");

  const filterCategorySelect = root.querySelector("#icp-filter-category");
  const searchInput = root.querySelector("#icp-search");
  const showArchivedCheckbox = root.querySelector("#icp-show-archived");
  const generateBriefBtn = root.querySelector("#icp-generate-brief");
  const copyBriefBtn = root.querySelector("#icp-copy-brief");
  const exportBriefBtn = root.querySelector("#icp-export-brief");
  const briefOutput = root.querySelector("#icp-brief");

  const autoLinkBtn = root.querySelector("#icp-auto-link");
  const acceptLinksBtn = root.querySelector("#icp-accept-links");
  const clearLinksBtn = root.querySelector("#icp-clear-links");
  const linkListEl = root.querySelector("#icp-link-list");

  const apiEndpointInput = root.querySelector("#icp-api-endpoint");
  const apiModelInput = root.querySelector("#icp-api-model");
  const apiTempInput = root.querySelector("#icp-api-temp");
  const apiKeyInput = root.querySelector("#icp-api-key");
  const apiSystemInput = root.querySelector("#icp-api-system");
  const saveAgentBtn = root.querySelector("#icp-save-agent");

  const agentQuestionInput = root.querySelector("#icp-agent-question");
  const askAgentBtn = root.querySelector("#icp-ask-agent");
  const copyAgentBtn = root.querySelector("#icp-copy-agent");
  const agentResponseOutput = root.querySelector("#icp-agent-response");

  const statusEl = root.querySelector("#icp-status");
  const notesList = root.querySelector("#icp-list");

  let notes = [];
  let links = [];
  let editingNoteId = null;
  let draftSource = null;
  let agentConfig = { ...DEFAULT_AGENT_CONFIG };
  let uiPrefs = {
    position: null,
    locked: false
  };
  let dragState = null;
  let suppressToggleClickUntil = 0;

  const setStatus = (text, isError = false) => {
    statusEl.textContent = text;
    statusEl.className = isError ? "error" : "ok";
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

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

  const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
    } catch {
      return "";
    }
  };

  const parseTags = (raw) =>
    Array.from(
      new Set(
        String(raw)
          .split(/[;,\n]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      )
    ).slice(0, 20);

  const inferCategory = (title, content, sourceUrl) => {
    const haystack = `${title} ${content} ${sourceUrl}`.toLowerCase();
    const scores = {
      database: 0,
      method: 0,
      creative: 0,
      research: 0,
      product: 0,
      workflow: 0
    };

    Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach((keyword) => {
        if (haystack.includes(keyword)) {
          scores[category] += 1;
        }
      });
    });

    if (/arxiv|nature|science|ieee|acm/.test(haystack)) {
      scores.research += 2;
    }
    if (/postgres|mysql|mongodb|redis|supabase|neo4j/.test(haystack)) {
      scores.database += 2;
    }
    if (/github|docs|tutorial|guide/.test(haystack)) {
      scores.method += 1;
    }
    if (/agent|automation|workflow|zapier|n8n/.test(haystack)) {
      scores.workflow += 2;
    }

    let bestCategory = "other";
    let bestScore = 0;

    Object.entries(scores).forEach(([category, score]) => {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    return bestCategory;
  };

  const captureCurrentPage = () => {
    const sourceUrl = location.href;
    const sourceTitle = document.title || "Untitled Page";
    const sourceDomain = getDomain(sourceUrl);
    return { sourceUrl, sourceTitle, sourceDomain };
  };

  const renderSourcePreview = () => {
    if (!draftSource) {
      sourceTitleEl.textContent = "No source page bound";
      sourceLinkEl.textContent = "";
      sourceLinkEl.removeAttribute("href");
      return;
    }

    sourceTitleEl.textContent = draftSource.sourceTitle || "Untitled Page";
    sourceLinkEl.textContent = draftSource.sourceUrl || "N/A";
    if (draftSource.sourceUrl) {
      sourceLinkEl.href = draftSource.sourceUrl;
    } else {
      sourceLinkEl.removeAttribute("href");
    }
  };

  const sanitizeNote = (note) => {
    const title = typeof note?.title === "string" ? note.title.trim() : "";
    const content = typeof note?.content === "string" ? note.content.trim() : "";

    if (!content) {
      return null;
    }

    const sourceUrl =
      typeof note?.sourceUrl === "string" && note.sourceUrl
        ? note.sourceUrl
        : typeof note?.url === "string"
          ? note.url
          : "";

    const sourceTitle =
      typeof note?.sourceTitle === "string" && note.sourceTitle
        ? note.sourceTitle
        : sourceUrl
          ? "Captured Page"
          : "";

    const sourceDomain =
      typeof note?.sourceDomain === "string" && note.sourceDomain
        ? note.sourceDomain
        : getDomain(sourceUrl);

    const rawCategory = typeof note?.category === "string" ? note.category.toLowerCase() : "";
    const category = VALID_CATEGORIES.has(rawCategory)
      ? rawCategory
      : inferCategory(title, content, sourceUrl);

    const tags = Array.isArray(note?.tags)
      ? note.tags.map((item) => String(item).trim()).filter(Boolean)
      : parseTags(typeof note?.tags === "string" ? note.tags : "");

    const rawExecutionState = typeof note?.executionState === "string" ? note.executionState.toLowerCase() : "";
    let executionState = ["idea", "todo", "archived"].includes(rawExecutionState) ? rawExecutionState : "idea";
    if (executionState === "idea" && tags.some((tag) => tag.toLowerCase() === "todo")) {
      executionState = "todo";
    }

    return {
      id: typeof note?.id === "string" && note.id ? note.id : createId(),
      title,
      content,
      category,
      tags,
      executionState,
      completedAt: typeof note?.completedAt === "string" && note.completedAt ? note.completedAt : null,
      sourceUrl,
      sourceTitle,
      sourceDomain,
      createdAt: typeof note?.createdAt === "string" && note.createdAt ? note.createdAt : new Date().toLocaleString(),
      updatedAt: typeof note?.updatedAt === "string" && note.updatedAt ? note.updatedAt : null
    };
  };

  const sanitizeLink = (link, noteIdSet) => {
    const fromId = typeof link?.fromId === "string" ? link.fromId : "";
    const toId = typeof link?.toId === "string" ? link.toId : "";

    if (!fromId || !toId || fromId === toId || !noteIdSet.has(fromId) || !noteIdSet.has(toId)) {
      return null;
    }

    const rawRelation = typeof link?.relation === "string" ? link.relation.toLowerCase() : "supports";
    const relation = LINK_RELATIONS.includes(rawRelation) ? rawRelation : "supports";

    let confidence = Number(link?.confidence);
    if (!Number.isFinite(confidence)) {
      confidence = 0.6;
    }
    confidence = Math.max(0, Math.min(1, confidence));

    const rawStatus = typeof link?.status === "string" ? link.status.toLowerCase() : "suggested";
    const status = rawStatus === "accepted" ? "accepted" : "suggested";

    return {
      id: typeof link?.id === "string" && link.id ? link.id : createId(),
      fromId,
      toId,
      relation,
      confidence,
      reason: typeof link?.reason === "string" ? link.reason.trim().slice(0, 240) : "",
      status,
      createdAt: typeof link?.createdAt === "string" && link.createdAt ? link.createdAt : new Date().toISOString()
    };
  };

  const getAgentConfigFromForm = () => {
    const endpoint = apiEndpointInput.value.trim() || DEFAULT_AGENT_CONFIG.endpoint;
    const model = apiModelInput.value.trim() || DEFAULT_AGENT_CONFIG.model;
    const apiKey = apiKeyInput.value.trim();
    const systemPrompt = apiSystemInput.value.trim() || DEFAULT_AGENT_CONFIG.systemPrompt;

    let temperature = Number(apiTempInput.value);
    if (Number.isNaN(temperature)) {
      temperature = DEFAULT_AGENT_CONFIG.temperature;
    }
    temperature = Math.max(0, Math.min(2, temperature));

    return { endpoint, model, apiKey, systemPrompt, temperature };
  };

  const applyAgentConfigToForm = (config) => {
    apiEndpointInput.value = config.endpoint || DEFAULT_AGENT_CONFIG.endpoint;
    apiModelInput.value = config.model || DEFAULT_AGENT_CONFIG.model;
    apiTempInput.value = String(
      Number.isFinite(Number(config.temperature)) ? Number(config.temperature) : DEFAULT_AGENT_CONFIG.temperature
    );
    apiKeyInput.value = config.apiKey || "";
    apiSystemInput.value = config.systemPrompt || DEFAULT_AGENT_CONFIG.systemPrompt;
  };

  const persistNotes = () => {
    chrome.storage.local.set({ [STORAGE_KEY]: notes });
  };

  const persistLinks = () => {
    chrome.storage.local.set({ [LINKS_KEY]: links });
  };

  const persistAgentConfig = (config) => {
    chrome.storage.local.set({ [AGENT_CONFIG_KEY]: config });
  };

  const persistUiPrefs = () => {
    chrome.storage.local.set({ [UI_PREFS_KEY]: uiPrefs });
  };

  const clampPanelPosition = (left, bottom) => {
    const toggleWidth = toggleBtn.offsetWidth || 82;
    const toggleHeight = toggleBtn.offsetHeight || 40;
    const maxLeft = Math.max(12, window.innerWidth - toggleWidth - 12);
    const maxBottom = Math.max(12, window.innerHeight - toggleHeight - 12);

    return {
      left: Math.min(Math.max(12, left), maxLeft),
      bottom: Math.min(Math.max(12, bottom), maxBottom)
    };
  };

  const applyPanelPosition = () => {
    if (!uiPrefs.position) {
      root.style.left = "";
      root.style.top = "";
      root.style.right = "16px";
      root.style.bottom = "16px";
      return;
    }

    const next = clampPanelPosition(uiPrefs.position.left, uiPrefs.position.bottom);
    root.style.left = `${next.left}px`;
    root.style.top = "auto";
    root.style.right = "auto";
    root.style.bottom = `${next.bottom}px`;
  };

  const syncLockUi = () => {
    root.classList.toggle("icp-position-locked", uiPrefs.locked);
    toggleLockBtn.textContent = uiPrefs.locked ? String.fromCodePoint(0x1F512) : String.fromCodePoint(0x1F513);
    toggleLockBtn.title = uiPrefs.locked ? "Unlock panel position" : "Lock panel position";
    toggleLockBtn.setAttribute("aria-label", toggleLockBtn.title);
  };

  const resetEditor = () => {
    editingNoteId = null;
    titleInput.value = "";
    tagsInput.value = "";
    todoCheckbox.checked = false;
    categorySelect.value = "auto";
    contentInput.value = "";
    draftSource = captureCurrentPage();
    renderSourcePreview();
    saveBtn.textContent = "Save Note";
    cancelEditBtn.hidden = true;
  };

  const getNoteById = (id) => notes.find((note) => note.id === id) || null;

  const getFilteredNotes = () => {
    const search = searchInput.value.trim().toLowerCase();
    const selectedCategory = filterCategorySelect.value;
    const showArchived = showArchivedCheckbox.checked;

    return notes.filter((note) => {
      if (selectedCategory !== "all" && note.category !== selectedCategory) {
        return false;
      }

      if (!showArchived && note.executionState === "archived") {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchable = [
        note.title,
        note.content,
        note.tags.join(" "),
        note.sourceUrl,
        note.sourceTitle,
        note.sourceDomain,
        note.executionState,
        CATEGORY_LABEL[note.category] || note.category
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  };

  const getAcceptedLinks = () => links.filter((link) => link.status === "accepted");
  const getSuggestedLinks = () => links.filter((link) => link.status === "suggested");

  const getConnectedCount = (noteId) =>
    getAcceptedLinks().filter((link) => link.fromId === noteId || link.toId === noteId).length;

  const tokenize = (text) => {
    const base = String(text || "").toLowerCase();
    return base
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .slice(0, 240);
  };

  const jaccard = (arrA, arrB) => {
    const setA = new Set(arrA);
    const setB = new Set(arrB);
    if (!setA.size || !setB.size) {
      return 0;
    }

    let intersection = 0;
    setA.forEach((token) => {
      if (setB.has(token)) {
        intersection += 1;
      }
    });

    const union = setA.size + setB.size - intersection;
    return union ? intersection / union : 0;
  };

  const scorePair = (a, b) => {
    const aTokens = tokenize(`${a.title} ${a.content} ${a.tags.join(" ")} ${a.category}`);
    const bTokens = tokenize(`${b.title} ${b.content} ${b.tags.join(" ")} ${b.category}`);

    const baseScore = jaccard(aTokens, bTokens);
    const tagScore = jaccard(a.tags, b.tags);
    const categoryBoost = a.category === b.category ? 0.08 : 0;

    return baseScore * 0.72 + tagScore * 0.2 + categoryBoost;
  };

  const buildCandidatePairs = (dataset, maxPairs = 28) => {
    const pairs = [];

    for (let i = 0; i < dataset.length; i += 1) {
      for (let j = i + 1; j < dataset.length; j += 1) {
        const left = dataset[i];
        const right = dataset[j];
        const score = scorePair(left, right);

        if (score >= 0.05) {
          pairs.push({
            fromId: left.id,
            toId: right.id,
            score
          });
        }
      }
    }

    return pairs.sort((a, b) => b.score - a.score).slice(0, maxPairs);
  };

  const buildTextExport = (dataset) => {
    const lines = ["Inspiration Notes", `Exported at: ${new Date().toISOString()}`, ""];

    dataset.forEach((note, index) => {
      lines.push(`[${index + 1}] ${note.title || "Untitled"}`);
      lines.push(`Category: ${CATEGORY_LABEL[note.category] || note.category}`);
      lines.push(`Tags: ${note.tags.length ? note.tags.join(", ") : "-"}`);
      lines.push(`Connected Notes: ${getConnectedCount(note.id)}`);
      lines.push(`Time: ${note.createdAt}`);
      lines.push(`Source Title: ${note.sourceTitle || "N/A"}`);
      lines.push(`Source URL: ${note.sourceUrl || "N/A"}`);
      lines.push("Content:");
      lines.push(note.content);
      lines.push("----------------------------------------");
    });

    return lines.join("\n");
  };

  const buildAIBrief = (dataset) => {
    const counts = dataset.reduce((acc, note) => {
      acc[note.category] = (acc[note.category] || 0) + 1;
      return acc;
    }, {});

    const tagCounts = {};
    dataset.forEach((note) => {
      note.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => `${tag} (${count})`);

    const lines = [
      "# Inspiration Synthesis Pack",
      `Generated at: ${new Date().toISOString()}`,
      "",
      "## Category Breakdown"
    ];

    CATEGORY_ORDER.forEach((category) => {
      if (counts[category]) {
        lines.push(`- ${CATEGORY_LABEL[category]}: ${counts[category]}`);
      }
    });

    lines.push("");
    lines.push("## High-Signal Tags");
    lines.push(topTags.length ? `- ${topTags.join(", ")}` : "- No tags captured yet");
    lines.push("");
    lines.push("## Source Notes");

    dataset.forEach((note, index) => {
      lines.push("");
      lines.push(`### ${index + 1}. [${CATEGORY_LABEL[note.category] || note.category}] ${note.title || "Untitled"}`);
      lines.push(`- Source Title: ${note.sourceTitle || "N/A"}`);
      lines.push(`- Source URL: ${note.sourceUrl || "N/A"}`);
      lines.push(`- Tags: ${note.tags.length ? note.tags.join(", ") : "-"}`);
      lines.push(`- Captured: ${note.createdAt}`);
      lines.push("- Note:");
      lines.push("```text");
      lines.push(note.content);
      lines.push("```");
    });

    return lines.join("\n");
  };

  const buildAgentContext = (dataset) => {
    const limited = dataset.slice(0, 30);
    const lines = [
      `Total notes: ${dataset.length}`,
      `Context notes sent: ${limited.length}`,
      "",
      "Notes:"
    ];

    limited.forEach((note, index) => {
      lines.push(`${index + 1}) [${CATEGORY_LABEL[note.category] || note.category}] ${note.title || "Untitled"}`);
      lines.push(`Source: ${note.sourceTitle || "N/A"} | ${note.sourceUrl || "N/A"}`);
      lines.push(`Tags: ${note.tags.length ? note.tags.join(", ") : "-"}`);
      lines.push(`Content: ${note.content.slice(0, 900)}`);
      lines.push("");
    });

    return lines.join("\n");
  };

  const buildLinkingContext = (dataset, candidatePairs) => {
    const noteById = Object.fromEntries(dataset.map((note) => [note.id, note]));
    const lines = [
      "Candidate note pairs for possible linking:",
      "",
      "Notes catalog:"
    ];

    dataset.forEach((note, index) => {
      lines.push(`${index + 1}. id=${note.id}`);
      lines.push(`title=${note.title || "Untitled"}`);
      lines.push(`category=${note.category}`);
      lines.push(`tags=${note.tags.join(", ") || "-"}`);
      lines.push(`content=${note.content.slice(0, 360)}`);
      lines.push("");
    });

    lines.push("Candidate pairs:");

    candidatePairs.forEach((pair, index) => {
      const a = noteById[pair.fromId];
      const b = noteById[pair.toId];
      if (!a || !b) {
        return;
      }
      lines.push(
        `${index + 1}) fromId=${pair.fromId} (${a.title || "Untitled"}) | toId=${pair.toId} (${b.title || "Untitled"}) | score=${pair.score.toFixed(3)}`
      );
    });

    return lines.join("\n");
  };

  const parseJsonFromText = (raw) => {
    if (!raw || typeof raw !== "string") {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      // continue
    }

    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const objectSlice = raw.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(objectSlice);
      } catch {
        // continue
      }
    }

    const firstBracket = raw.indexOf("[");
    const lastBracket = raw.lastIndexOf("]");
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      const arraySlice = raw.slice(firstBracket, lastBracket + 1);
      try {
        return { links: JSON.parse(arraySlice) };
      } catch {
        return null;
      }
    }

    return null;
  };

  const downloadTextFile = (content, filename, mimeType = "text/plain", saveAs = true) => {
    chrome.runtime.sendMessage(
      { type: "DOWNLOAD_TEXT", content, filename, mimeType, saveAs },
      (response) => {
        if (!response?.ok) {
          const errorMessage = response?.error || chrome.runtime.lastError?.message || "Download failed.";
          setStatus(errorMessage, true);
          return;
        }
        setStatus(`Download started: ${filename}`);
      }
    );
  };

  const toSafeFileName = (value, fallback = "note") => {
    const clean = String(value || "")
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, "-")
      .replace(/_+/g, "_")
      .slice(0, 90);

    return clean || fallback;
  };

  const buildRelatedMap = (acceptedLinks) => {
    const map = new Map();

    acceptedLinks.forEach((link) => {
      const from = getNoteById(link.fromId);
      const to = getNoteById(link.toId);
      if (!from || !to) {
        return;
      }

      if (!map.has(from.id)) {
        map.set(from.id, []);
      }
      if (!map.has(to.id)) {
        map.set(to.id, []);
      }

      map.get(from.id).push({ targetId: to.id, relation: link.relation, confidence: link.confidence });
      map.get(to.id).push({ targetId: from.id, relation: link.relation, confidence: link.confidence });
    });

    return map;
  };

  const buildObsidianMarkdown = (note, relatedEntries) => {
    const title = note.title || "Untitled";
    const tagsLine = note.tags.length
      ? `[${note.tags.map((tag) => `"${tag.replaceAll('"', "\\\"")}"`).join(", ")}]`
      : "[]";

    const lines = [
      "---",
      `id: ${note.id}`,
      `category: ${note.category}`,
      `tags: ${tagsLine}`,
      `source_title: "${(note.sourceTitle || "").replaceAll('"', "\\\"")}"`,
      `source_url: "${(note.sourceUrl || "").replaceAll('"', "\\\"")}"`,
      `created_at: "${note.createdAt || ""}"`,
      `updated_at: "${note.updatedAt || ""}"`,
      "---",
      "",
      `# ${title}`,
      "",
      note.content,
      "",
      "## Source",
      note.sourceUrl ? `- [${note.sourceTitle || note.sourceDomain || "source"}](${note.sourceUrl})` : "- N/A"
    ];

    if (Array.isArray(relatedEntries) && relatedEntries.length) {
      lines.push("");
      lines.push("## Related Notes (Optional)");

      relatedEntries.slice(0, 20).forEach((entry) => {
        const target = getNoteById(entry.targetId);
        if (!target) {
          return;
        }
        const targetTitle = target.title || "Untitled";
        lines.push(`- [[${targetTitle}]] (${entry.relation}, ${Math.round(entry.confidence * 100)}%)`);
      });
    }

    return lines.join("\n");
  };

  const renderLinks = () => {
    const suggested = getSuggestedLinks();
    const accepted = getAcceptedLinks();

    if (!suggested.length && !accepted.length) {
      linkListEl.innerHTML = '<li class="icp-empty">No link proposals yet.</li>';
      return;
    }

    const row = (link, status) => {
      const from = getNoteById(link.fromId);
      const to = getNoteById(link.toId);
      if (!from || !to) {
        return "";
      }

      const sideActions =
        status === "suggested"
          ? `<button class="icp-link-accept" data-id="${escapeHtml(link.id)}">Accept</button><button class="icp-link-dismiss" data-id="${escapeHtml(link.id)}">Dismiss</button>`
          : `<button class="icp-link-dismiss" data-id="${escapeHtml(link.id)}">Remove</button>`;

      return `
        <li class="icp-link-item ${status}">
          <div class="icp-link-main">
            <span><strong>${escapeHtml(from.title || "Untitled")}</strong> -> <strong>${escapeHtml(to.title || "Untitled")}</strong></span>
            <small>${escapeHtml(link.relation)} | ${Math.round(link.confidence * 100)}%</small>
            ${link.reason ? `<p>${escapeHtml(link.reason)}</p>` : ""}
          </div>
          <div class="icp-link-buttons">${sideActions}</div>
        </li>
      `;
    };

    const suggestedHtml = suggested.map((link) => row(link, "suggested")).join("");
    const acceptedHtml = accepted.map((link) => row(link, "accepted")).join("");

    linkListEl.innerHTML = `
      ${suggested.length ? `<li class="icp-link-group-title">Proposals (${suggested.length})</li>${suggestedHtml}` : ""}
      ${accepted.length ? `<li class="icp-link-group-title">Accepted (${accepted.length})</li>${acceptedHtml}` : ""}
    `;
  };

  const renderNotes = () => {
    const filtered = getFilteredNotes();

    if (!filtered.length) {
      notesList.innerHTML = `<li class="icp-empty">No notes match current filters.</li>`;
      return;
    }

    const grouped = filtered.reduce((acc, note) => {
      const key = note.category || "other";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(note);
      return acc;
    }, {});

    const orderedCategories = CATEGORY_ORDER.filter((cat) => grouped[cat]);

    notesList.innerHTML = orderedCategories
      .map((category) => {
        const section = grouped[category];
        const items = section
          .map((note) => {
            const noteTitle = note.title || "Untitled";
            const tags = note.tags.length
              ? note.tags.map((tag) => `<span class="icp-tag">${escapeHtml(tag)}</span>`).join("")
              : '<span class="icp-tag muted">No tags</span>';

            const sourceLabel = escapeHtml(note.sourceTitle || note.sourceDomain || "Source");
            const sourceUrl = escapeHtml(note.sourceUrl || "");
            const connectedCount = getConnectedCount(note.id);
            const executionState = note.executionState || "idea";
            const workflowAction =
              executionState === "archived"
                ? `<button class="icp-restore" data-id="${escapeHtml(note.id)}">Restore</button>`
                : executionState === "todo"
                  ? `<button class="icp-complete" data-id="${escapeHtml(note.id)}">Done</button>`
                  : `<button class="icp-make-todo" data-id="${escapeHtml(note.id)}">Todo</button>`;

            return `
              <article class="icp-item icp-item-${escapeHtml(executionState)}" data-id="${escapeHtml(note.id)}">
                <div class="icp-item-head">
                  <div class="icp-item-title-wrap">
                    <span>${escapeHtml(noteTitle)}</span>
                    <span class="icp-state-badge ${escapeHtml(executionState)}">${escapeHtml(getExecutionLabel(executionState))}</span>
                  </div>
                  <div class="icp-item-actions">
                    ${workflowAction}
                    <button class="icp-edit" data-id="${escapeHtml(note.id)}">Edit</button>
                    <button class="icp-delete" data-id="${escapeHtml(note.id)}">Delete</button>
                  </div>
                </div>
                <small>${escapeHtml(note.createdAt)} | ${escapeHtml(note.sourceDomain || "unknown")} | linked ${connectedCount}${note.completedAt ? ` | completed ${escapeHtml(note.completedAt)}` : ""}</small>
                ${note.sourceUrl ? `<a class="icp-source-inline" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${sourceLabel}</a>` : ""}
                <div class="icp-tags">${tags}</div>
                <p>${escapeHtml(note.content)}</p>
              </article>
            `;
          })
          .join("");

        return `
          <li class="icp-group">
            <h4 class="icp-group-title">${escapeHtml(CATEGORY_LABEL[category])} <span>(${section.length})</span></h4>
            <div class="icp-group-items">${items}</div>
          </li>
        `;
      })
      .join("");
  };

  const toggleCollapsed = (collapsed) => {
    if (collapsed) {
      root.classList.add("icp-collapsed");
      return;
    }

    root.classList.remove("icp-collapsed");
    if (!editingNoteId) {
      draftSource = captureCurrentPage();
      renderSourcePreview();
    }
    contentInput.focus();
  };

  const startDrag = (event) => {
    if (uiPrefs.locked || !root.classList.contains("icp-collapsed") || event.button !== 0 || !event.isPrimary) {
      return;
    }

    const rootRect = root.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rootRect.left,
      offsetBottom: rootRect.bottom - event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    root.classList.add("icp-dragging");
    toggleBtn.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handleDragMove = (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const travel = Math.abs(event.clientX - dragState.startX) + Math.abs(event.clientY - dragState.startY);
    if (travel > 4) {
      dragState.moved = true;
    }

    const next = clampPanelPosition(
      event.clientX - dragState.offsetX,
      window.innerHeight - event.clientY - dragState.offsetBottom
    );
    uiPrefs.position = next;
    applyPanelPosition();
  };

  const stopDrag = (event) => {
    if (!dragState || (event && event.pointerId !== dragState.pointerId)) {
      return;
    }

    if (dragState.moved) {
      suppressToggleClickUntil = Date.now() + 250;
    }
    if (toggleBtn.hasPointerCapture?.(dragState.pointerId)) {
      toggleBtn.releasePointerCapture(dragState.pointerId);
    }
    dragState = null;
    root.classList.remove("icp-dragging");
    persistUiPrefs();
  };

  const handleOutsidePointerDown = (event) => {
    if (root.classList.contains("icp-collapsed") || dragState || event.button !== 0) {
      return;
    }

    if (root.contains(event.target)) {
      return;
    }

    toggleCollapsed(true);
  };

  const saveOrUpdateNote = () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!content) {
      setStatus("Please add content before saving.", true);
      return;
    }

    if (!draftSource) {
      draftSource = captureCurrentPage();
    }

    let category = categorySelect.value;
    if (category === "auto") {
      category = inferCategory(title, content, draftSource.sourceUrl || location.href);
    }
    if (!VALID_CATEGORIES.has(category)) {
      category = "other";
    }

    const tags = parseTags(tagsInput.value);
    const now = new Date().toLocaleString();

    if (editingNoteId) {
      const idx = notes.findIndex((note) => note.id === editingNoteId);
      if (idx >= 0) {
        const existingExecutionState = notes[idx].executionState || "idea";
        const nextExecutionState = existingExecutionState === "archived"
          ? "archived"
          : todoCheckbox.checked
            ? "todo"
            : "idea";

        notes[idx] = {
          ...notes[idx],
          title,
          content,
          category,
          tags,
          executionState: nextExecutionState,
          completedAt: nextExecutionState === "archived" ? notes[idx].completedAt : null,
          sourceUrl: draftSource.sourceUrl || notes[idx].sourceUrl,
          sourceTitle: draftSource.sourceTitle || notes[idx].sourceTitle,
          sourceDomain: draftSource.sourceDomain || notes[idx].sourceDomain,
          updatedAt: now
        };
      }
      setStatus("Note updated.");
    } else {
      const executionState = todoCheckbox.checked ? "todo" : "idea";
      notes.unshift({
        id: createId(),
        title,
        content,
        category,
        tags,
        executionState,
        completedAt: null,
        sourceUrl: draftSource.sourceUrl,
        sourceTitle: draftSource.sourceTitle,
        sourceDomain: draftSource.sourceDomain,
        createdAt: now,
        updatedAt: null
      });
      setStatus(executionState === "todo" ? "TODO note saved with source page." : "Note saved with source page.");
    }

    persistNotes();
    renderNotes();
    resetEditor();
  };

  const loadEditorForNote = (noteId) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      setStatus("Note not found.", true);
      return;
    }

    editingNoteId = note.id;
    titleInput.value = note.title;
    contentInput.value = note.content;
    tagsInput.value = note.tags.join(", ");
    todoCheckbox.checked = note.executionState === "todo";
    categorySelect.value = VALID_CATEGORIES.has(note.category) ? note.category : "auto";
    draftSource = {
      sourceUrl: note.sourceUrl || "",
      sourceTitle: note.sourceTitle || "",
      sourceDomain: note.sourceDomain || getDomain(note.sourceUrl || "")
    };
    renderSourcePreview();
    saveBtn.textContent = "Update Note";
    cancelEditBtn.hidden = false;
    toggleCollapsed(false);
    setStatus("Editing note.");
  };

  const updateNoteExecutionState = (noteId, nextState) => {
    const now = new Date().toLocaleString();
    let changed = false;

    notes = notes.map((note) => {
      if (note.id !== noteId) {
        return note;
      }

      changed = true;
      return {
        ...note,
        executionState: nextState,
        completedAt: nextState === "archived" ? now : null,
        updatedAt: now
      };
    });

    if (!changed) {
      return;
    }

    persistNotes();
    renderNotes();

    if (nextState === "todo") {
      setStatus("Note is now tracked as TODO.");
    } else if (nextState === "archived") {
      setStatus("TODO completed and archived.");
    } else {
      setStatus("Archived TODO restored.");
    }
  };

  const removeNote = (noteId) => {
    const currentLength = notes.length;
    notes = notes.filter((note) => note.id !== noteId);

    if (notes.length === currentLength) {
      return;
    }

    links = links.filter((link) => link.fromId !== noteId && link.toId !== noteId);

    if (editingNoteId === noteId) {
      resetEditor();
    }

    persistNotes();
    persistLinks();
    renderNotes();
    renderLinks();
    setStatus("Note deleted.");
  };

  const handleAutoLink = () => {
    const filtered = getFilteredNotes();

    if (filtered.length < 2) {
      setStatus("Need at least 2 notes to build links.", true);
      return;
    }

    const config = getAgentConfigFromForm();
    if (!config.apiKey) {
      setStatus("Please provide API key in Agent API Settings.", true);
      return;
    }

    const candidatePairs = buildCandidatePairs(filtered, 30);
    if (!candidatePairs.length) {
      setStatus("No strong candidate pairs found yet. Add more focused notes or tags.", true);
      return;
    }

    const question = [
      "Return ONLY JSON in this exact schema:",
      '{"links":[{"fromId":"...","toId":"...","relation":"supports|extends|contrasts|applies_to|inspired_by","confidence":0.0,"reason":"..."}]}' ,
      "Rules:",
      "- Only use ids from candidate pairs",
      "- Avoid duplicate pairs",
      "- confidence must be between 0 and 1",
      "- Return at most 16 links"
    ].join("\n");

    autoLinkBtn.disabled = true;
    autoLinkBtn.textContent = "Linking...";

    chrome.runtime.sendMessage(
      {
        type: "ASK_AGENT",
        config,
        question,
        context: buildLinkingContext(filtered, candidatePairs)
      },
      (response) => {
        autoLinkBtn.disabled = false;
        autoLinkBtn.textContent = "AI Auto-Link";

        if (!response?.ok) {
          const message = response?.error || chrome.runtime.lastError?.message || "Auto-link request failed.";
          setStatus(message, true);
          return;
        }

        const parsed = parseJsonFromText(response.answer);
        const proposed = Array.isArray(parsed?.links) ? parsed.links : [];
        const noteIdSet = new Set(notes.map((note) => note.id));
        const candidateSet = new Set(
          candidatePairs.flatMap((pair) => [`${pair.fromId}|${pair.toId}`, `${pair.toId}|${pair.fromId}`])
        );

        const normalized = proposed
          .map((item) => sanitizeLink({ ...item, status: "suggested" }, noteIdSet))
          .filter(Boolean)
          .filter((item) => candidateSet.has(`${item.fromId}|${item.toId}`))
          .filter((item, idx, arr) => {
            const key = `${item.fromId}|${item.toId}|${item.relation}`;
            return arr.findIndex((x) => `${x.fromId}|${x.toId}|${x.relation}` === key) === idx;
          })
          .slice(0, 30);

        if (!normalized.length) {
          setStatus("AI did not return valid link proposals. Try again with more specific notes.", true);
          return;
        }

        const accepted = links.filter((link) => link.status === "accepted");
        links = [...normalized, ...accepted];
        persistLinks();
        renderLinks();
        renderNotes();
        setStatus(`Generated ${normalized.length} link proposals.`);
      }
    );
  };

  const acceptLinkById = (linkId) => {
    links = links.map((link) => (link.id === linkId ? { ...link, status: "accepted" } : link));
    persistLinks();
    renderLinks();
    renderNotes();
    setStatus("Link accepted.");
  };

  const dismissLinkById = (linkId) => {
    links = links.filter((link) => link.id !== linkId);
    persistLinks();
    renderLinks();
    renderNotes();
    setStatus("Link removed.");
  };

  const acceptAllSuggested = () => {
    const count = getSuggestedLinks().length;
    if (!count) {
      setStatus("No suggested links to accept.");
      return;
    }

    links = links.map((link) => (link.status === "suggested" ? { ...link, status: "accepted" } : link));
    persistLinks();
    renderLinks();
    renderNotes();
    setStatus(`Accepted ${count} links.`);
  };

  const clearSuggested = () => {
    const before = links.length;
    links = links.filter((link) => link.status !== "suggested");
    const removed = before - links.length;

    if (!removed) {
      setStatus("No proposals to clear.");
      return;
    }

    persistLinks();
    renderLinks();
    setStatus(`Cleared ${removed} proposals.`);
  };

  const exportObsidian = () => {
    const dataset = getFilteredNotes();
    if (!dataset.length) {
      setStatus("No notes to export.", true);
      return;
    }

    const accepted = getAcceptedLinks();
    const relatedMap = buildRelatedMap(accepted);
    const folder = `inspiration-obsidian-${buildStamp()}`;

    dataset.forEach((note) => {
      const fileName = `${toSafeFileName(note.title, note.id)}-${note.id.slice(0, 6)}.md`;
      const md = buildObsidianMarkdown(note, relatedMap.get(note.id) || []);
      downloadTextFile(md, `${folder}/${fileName}`, "text/markdown", false);
    });

    const indexLines = ["# Inspiration Obsidian Export", "", `Exported at: ${new Date().toISOString()}`, "", "## Notes"];
    dataset.forEach((note) => {
      const linked = getConnectedCount(note.id);
      indexLines.push(`- ${note.title || "Untitled"} (links: ${linked})`);
    });

    downloadTextFile(indexLines.join("\n"), `${folder}/_index.md`, "text/markdown", false);
    setStatus(`Obsidian markdown export queued (${dataset.length} notes + index).`);
  };

  const loadAllData = () => {
    chrome.storage.local.get([STORAGE_KEY, ...LEGACY_KEYS, LINKS_KEY, AGENT_CONFIG_KEY, UI_PREFS_KEY], (result) => {
      let storedNotes = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : null;

      if (!storedNotes) {
        for (const legacyKey of LEGACY_KEYS) {
          if (Array.isArray(result[legacyKey])) {
            storedNotes = result[legacyKey];
            break;
          }
        }
      }

      notes = (storedNotes || []).map(sanitizeNote).filter(Boolean);
      const noteIdSet = new Set(notes.map((note) => note.id));

      const rawLinks = Array.isArray(result[LINKS_KEY]) ? result[LINKS_KEY] : [];
      links = rawLinks.map((item) => sanitizeLink(item, noteIdSet)).filter(Boolean);

      if (!Array.isArray(result[STORAGE_KEY]) && storedNotes) {
        persistNotes();
        setStatus("Legacy notes upgraded with source metadata and categories.");
      }

      const rawAgent = result[AGENT_CONFIG_KEY];
      if (rawAgent && typeof rawAgent === "object") {
        agentConfig = {
          endpoint: typeof rawAgent.endpoint === "string" && rawAgent.endpoint ? rawAgent.endpoint : DEFAULT_AGENT_CONFIG.endpoint,
          model: typeof rawAgent.model === "string" && rawAgent.model ? rawAgent.model : DEFAULT_AGENT_CONFIG.model,
          apiKey: typeof rawAgent.apiKey === "string" ? rawAgent.apiKey : "",
          systemPrompt:
            typeof rawAgent.systemPrompt === "string" && rawAgent.systemPrompt
              ? rawAgent.systemPrompt
              : DEFAULT_AGENT_CONFIG.systemPrompt,
          temperature:
            Number.isFinite(Number(rawAgent.temperature)) && Number(rawAgent.temperature) >= 0 && Number(rawAgent.temperature) <= 2
              ? Number(rawAgent.temperature)
              : DEFAULT_AGENT_CONFIG.temperature
        };
      } else {
        agentConfig = { ...DEFAULT_AGENT_CONFIG };
      }

      const rawUiPrefs = result[UI_PREFS_KEY];
      if (rawUiPrefs && typeof rawUiPrefs === "object") {
        const left = Number(rawUiPrefs.position?.left);
        const bottom = Number(rawUiPrefs.position?.bottom);
        const top = Number(rawUiPrefs.position?.top);
        let position = null;

        if (Number.isFinite(left) && Number.isFinite(bottom)) {
          position = { left, bottom };
        } else if (Number.isFinite(left) && Number.isFinite(top)) {
          position = {
            left,
            bottom: Math.max(12, window.innerHeight - top - (toggleBtn.offsetHeight || 40))
          };
        }

        uiPrefs = {
          locked: Boolean(rawUiPrefs.locked),
          position
        };
      } else {
        uiPrefs = {
          position: null,
          locked: false
        };
      }

      applyAgentConfigToForm(agentConfig);
      applyPanelPosition();
      syncLockUi();
      renderNotes();
      renderLinks();
    });
  };

  const togglePositionLock = () => {
    uiPrefs.locked = !uiPrefs.locked;
    syncLockUi();
    persistUiPrefs();
    setStatus(uiPrefs.locked ? "Bubble position locked." : "Bubble position unlocked.");
  };

  toggleBtn.addEventListener("click", () => {
    if (Date.now() < suppressToggleClickUntil) {
      return;
    }
    toggleCollapsed(false);
  });
  collapseBtn.addEventListener("click", () => toggleCollapsed(true));
  toggleLockBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePositionLock();
  });
  toggleBtn.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    togglePositionLock();
  });
  toggleBtn.addEventListener("pointerdown", startDrag);
  toggleBtn.addEventListener("pointermove", handleDragMove);
  toggleBtn.addEventListener("pointerup", stopDrag);
  toggleBtn.addEventListener("pointercancel", stopDrag);
  toggleBtn.addEventListener("lostpointercapture", stopDrag);

  window.addEventListener("pointermove", handleDragMove);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
  document.addEventListener("pointerdown", handleOutsidePointerDown, true);

  useSelectionBtn.addEventListener("click", () => {
    const selected = window.getSelection()?.toString().trim();
    if (!selected) {
      setStatus("No selected text found.", true);
      return;
    }

    contentInput.value = contentInput.value.trim() ? `${contentInput.value.trim()}\n\n${selected}` : selected;
    setStatus("Inserted selected text.");
  });

  readClipboardBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setStatus("Clipboard is empty.", true);
        return;
      }
      contentInput.value = text;
      setStatus("Clipboard text loaded.");
    } catch {
      setStatus("Cannot read clipboard here. Paste with Ctrl+V instead.", true);
    }
  });

  autoCategoryBtn.addEventListener("click", () => {
    const inferred = inferCategory(
      titleInput.value.trim(),
      contentInput.value.trim(),
      draftSource?.sourceUrl || location.href
    );
    categorySelect.value = inferred;
    setStatus(`Category suggested: ${CATEGORY_LABEL[inferred] || inferred}`);
  });

  saveBtn.addEventListener("click", saveOrUpdateNote);

  cancelEditBtn.addEventListener("click", () => {
    resetEditor();
    setStatus("Edit canceled.");
  });

  contentInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveOrUpdateNote();
    }
  });

  exportTxtBtn.addEventListener("click", () => {
    if (!notes.length) {
      setStatus("No notes to export.", true);
      return;
    }
    downloadTextFile(buildTextExport(notes), `inspiration-notes-${buildStamp()}.txt`, "text/plain", true);
  });

  exportJsonBtn.addEventListener("click", () => {
    if (!notes.length) {
      setStatus("No notes to export.", true);
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      noteCount: notes.length,
      links,
      notes
    };

    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `inspiration-notes-${buildStamp()}.json`,
      "application/json",
      true
    );
  });

  exportObsidianBtn.addEventListener("click", exportObsidian);

  clearBtn.addEventListener("click", () => {
    if (!notes.length && !links.length) {
      setStatus("Nothing to clear.");
      return;
    }

    if (!window.confirm("Clear all saved notes and links?")) {
      return;
    }

    notes = [];
    links = [];
    persistNotes();
    persistLinks();
    renderNotes();
    renderLinks();
    resetEditor();
    briefOutput.value = "";
    agentResponseOutput.value = "";
    setStatus("All notes and links cleared.");
  });

  filterCategorySelect.addEventListener("change", () => {
    renderNotes();
    renderLinks();
  });
  searchInput.addEventListener("input", () => {
    renderNotes();
    renderLinks();
  });

  showArchivedCheckbox.addEventListener("change", () => {
    renderNotes();
    renderLinks();
  });

  generateBriefBtn.addEventListener("click", () => {
    const filtered = getFilteredNotes();
    if (!filtered.length) {
      setStatus("No notes available for AI brief.", true);
      return;
    }

    briefOutput.value = buildAIBrief(filtered);
    setStatus("AI brief generated from current filtered notes.");
  });

  copyBriefBtn.addEventListener("click", async () => {
    const source = briefOutput.value.trim() || (getFilteredNotes().length ? buildAIBrief(getFilteredNotes()) : "");
    if (!source) {
      setStatus("No brief available to copy.", true);
      return;
    }

    try {
      await navigator.clipboard.writeText(source);
      if (!briefOutput.value.trim()) {
        briefOutput.value = source;
      }
      setStatus("AI brief copied to clipboard.");
    } catch {
      setStatus("Clipboard write failed. Copy manually from the brief box.", true);
    }
  });

  exportBriefBtn.addEventListener("click", () => {
    const source = briefOutput.value.trim() || (getFilteredNotes().length ? buildAIBrief(getFilteredNotes()) : "");
    if (!source) {
      setStatus("No brief available to export.", true);
      return;
    }

    if (!briefOutput.value.trim()) {
      briefOutput.value = source;
    }

    downloadTextFile(source, `inspiration-agent-pack-${buildStamp()}.md`, "text/markdown", true);
  });

  autoLinkBtn.addEventListener("click", handleAutoLink);
  acceptLinksBtn.addEventListener("click", acceptAllSuggested);
  clearLinksBtn.addEventListener("click", clearSuggested);

  linkListEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const linkId = target.dataset.id;
    if (!linkId) {
      return;
    }

    if (target.classList.contains("icp-link-accept")) {
      acceptLinkById(linkId);
      return;
    }

    if (target.classList.contains("icp-link-dismiss")) {
      dismissLinkById(linkId);
    }
  });

  saveAgentBtn.addEventListener("click", () => {
    agentConfig = getAgentConfigFromForm();
    persistAgentConfig(agentConfig);
    setStatus("Agent API settings saved locally.");
  });

  askAgentBtn.addEventListener("click", () => {
    const filtered = getFilteredNotes();
    if (!filtered.length) {
      setStatus("No notes available. Save notes before asking agent.", true);
      return;
    }

    const question = agentQuestionInput.value.trim();
    if (!question) {
      setStatus("Please type your agent question.", true);
      return;
    }

    const config = getAgentConfigFromForm();
    if (!config.apiKey) {
      setStatus("Please provide API key in Agent API Settings.", true);
      return;
    }

    askAgentBtn.disabled = true;
    askAgentBtn.textContent = "Asking...";

    chrome.runtime.sendMessage(
      {
        type: "ASK_AGENT",
        config,
        question,
        context: buildAgentContext(filtered)
      },
      (response) => {
        askAgentBtn.disabled = false;
        askAgentBtn.textContent = "Ask Agent";

        if (!response?.ok) {
          const message = response?.error || chrome.runtime.lastError?.message || "Agent request failed.";
          setStatus(message, true);
          return;
        }

        agentResponseOutput.value = response.answer || "(No response text)";
        setStatus("Agent replied based on current filtered notes.");
      }
    );
  });

  copyAgentBtn.addEventListener("click", async () => {
    const answer = agentResponseOutput.value.trim();
    if (!answer) {
      setStatus("No agent reply to copy.", true);
      return;
    }

    try {
      await navigator.clipboard.writeText(answer);
      setStatus("Agent reply copied.");
    } catch {
      setStatus("Clipboard write failed. Copy manually from response box.", true);
    }
  });

  notesList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const noteId = target.dataset.id;
    if (!noteId) {
      return;
    }

    if (target.classList.contains("icp-make-todo")) {
      updateNoteExecutionState(noteId, "todo");
      return;
    }

    if (target.classList.contains("icp-complete")) {
      updateNoteExecutionState(noteId, "archived");
      return;
    }

    if (target.classList.contains("icp-restore")) {
      updateNoteExecutionState(noteId, "todo");
      return;
    }

    if (target.classList.contains("icp-edit")) {
      loadEditorForNote(noteId);
      return;
    }

    if (target.classList.contains("icp-delete")) {
      removeNote(noteId);
    }
  });

  loadAllData();
  resetEditor();
})();














