import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/api/shell";
import type { Plugin } from "../sdk";
import { runImport } from "../../lib/import";
import {
  indexWhatsappIos,
  listWhatsappMessages,
  listWhatsappThreads,
  type WhatsappMessageRow,
  type WhatsappThreadSummary
} from "../../lib/whatsapp";

function Instructions() {
  return (
    <div className="stack">
      <p className="hint">
        Import WhatsApp chat history via iOS “Export Chat”.
      </p>
      <ol className="list">
        <li className="listRow">
          <div>
            <div className="listTitle">1) Export chat</div>
            <div className="hint">
              In WhatsApp (iOS): chat → contact/group → Export Chat.
            </div>
          </div>
        </li>
        <li className="listRow">
          <div>
            <div className="listTitle">2) Save files</div>
            <div className="hint">
              Save the export (ZIP or a folder containing a .txt and media).
            </div>
          </div>
        </li>
        <li className="listRow">
          <div>
            <div className="listTitle">3) Import</div>
            <div className="hint">Use the import wizard (Step 05).</div>
          </div>
        </li>
      </ol>
    </div>
  );
}

function Viewer({ pluginId: _pluginId }: { pluginId: string }) {
  const accountId = "default";
  const [threads, setThreads] = useState<WhatsappThreadSummary[]>([]);
  const [threadId, setThreadId] = useState<string>("default");
  const [messages, setMessages] = useState<WhatsappMessageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [chatFile, setChatFile] = useState<string>("");

  const activeThread = useMemo(
    () => threads.find((t) => t.id === threadId) ?? null,
    [threads, threadId]
  );

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const idx = await indexWhatsappIos(accountId);
      setChatFile(idx.chatFilePath);
      const t = await listWhatsappThreads(accountId);
      setThreads(t);
      const chosen = t[0]?.id ?? "default";
      setThreadId(chosen);
      const msgs = await listWhatsappMessages({ accountId, threadId: chosen, limit: 500 });
      setMessages(msgs);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!threadId) return;
    setError(null);
    listWhatsappMessages({ accountId, threadId, limit: 500 })
      .then(setMessages)
      .catch((e) => setError(String(e)));
  }, [threadId]);

  return (
    <section className="card">
      <h3>Chat</h3>
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button className="button" onClick={refresh} disabled={busy}>
          {busy ? "Indexing…" : "Re-index + Reload"}
        </button>
        {chatFile ? (
          <button className="button" onClick={() => open(chatFile)}>
            Open _chat.txt
          </button>
        ) : null}
      </div>

      <div className="threadBar">
        <div className="fieldLabel">Thread</div>
        <select
          className="select"
          value={threadId}
          onChange={(e) => setThreadId(e.target.value)}
        >
          {threads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.messageCount})
            </option>
          ))}
        </select>
      </div>

      <div className="chatBox">
        {messages.map((m) => (
          <div key={m.id} className="chatMsg">
            <div className="chatMeta">
              <span className="chatSender">{m.sender}</span>
              <span className="chatId">#{m.id}</span>
            </div>
            <div className="chatBody">{m.body}</div>
            {m.attachmentFilename ? (
              <div className="chatAttachment">
                Attachment: <span className="mono">{m.attachmentFilename}</span>
                <span className="hint">
                  (Open via Raw Browser for now)
                </span>
              </div>
            ) : null}
          </div>
        ))}
        {messages.length === 0 ? <p className="hint">(no messages)</p> : null}
      </div>

      {activeThread ? (
        <p className="hint">
          Showing first {messages.length} messages from {activeThread.title}.
        </p>
      ) : null}
    </section>
  );
}

export const whatsappIosExportPlugin: Plugin = {
  metadata: {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Import via iOS chat export (offline export).",
    icon: "💬"
  },
  Instructions,
  Viewer,
  importer: async (context) => {
    const result = await runImport({
      pluginId: context.pluginId,
      accountId: context.accountId,
      displayName: context.displayName ?? null,
      sourcePath: context.sourcePath
    });

    // Index after import.
    await indexWhatsappIos(context.accountId);
    return result;
  },
  rawBrowserHints: {
    rootLabel: "WhatsApp raw export"
  }
};
