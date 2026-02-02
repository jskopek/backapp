import { invoke } from "@tauri-apps/api/tauri";
import { isTauri } from "./vault";

export type WhatsappThreadSummary = {
  id: string;
  title: string;
  messageCount: number;
};

export type WhatsappMessageRow = {
  id: number;
  threadId: string;
  tsMs?: number | null;
  sender: string;
  body: string;
  attachmentFilename?: string | null;
};

export async function indexWhatsappIos(accountId: string): Promise<{
  indexedMessages: number;
  indexedAttachments: number;
  chatFilePath: string;
}> {
  if (!isTauri()) {
    return { indexedMessages: 0, indexedAttachments: 0, chatFilePath: "" };
  }
  return invoke("index_whatsapp_ios", { args: { accountId } });
}

export async function listWhatsappThreads(accountId: string): Promise<WhatsappThreadSummary[]> {
  if (!isTauri()) return [];
  return invoke<WhatsappThreadSummary[]>("list_whatsapp_threads", { accountId });
}

export async function listWhatsappMessages(args: {
  accountId: string;
  threadId: string;
  limit?: number;
  offset?: number;
}): Promise<WhatsappMessageRow[]> {
  if (!isTauri()) return [];
  return invoke<WhatsappMessageRow[]>("list_whatsapp_messages", {
    args: {
      accountId: args.accountId,
      threadId: args.threadId,
      limit: args.limit ?? null,
      offset: args.offset ?? null
    }
  });
}

