# Task 10: File & Image Uploads

**Milestone**: [M2 - Core Messaging](../../milestones/milestone-2-core-messaging.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 7 (DM)
**Status**: Not Started

---

## Objective

Implement file and image uploads in chat using signed-URL two-phase upload pattern from acp-tanstack-cloudflare.

---

## Steps

### 1. Upload API
- `/api/upload/signed-url` — generates signed GCS upload URL
- File metadata stored in Firestore (name, size, type, URL)
- Size limit enforcement (e.g., 10MB)

### 2. Upload UI
- Drag-and-drop zone on chat input
- Upload button (paperclip icon)
- Progress bar during upload
- Preview thumbnail for images before send

### 3. Inline Rendering
- Images render inline in chat messages (max-width constrained)
- Click to expand in lightbox
- Non-image files render as download link with file icon
- File metadata: name, size, type

### 4. Upload in Messages
- Attach file reference to message document
- Render attachment below message content

---

## Verification

- [ ] User can upload image via drag-and-drop
- [ ] User can upload image via button
- [ ] Upload progress bar displays
- [ ] Images render inline in chat
- [ ] Non-image files render as download links
- [ ] File size limits enforced

---

**Next Task**: [Task 11: Save-as-Memory CTA](../milestone-3-memory-integration/task-11-save-as-memory.md)
