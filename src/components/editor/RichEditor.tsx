"use client";

/**
 * Native rich-text editor for blog posts.
 *  · Formatting: headings, bold/italic/underline/strike, lists, quote, HR,
 *    links, highlight, undo/redo
 *  · Images: toolbar upload, Ctrl+V paste, drag-and-drop — inline in the
 *    text flow, corner-drag resize, align left/center/right, delete
 *  · Tables: insert, add/remove rows & columns, header row
 *  · Video: paste a YouTube / Vimeo / .mp4 link → block at the cursor
 *  · Write | Preview tabs (preview matches the public post page exactly)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, FontFamily } from "@tiptap/extension-text-style";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { uploadImage, resolveImageSrc, resolveHtmlImages, isFirestoreImage } from "@/lib/uploads";

const TRANSPARENT =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/* Fonts offered by the toolbar picker. Values are the CSS vars defined in
   layout.tsx via next/font/google, so the public post page renders the exact
   same self-hosted face — no runtime third-party requests. */
const FONTS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Newsreader", value: "var(--font-body)" },
  { label: "Playfair Display", value: "var(--font-display)" },
  { label: "Fraunces", value: "var(--font-display-light)" },
  { label: "Space Grotesk", value: "var(--font-ui)" },
  { label: "Inter", value: "var(--font-inter)" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif" },
  { label: "Calibri", value: "Calibri, Carlito, system-ui, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', system-ui, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "JetBrains Mono", value: "var(--font-jetbrains)" },
  { label: "Lora", value: "var(--font-lora)" },
  { label: "Caveat", value: "var(--font-caveat)" },
];

/* ------------------------------ video node ----------------------------- */

export type VideoKind = "youtube" | "vimeo" | "file";

export function detectVideo(raw: string): { kind: VideoKind; src: string; embed: string } | null {
  const url = raw.trim();
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) {
    return {
      kind: "youtube",
      src: url,
      embed: `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&vq=720`,
    };
  }
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return { kind: "vimeo", src: url, embed: `https://player.vimeo.com/video/${m[1]}` };
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return { kind: "file", src: url, embed: url };
  return null;
}

function VideoNodeView({ node, selected }: ReactNodeViewProps) {
  const [playing, setPlaying] = useState(false);
  const { embed, kind } = node.attrs as {
    src: string;
    embed: string;
    kind: VideoKind;
  };

  return (
    <NodeViewWrapper
      className={`video-shell ${selected ? "is-selected" : ""}`}
      contentEditable={false}
    >
      {playing ? (
        kind === "file" ? (
          <video className="video-player" src={embed} controls preload="metadata" />
        ) : (
          <iframe
            className="video-player"
            src={embed}
            title="Embedded video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      ) : (
        <button type="button" className="video-play" onClick={() => setPlaying(true)}>
          <span className="play-glyph" aria-hidden="true">
            ▶
          </span>
          <span className="video-meta">
            <strong>Play video</strong>
            <small>{kind === "file" ? "Direct video" : kind === "vimeo" ? "Vimeo" : "YouTube"}</small>
          </span>
        </button>
      )}
    </NodeViewWrapper>
  );
}

const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: "" },
      embed: { default: "" },
      kind: { default: "youtube" as VideoKind },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-video-embed]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-video-embed": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});

/* ------------------------------- image node ---------------------------- */

