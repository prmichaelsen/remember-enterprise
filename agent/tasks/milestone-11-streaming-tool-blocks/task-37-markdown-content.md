# Task 37: MarkdownContent Component

**Milestone**: [M11 - Streaming & Tool Blocks](../../milestones/milestone-11-streaming-tool-blocks.md)
**Design Reference**: [Audit #3](../../reports/audit-3-chatinterface-messageinput.md)
**Estimated Time**: 1.5 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create a MarkdownContent component for rendering message content as formatted markdown. Support code blocks with syntax highlighting, inline code, links, lists, bold/italic. Replace raw text rendering in MessageBubble.

---

## Steps

### 1. Install markdown dependencies
- `npm install react-markdown remark-gfm`
- Optional: `rehype-highlight` or `shiki` for syntax highlighting (evaluate bundle size)

### 2. Create MarkdownContent component
- File: `src/components/chat/MarkdownContent.tsx`
- Props: `{ content: string, className?: string }`
- Use `react-markdown` with `remark-gfm` plugin (tables, strikethrough, task lists)
- Custom renderers via `components` prop:
  - `code`: inline code with `t.elevated` bg, or fenced code block with syntax highlight
  - `a`: links open in new tab, styled with `text-brand-primary`
  - `pre`: code block wrapper with `t.card` styling + copy button
  - `p`, `ul`, `ol`, `li`: proper spacing
  - `strong`, `em`: text styling
- All colors via `useTheme()`

### 3. Create CodeBlock sub-component
- File: `src/components/chat/CodeBlock.tsx`
- Props: `{ code: string, language?: string }`
- Syntax highlighting (lightweight — consider just background + monospace without full highlighter for MVP)
- Copy button in top-right corner
- Language label badge
- `useTheme()` for background (`t.elevated`), border (`t.border`)

### 4. Wire into MessageBubble
- Replace raw `<p>{message.content}</p>` with `<MarkdownContent content={textContent} />`
- Extract text content from message (handle string vs content blocks)

### 5. Wire into StreamingBlockRenderer
- Text blocks in streaming render through MarkdownContent
- Handle partial markdown gracefully (incomplete code blocks during streaming)

---

## Verification

- [ ] Markdown renders: bold, italic, links, lists, code blocks, inline code
- [ ] Code blocks have copy button and language label
- [ ] Links open in new tab
- [ ] All styling uses useTheme()
- [ ] Streaming partial markdown doesn't crash
- [ ] MessageBubble uses MarkdownContent instead of raw text
- [ ] Build passes

---

**Next Task**: None (M11 complete)
