# 08 — Plugin: WhatsApp (iOS Chat Export Import + Chat Viewer)

## Goal
Support importing WhatsApp **iOS chat exports**, indexing messages and attachments, and showing them in a chat-thread style viewer.

## Input Format (v1)
iOS WhatsApp export typically produces:
- A `.txt` chat transcript
- Optional media attachments (images/videos) included alongside or in a zip/share bundle

## Deliverables
- Importer that:
  - accepts a folder or zip containing the export
  - copies into `raw/`
  - parses the `.txt` transcript into `index.sqlite`
  - links attachments to messages when possible
- Viewer that:
  - renders chat bubbles by speaker
  - supports search (basic)
  - shows media attachments inline (when available)

## SQLite Schema (suggested)
- `conversations`
  - `id`
  - `display_name`
- `participants`
  - `id`, `name`
- `messages`
  - `id`
  - `conversation_id`
  - `sender`
  - `sent_at`
  - `text`
  - `attachment_path` (nullable)

## Steps
1) Define supported transcript variants
   - WhatsApp exports vary by locale/date formatting
   - Start with common US-style format; design parser to be extendable

2) Implement transcript parsing
   - Parse timestamp, sender, message body
   - Handle multi-line messages
   - Mark “system” messages separately (optional)

3) Attachment linking
   - Best-effort matching by filename references in transcript
   - Otherwise expose attachments in a separate tab

4) Build chat viewer
   - Conversation picker (if multiple exports imported)
   - Message list (virtualized)
   - Search within conversation

## Acceptance Criteria
- Import of an iOS export produces messages in viewer.
- Attachments are viewable (at least via raw browser).