function ImageNodeView(props: ReactNodeViewProps) {
  const { node, updateAttributes, selected, deleteNode, editor } = props;
  const { src, dataImg, width, align, alt } = node.attrs as {
    src: string;
    alt?: string;
    width?: string | null;
    align?: string | null;
    dataImg?: string | null;
  };
  const [preview, setPreview] = useState(() =>
    dataImg || src === TRANSPARENT ? "" : src
  );

  useEffect(() => {
    let alive = true;
    if (dataImg) {
      resolveImageSrc(dataImg).then((r) => {
        if (alive && r) setPreview(r);
      });
    } else {
      Promise.resolve(src).then((s) => {
        if (alive && s && s !== TRANSPARENT) setPreview(s);
      });
    }
    return () => {
      alive = false;
    };
  }, [src, dataImg]);

  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ startX: number; startW: number; dir: 1 | -1 } | null>(null);

  const onHandleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = imgRef.current;
    if (!el) return;
    const dir: 1 | -1 = (e.currentTarget as HTMLElement).classList.contains("img-handle-l")
      ? 1
      : -1;
    drag.current = { startX: e.clientX, startW: el.getBoundingClientRect().width, dir };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const delta = (e.clientX - drag.current.startX) * drag.current.dir;
    const max = editor.view.dom.getBoundingClientRect().width || 720;
    const w = Math.round(drag.current.startW + delta);
    updateAttributes({ width: `${Math.max(90, Math.min(w, max))}px` });
  };
  const onHandleUp = () => {
    drag.current = null;
  };

  return (
    <NodeViewWrapper as="span" className={`img-node ${selected ? "is-selected" : ""}`}>
      <span
        className="img-frame"
        contentEditable={false}
        style={{
          width: width ?? undefined,
          float: align === "left" ? "left" : align === "right" ? "right" : undefined,
          display: align === "center" ? "block" : "inline-block",
          margin: align === "center" ? "0.8rem auto" : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={preview || TRANSPARENT}
          alt={alt ?? ""}
          draggable={false}
        />
        {selected && (
          <>
            <span
              className="img-handle img-handle-l"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              title="Drag to resize"
            />
            <span
              className="img-handle img-handle-r"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              title="Drag to resize"
            />
            <span className="img-mini-bar">
              <button
                type="button"
                title="Align left"
                onClick={() => updateAttributes({ align: align === "left" ? null : "left" })}
              >
                ⇤
              </button>
              <button
                type="button"
                title="Center"
                onClick={() => updateAttributes({ align: align === "center" ? null : "center" })}
              >
                ↔
              </button>
              <button
                type="button"
                title="Align right"
                onClick={() => updateAttributes({ align: align === "right" ? null : "right" })}
              >
                ⇥
              </button>
              <button type="button" title="Full width" onClick={() => updateAttributes({ width: null })}>
                100%
              </button>
              <button type="button" className="danger" title="Remove image" onClick={deleteNode}>
                ✕
              </button>
            </span>
          </>
        )}
      </span>
    </NodeViewWrapper>
  );
}

const EditorImage = Image.extend({
  addAttributes() {
    const parent = this.parent?.() ?? {};
    return {
      ...parent,
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => (el as HTMLElement).style.width || null,
        renderHTML: (attrs: { width?: string | null }) =>
          attrs.width ? { style: `width:${attrs.width}` } : {},
      },
      align: {
        default: null,
        renderHTML: (attrs: { align?: string | null }) =>
          attrs.align ? { "data-align": attrs.align } : {},
      },
      dataImg: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-img"),
        renderHTML: (attrs: { dataImg?: string | null }) =>
          attrs.dataImg ? { "data-img": attrs.dataImg } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

/* -------------------------------- toolbar ------------------------------ */

function TBtn({
  on,
  disabled,
  onClick,
  title,
  children,
  wide,
}: {
  on?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={`rte-btn ${on ? "is-on" : ""} ${wide ? "is-wide" : ""}`}
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* -------------------------------- editor ------------------------------- */

export default function RichEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeFont, setActiveFont] = useState("");
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoErr, setVideoErr] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Handles that need the editor before it exists read through this ref
  // (assigned in an effect right after `insertFiles` is defined below).
  const insertRef = useRef<((files: File[]) => Promise<void>) | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      EditorImage.configure({ inline: true, allowBase64: true }),
      TextStyle,
      FontFamily,
      Highlight,
      Placeholder.configure({
        placeholder:
          "Write your story…\nTip: paste an image straight from your clipboard (Ctrl+V), or drop files here.",
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      VideoEmbed,
    ],
    content: initialHtml,
    editorProps: {
      attributes: { class: "rte-prose" },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length) {
          event.preventDefault();
          void insertRef.current?.(files);
          return true;
        }
        return false;
      },
      handleDrop(view, event) {
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length) {
          event.preventDefault();
          void insertRef.current?.(files);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
      setActiveFont(e.getAttributes("textStyle").fontFamily ?? "");
    },
    onSelectionUpdate: ({ editor: e }) => {
      setActiveFont(e.getAttributes("textStyle").fontFamily ?? "");
    },
  });

  const insertFiles = useCallback(
    async (files: File[]) => {
      if (!editor) return;
      setUploading(true);
      for (const file of files) {
        try {
          const { url } = await uploadImage(file, "post");
          const alt = file.name.replace(/\.[^.]+$/, "").slice(0, 80);
          if (isFirestoreImage(url)) {
            editor
              .chain()
              .focus()
              .setImage({ src: TRANSPARENT, alt })
              .updateAttributes("image", { dataImg: url })
              .run();
          } else {
            editor.chain().focus().setImage({ src: url, alt }).run();
          }
        } catch {
          /* upload failed — uploading state simply ends */
        }
      }
      setUploading(false);
    },
    [editor]
  );

  useEffect(() => {
    insertRef.current = insertFiles;
  }, [insertFiles]);

  const openPreview = async () => {
    if (!editor) return;
    setPreviewHtml(await resolveHtmlImages(editor.getHTML()));
    setTab("preview");
  };

  const detected = videoUrl ? detectVideo(videoUrl) : null;

  const insertVideo = () => {
    if (!editor || !detected) {
      setVideoErr(
        "Paste a YouTube, Vimeo, or direct video link (.mp4 / .webm / .mov)."
      );
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent({
        type: "videoEmbed",
        attrs: { src: detected.src, embed: detected.embed, kind: detected.kind },
      })
      .run();
    setVideoOpen(false);
    setVideoUrl("");
    setVideoErr("");
    setTab("write");
  };

  const inTable = editor?.isActive("table") ?? false;

  return (
    <div className="rte">
      <div className="rte-tabs" role="tablist" aria-label="Editor mode">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "write"}
          className={tab === "write" ? "is-on" : ""}
          onClick={() => setTab("write")}
        >
          Write
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "preview"}
          className={tab === "preview" ? "is-on" : ""}
          onClick={() => void openPreview()}
        >
          Preview
        </button>
        {uploading && <span className="rte-status">Uploading image…</span>}
      </div>

      {tab === "write" && editor && (
        <>
          <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
            <TBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
              ↶
            </TBtn>
            <TBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
              ↷
            </TBtn>
            <span className="rte-sep" />
            <select
              className="rte-font-select"
              title="Font family"
              aria-label="Font family"
              value={activeFont}
              onChange={(e) => {
                const v = e.target.value;
                if (v) editor.chain().focus().setFontFamily(v).run();
                else editor.chain().focus().unsetFontFamily().run();
              }}
            >
              {FONTS.map((f) => (
                <option
                  key={f.label}
                  value={f.value}
                  style={{ fontFamily: f.value || undefined }}
                >
                  {f.label}
                </option>
              ))}
            </select>
            <span className="rte-sep" />
            <TBtn
              title="Heading 2"
              on={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </TBtn>
            <TBtn
              title="Heading 3"
              on={editor.isActive("heading", { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H3
            </TBtn>
            <span className="rte-sep" />
            <TBtn title="Bold" on={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
              <strong>B</strong>
            </TBtn>
            <TBtn title="Italic" on={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <em>I</em>
            </TBtn>
            <TBtn
              title="Underline"
              on={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <u>U</u>
            </TBtn>
            <TBtn title="Strikethrough" on={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
              <s>S</s>
            </TBtn>
            <TBtn
              title="Highlight"
              on={editor.isActive("highlight")}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              ⬤
            </TBtn>
            <span className="rte-sep" />
            <TBtn
              title="Bullet list"
              on={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              •≡
            </TBtn>
            <TBtn
              title="Numbered list"
              on={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1≡
            </TBtn>
            <TBtn
              title="Quote"
              on={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              ❝
            </TBtn>
            <TBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              —
            </TBtn>
            <span className="rte-sep" />
            <TBtn
              title="Link"
              on={editor.isActive("link")}
              onClick={() => {
                if (editor.isActive("link")) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  const href = window.prompt("Link URL (https://…)");
                  if (href) editor.chain().focus().setLink({ href }).run();
                }
              }}
            >
              🔗
            </TBtn>
            <TBtn title="Insert image" wide onClick={() => fileInput.current?.click()}>
              🖼 Image
            </TBtn>
            <TBtn
              title="Insert table"
              wide
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
            >
              ▦ Table
            </TBtn>
            <TBtn title="Insert video" wide onClick={() => setVideoOpen(true)}>
              ▶ Video
            </TBtn>

            {inTable && (
              <>
                <span className="rte-sep" />
                <TBtn title="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
                  +Row
                </TBtn>
                <TBtn title="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  +Col
                </TBtn>
                <TBtn title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
                  −Row
                </TBtn>
                <TBtn title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
                  −Col
                </TBtn>
                <TBtn
                  title="Toggle header row"
                  on={editor.isActive("table", { headerRow: true })}
                  onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                >
                  Header
                </TBtn>
                <TBtn title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
                  ✕ Table
                </TBtn>
              </>
            )}
          </div>

          <EditorContent editor={editor} />

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) void insertRef.current?.(files);
              e.target.value = "";
            }}
          />
        </>
      )}

      {tab === "preview" && (
        <div className="rte-preview post-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      )}

      {videoOpen && (
        <div className="rte-modal" role="dialog" aria-label="Insert video">
          <div className="rte-modal-card glass">
            <h3>Insert video</h3>
            <p className="muted">
              Paste a YouTube link (unlisted works great), a Vimeo link, or a direct
              .mp4 / .webm / .mov URL. The player sits exactly at your cursor.
            </p>
            <input
              autoFocus
              type="url"
              placeholder="https://youtube.com/watch?v=…"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setVideoErr("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") insertVideo();
              }}
            />
            {detected && (
              <p className="video-detected">
                ✓ {detected.kind === "file" ? "Direct video file" : detected.kind === "vimeo" ? "Vimeo video" : "YouTube video"} detected
              </p>
            )}
            {videoErr && <p className="editor-msg">{videoErr}</p>}
            <div className="editor-actions">
              <button type="button" className="btn-ghost" onClick={() => setVideoOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-gold" onClick={insertVideo}>
                Insert video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
