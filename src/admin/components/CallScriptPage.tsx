import { useState, useEffect, useRef, useCallback } from "react";
import type { MouseEvent as ReactMouseEvent, CSSProperties } from "react";
import {
  PhoneCall,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  CheckCircle2,
  Circle,
  RotateCcw,
  FileText,
  ArrowLeft,
  Maximize2,
  X,
  Type,
  Scissors,
} from "lucide-react";
import {
  newCallScriptBlock,
  type CallScriptBlock,
  type CallScriptBlockKind,
} from "../lib/workspace";

/* ── Constants ──────────────────────────────────────────────────────── */

const KIND_LABELS: Record<CallScriptBlockKind, string> = {
  intro: "Introduction",
  discovery: "Discovery",
  pitch: "Pitch",
  objection: "Objection",
  closing: "Closing",
  custom: "Custom",
};

const KIND_COLORS: Record<CallScriptBlockKind, string> = {
  intro: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  discovery: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  pitch: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  objection: "bg-red-500/15 text-red-400 border-red-500/25",
  closing: "bg-green-500/15 text-green-400 border-green-500/25",
  custom: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
};

const KIND_ORDER: CallScriptBlockKind[] = [
  "intro",
  "discovery",
  "pitch",
  "objection",
  "closing",
  "custom",
];

const STARTER_SCRIPT: Omit<CallScriptBlock, "id">[] = [
  {
    kind: "intro",
    title: "Introduction",
    body: 'Hi [Name], this is [Your Name] from Aurevon Studios. Hope I\'m not catching you at a bad time — I\'ll keep this quick. We build premium websites for local businesses and I noticed yours might benefit from an upgrade. Do you have 2 minutes?',
  },
  {
    kind: "discovery",
    title: "Discovery Questions",
    body: "Great! A few quick questions:\n• What does your business do and who are your main customers?\n• Do you currently have a website? If yes — what's working, what's not?\n• Are you running any ads or relying on word-of-mouth right now?\n• Have you tried getting leads online before?\n• What would a good website mean for your business?",
  },
  {
    kind: "pitch",
    title: "Value Pitch",
    body: "Based on what you've shared — here's what we'd do:\n\nWe build clean, fast websites that actually convert visitors into enquiries. Most of our clients see calls and WhatsApp messages pick up within the first month.\n\nWe handle everything: design, development, content, SEO basics, and launch. You focus on your business — we handle the rest.\n\nProjects typically start from ₹20,000–₹40,000 depending on scope. We work in phases so there's no big upfront risk.",
  },
  {
    kind: "objection",
    title: "Handle Objections",
    body: '"I already have a website" → That\'s great! Would you say it\'s currently bringing in new customers? Most old sites look fine but aren\'t optimized for conversions or mobile.\n\n"Too expensive" → We work within budgets — the question is what\'s it costing you not to have one that works? We also offer phased payment.\n\n"Not the right time" → Totally understand. Can I send over a quick portfolio and we revisit in 2 weeks?\n\n"Let me think about it" → Of course. What specific concerns do you have? Let me address those now so you have everything you need.',
  },
  {
    kind: "closing",
    title: "Close & Next Steps",
    body: "Here's what I'd suggest: let me send you a couple of examples of sites we've built for similar businesses — you can see the quality yourself.\n\nIf it looks interesting, we do a free 20-minute discovery call where I'll sketch out exactly what we'd build for you and give you a fixed quote — no obligation.\n\nCould I get your WhatsApp number to send that across? What's the best time to follow up if you have questions?",
  },
];

/* ── Helpers ────────────────────────────────────────────────────────── */

function uid() {
  return `cs-${Math.random().toString(36).slice(2, 9)}`;
}

// Pasted/imported text is never auto-split into multiple blocks — it comes
// in exactly as one block. Splitting is a deliberate, manual action (select
// text → right-click → "Make a block"), never something the page guesses at.
function wrapAsSingleBlock(raw: string): Omit<CallScriptBlock, "id"> {
  return { kind: "custom", title: "Imported Script", body: raw.trim() };
}

// Short title guess for a newly split-off block, taken from its first line.
function deriveTitle(text: string): string {
  const firstLine = text.split("\n")[0].trim();
  const words = firstLine.split(/\s+/).slice(0, 6).join(" ");
  if (!words) return "New Block";
  return words.length > 40 ? `${words.slice(0, 40)}…` : words;
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-ring/30 transition-colors";
const textareaClass = inputClass + " leading-relaxed";

/* ── Auto-growing textarea ──────────────────────────────────────────────
   Grows to fit its content automatically, so a block's full script is
   always visible the moment it's opened — no manual drag-resizing, and
   nothing to "lose" between visits since there's no fixed height to keep. */
function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  minRows = 4,
  autoFocus,
  onContextMenu,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  autoFocus?: boolean;
  onContextMenu?: (e: ReactMouseEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onContextMenu={onContextMenu}
      placeholder={placeholder}
      rows={minRows}
      autoFocus={autoFocus}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      className={`${className} resize-none overflow-hidden`}
    />
  );
}

/* ── Expanded-block persistence ─────────────────────────────────────────
   Which blocks are open is remembered per script, so the page never
   reverts back to a collapsed state you have to fight with again. */
function expandedKey(scriptId: string) {
  return `aurevon_call_script_expanded_${scriptId}`;
}

function loadExpanded(scriptId: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(expandedKey(scriptId));
    if (!raw) return null;
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return null;
  }
}

function saveExpanded(scriptId: string, ids: Set<string>) {
  try {
    localStorage.setItem(expandedKey(scriptId), JSON.stringify([...ids]));
  } catch {
    // ignore quota errors
  }
}

/* ── Call-mode reading size ──────────────────────────────────────────── */
type ReadingSize = "sm" | "base" | "lg";
const READING_SIZE_KEY = "aurevon_call_reading_size";
const READING_SIZE_CLASSES: Record<ReadingSize, string> = {
  sm: "text-sm leading-relaxed",
  base: "text-[15px] leading-relaxed",
  lg: "text-lg leading-loose",
};

function loadReadingSize(): ReadingSize {
  try {
    const v = localStorage.getItem(READING_SIZE_KEY);
    if (v === "sm" || v === "base" || v === "lg") return v;
  } catch {
    // ignore
  }
  return "base";
}

function saveReadingSize(v: ReadingSize) {
  try {
    localStorage.setItem(READING_SIZE_KEY, v);
  } catch {
    // ignore
  }
}

/* ── Script list view ────────────────────────────────────────────────── */

type ScriptMeta = {
  id: string;
  name: string;
  blocks: CallScriptBlock[];
  updatedAt: string;
};

function blankScript(): ScriptMeta {
  return {
    id: uid(),
    name: "New Script",
    blocks: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadScripts(): ScriptMeta[] {
  try {
    const raw = localStorage.getItem("aurevon_call_scripts");
    if (!raw) return [];
    return JSON.parse(raw) as ScriptMeta[];
  } catch {
    return [];
  }
}

function saveScripts(scripts: ScriptMeta[]) {
  try {
    localStorage.setItem("aurevon_call_scripts", JSON.stringify(scripts));
  } catch {
    // ignore quota errors
  }
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function ScriptListView({
  scripts,
  onSelect,
  onCreate,
}: {
  scripts: ScriptMeta[];
  onSelect: (s: ScriptMeta) => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">
            Cold Outreach
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl text-foreground">
            Call Scripts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">
            Write, import, and follow your cold call scripts. Switch to Call Mode during live calls to follow along step by step.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-medium hover:bg-accent/80 transition-colors"
        >
          <Plus size={14} /> New Script
        </button>
      </div>

      {scripts.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-5 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-2xl border border-border bg-secondary text-accent">
            <PhoneCall size={26} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No scripts yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              Create a script from our proven cold call template, paste one from ChatGPT, or build your own block by block.
            </p>
          </div>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/80 transition-colors"
          >
            <Plus size={14} /> Create your first script
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scripts.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="surface-card group text-left p-5 hover:border-accent/40 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                  <PhoneCall size={16} />
                </div>
                <span className="text-xs text-muted-foreground mt-1.5">
                  {s.blocks.length} block{s.blocks.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                {s.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {new Date(s.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...new Set(s.blocks.map((b) => b.kind))].slice(0, 4).map((k) => (
                  <span
                    key={k}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_COLORS[k]}`}
                  >
                    {KIND_LABELS[k]}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Focus mode: distraction-free editor for long blocks ─────────────── */

function BlockFocusModal({
  block,
  onChange,
  onClose,
  onContextMenu,
}: {
  block: CallScriptBlock;
  onChange: (patch: Partial<CallScriptBlock>) => void;
  onClose: () => void;
  onContextMenu?: (e: ReactMouseEvent<HTMLTextAreaElement>) => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const wordCount = block.body.trim() ? block.body.trim().split(/\s+/).length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${KIND_COLORS[block.kind]}`}
          >
            {KIND_LABELS[block.kind]}
          </span>
          <input
            value={block.title}
            onChange={(e) => onChange({ title: e.target.value })}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="min-w-0 flex-1 bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="Block title…"
          />
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>
        <textarea
          autoFocus
          value={block.body}
          onChange={(e) => onChange({ body: e.target.value })}
          onContextMenu={onContextMenu}
          placeholder="Write your script for this section…"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="flex-1 resize-none overflow-y-auto bg-transparent px-6 py-5 text-[15px] leading-[1.8] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
          <span className="text-xs text-muted-foreground">
            {wordCount} word{wordCount !== 1 ? "s" : ""} · Autosaved · Select text and right-click to split it into its own block
          </span>
          <button
            onClick={onClose}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Split menu: the only way a block ever gets split ─────────────────
   Appears when the user selects text inside a block and right-clicks.
   Splitting never happens automatically — this is the single deliberate
   trigger for it. */
function SplitMenu({
  x,
  y,
  onConfirm,
  onCancel,
}: {
  x: number;
  y: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickAway(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    // Skip the click that opened the menu.
    const t = setTimeout(() => {
      window.addEventListener("mousedown", handleClickAway);
      window.addEventListener("contextmenu", handleClickAway);
    }, 0);
    window.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousedown", handleClickAway);
      window.removeEventListener("contextmenu", handleClickAway);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onCancel]);

  // Keep the menu on-screen near the click point.
  const style: CSSProperties = {
    position: "fixed",
    left: Math.min(x, (typeof window !== "undefined" ? window.innerWidth : x) - 220),
    top: Math.min(y, (typeof window !== "undefined" ? window.innerHeight : y) - 90),
    zIndex: 60,
  };

  return (
    <div ref={ref} style={style} className="min-w-[190px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <button
        onClick={onConfirm}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors"
      >
        <Scissors size={14} className="text-accent" />
        Make a block
      </button>
    </div>
  );
}

/* ── Script editor + call mode ───────────────────────────────────────── */

function ScriptEditor({
  script,
  onSave,
  onDelete,
  onBack,
}: {
  script: ScriptMeta;
  onSave: (s: ScriptMeta) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(script.name);
  const [blocks, setBlocks] = useState<CallScriptBlock[]>(script.blocks);
  const [mode, setMode] = useState<"edit" | "call">("edit");
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [readingSize, setReadingSize] = useState<ReadingSize>(loadReadingSize);
  const [showSaved, setShowSaved] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [splitMenu, setSplitMenu] = useState<{
    blockId: string;
    start: number;
    end: number;
    x: number;
    y: number;
  } | null>(null);

  // Which blocks are open. Defaults to "all open" so the whole script is
  // visible the moment you land on it — no clicking through each block.
  // Once you collapse/expand something, that choice is remembered.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const saved = loadExpanded(script.id);
    if (saved) return saved;
    return new Set(script.blocks.map((b) => b.id));
  });

  function persistExpanded(next: Set<string>) {
    setExpandedIds(next);
    saveExpanded(script.id, next);
  }

  function toggleExpand(id: string) {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persistExpanded(next);
  }

  function expandAll() {
    persistExpanded(new Set(blocks.map((b) => b.id)));
  }

  function collapseAll() {
    persistExpanded(new Set());
  }

  function persist(nextBlocks: CallScriptBlock[], nextName?: string) {
    const updated: ScriptMeta = {
      ...script,
      name: nextName ?? name,
      blocks: nextBlocks,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setBlocks(nextBlocks);
    if (nextName !== undefined) setName(nextName);
    setShowSaved(true);
  }

  useEffect(() => {
    if (!showSaved) return;
    const t = setTimeout(() => setShowSaved(false), 1500);
    return () => clearTimeout(t);
  }, [showSaved]);

  function addBlock(kind: CallScriptBlockKind) {
    const nb = newCallScriptBlock(kind);
    const next = [...blocks, nb];
    persist(next);
    persistExpanded(new Set(expandedIds).add(nb.id));
  }

  function removeBlock(id: string) {
    persist(blocks.filter((b) => b.id !== id));
    const next = new Set(expandedIds);
    next.delete(id);
    persistExpanded(next);
    if (activeBlock === id) setActiveBlock(null);
    if (focusedBlockId === id) setFocusedBlockId(null);
  }

  function updateBlock(id: string, patch: Partial<CallScriptBlock>) {
    const next = blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
    persist(next);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = [...blocks];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    persist(next);
  }

  function loadStarter() {
    const starter = STARTER_SCRIPT.map((s) => ({ ...s, id: uid() }));
    persist(starter);
    persistExpanded(new Set(starter.map((s) => s.id)));
  }

  function handleImport() {
    if (!importText.trim()) return;
    const nb: CallScriptBlock = { ...wrapAsSingleBlock(importText), id: uid() };
    persist([...blocks, nb]);
    persistExpanded(new Set(expandedIds).add(nb.id));
    setImportText("");
    setImporting(false);
  }

  function changeReadingSize(size: ReadingSize) {
    setReadingSize(size);
    saveReadingSize(size);
  }

  // Manual split: user selects text inside a block, right-clicks, and picks
  // "Make a block". The selection becomes its own new block right after the
  // current one; nothing is ever split automatically.
  function handleSplitContextMenu(
    e: ReactMouseEvent<HTMLTextAreaElement>,
    blockId: string,
  ) {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) return; // no selection — let the normal menu show
    e.preventDefault();
    setSplitMenu({ blockId, start, end, x: e.clientX, y: e.clientY });
  }

  function confirmSplit() {
    if (!splitMenu) return;
    const { blockId, start, end } = splitMenu;
    const idx = blocks.findIndex((b) => b.id === blockId);
    setSplitMenu(null);
    if (idx < 0) return;
    const block = blocks[idx];
    const selected = block.body.slice(start, end).trim();
    if (!selected) return;

    const before = block.body.slice(0, start).trimEnd();
    const after = block.body.slice(end).trimStart();
    const remaining = [before, after].filter(Boolean).join("\n\n");

    const newBlock: CallScriptBlock = {
      id: uid(),
      kind: block.kind,
      title: deriveTitle(selected),
      body: selected,
    };

    const next = [...blocks];
    next[idx] = { ...block, body: remaining };
    next.splice(idx + 1, 0, newBlock);
    persist(next);
    persistExpanded(new Set(expandedIds).add(newBlock.id));
  }

  function toggleCheck(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function resetCall() {
    setChecked({});
    setActiveBlock(null);
  }

  const progress =
    blocks.length > 0
      ? Math.round(
          (Object.values(checked).filter(Boolean).length / blocks.length) * 100,
        )
      : 0;

  /* ── Import panel ── */
  if (importing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setImporting(false); setImportText(""); }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back to editor
        </button>
        <div className="surface-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-medium text-foreground">Import Script</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste text from ChatGPT or anywhere else — it comes in as one block, exactly as pasted. Nothing is split automatically.
            </p>
            <p className="mt-2 text-xs text-accent/80 italic">
              To split it up: select the part you want to separate out, right-click, and choose "Make a block".
            </p>
          </div>
          <AutoGrowTextarea
            value={importText}
            onChange={setImportText}
            placeholder="Paste your script here…"
            minRows={14}
            className={textareaClass}
          />
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              Import & Parse
            </button>
            <button
              onClick={() => { setImporting(false); setImportText(""); }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Call mode ── */
  if (mode === "call") {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400">
              <PhoneCall size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">
                Live Call Mode · {progress}% · {Object.values(checked).filter(Boolean).length}/{blocks.length} steps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5">
              {(["sm", "base", "lg"] as ReadingSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => changeReadingSize(size)}
                  title={
                    size === "sm" ? "Small text" : size === "base" ? "Medium text" : "Large text"
                  }
                  className={`rounded-full px-2 py-1 transition-colors ${
                    readingSize === size
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Type size={size === "sm" ? 11 : size === "base" ? 13 : 15} />
                </button>
              ))}
            </div>
            <button
              onClick={resetCall}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
            >
              <RotateCcw size={11} /> Reset
            </button>
            <button
              onClick={() => setMode("edit")}
              className="rounded-full border border-border px-3.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
            >
              Edit Script
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Blocks */}
        <div className="space-y-2.5">
          {blocks.map((block) => {
            const isActive = activeBlock === block.id;
            const isDone = checked[block.id];
            return (
              <div
                key={block.id}
                onClick={() => setActiveBlock(isActive ? null : block.id)}
                className={`cursor-pointer rounded-2xl border transition-all ${
                  isDone
                    ? "border-border/40 bg-background/20 opacity-55"
                    : isActive
                      ? "border-accent/50 bg-card shadow-[0_0_0_1px_hsl(var(--accent)/0.25)]"
                      : "border-border bg-card/40 hover:border-border/70 hover:bg-card/60"
                }`}
              >
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCheck(block.id);
                    }}
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isDone
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={12} strokeWidth={3} /> : <Circle size={12} className="opacity-0" />}
                  </button>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_COLORS[block.kind]}`}
                  >
                    {KIND_LABELS[block.kind]}
                  </span>
                  <span
                    className={`flex-1 text-sm font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {block.title}
                  </span>
                  {isActive ? (
                    <ChevronUp size={14} className="shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
                  )}
                </div>
                {isActive && (
                  <div className="border-t border-border/60 px-5 py-4">
                    <p
                      className={`whitespace-pre-wrap text-foreground/90 ${READING_SIZE_CLASSES[readingSize]}`}
                    >
                      {block.body || (
                        <span className="italic text-muted-foreground">No content.</span>
                      )}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCheck(block.id);
                      }}
                      className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                        isDone
                          ? "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      }`}
                    >
                      {isDone ? "Mark as pending" : "✓ Mark complete"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {progress === 100 && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-center">
            <p className="text-sm font-semibold text-green-400">Script complete 🎉</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Great call. Add the lead to your pipeline and set a follow-up date.
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ── Edit mode ── */
  return (
    <div className="space-y-4">
      {/* Edit header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
          </button>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              persist(blocks, e.target.value);
            }}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="bg-transparent text-xl font-medium text-foreground focus:outline-none border-b border-transparent focus:border-accent/40 transition-colors pb-0.5"
            placeholder="Script name…"
          />
          <span
            className={`text-[11px] text-muted-foreground/70 transition-opacity duration-500 ${
              showSaved ? "opacity-100" : "opacity-0"
            }`}
          >
            Saved
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setImporting(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <FileText size={12} /> Paste / Import
          </button>
          {blocks.length === 0 && (
            <button
              onClick={loadStarter}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Load Starter
            </button>
          )}
          <button
            onClick={() => {
              setMode("call");
              setActiveBlock(blocks[0]?.id ?? null);
            }}
            disabled={blocks.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors disabled:opacity-40"
          >
            <PhoneCall size={12} /> Start Call
          </button>
          <button
            onClick={() => onDelete(script.id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Delete script"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="surface-card flex flex-col items-center gap-4 py-12 text-center">
          <div className="grid size-12 place-items-center rounded-2xl border border-border bg-secondary text-accent">
            <PhoneCall size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No blocks yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Load the starter template or add blocks one by one below.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={loadStarter}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors"
            >
              Load Starter Script
            </button>
            <button
              onClick={() => setImporting(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
            >
              Paste from ChatGPT
            </button>
          </div>
        </div>
      )}

      {/* Blocks */}
      {blocks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
              <Scissors size={11} /> Select text in a block and right-click to split it into a new one
            </span>
            {blocks.length > 1 && (
              <div className="flex gap-3">
                <button
                  onClick={expandAll}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronsUpDown size={12} /> Expand all
                </button>
                <button
                  onClick={collapseAll}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronsDownUp size={12} /> Collapse all
                </button>
              </div>
            )}
          </div>
          {blocks.map((block, idx) => {
            const isEditing = expandedIds.has(block.id);
            return (
              <div
                key={block.id}
                className="surface-card overflow-hidden p-0"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Reorder */}
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      onClick={() => moveBlock(block.id, -1)}
                      disabled={idx === 0}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => moveBlock(block.id, 1)}
                      disabled={idx === blocks.length - 1}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  {/* Kind */}
                  <select
                    value={block.kind}
                    onChange={(e) =>
                      updateBlock(block.id, {
                        kind: e.target.value as CallScriptBlockKind,
                      })
                    }
                    className={`shrink-0 cursor-pointer rounded-full border bg-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider focus:outline-none ${KIND_COLORS[block.kind]}`}
                  >
                    {KIND_ORDER.map((k) => (
                      <option key={k} value={k} className="text-foreground bg-background">
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>

                  {/* Title */}
                  <input
                    value={block.title}
                    onChange={(e) =>
                      updateBlock(block.id, { title: e.target.value })
                    }
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                    placeholder="Block title…"
                  />

                  {/* Focus / expand / delete */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setFocusedBlockId(block.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      title="Open in focus mode"
                    >
                      <Maximize2 size={13} />
                    </button>
                    <button
                      onClick={() => toggleExpand(block.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      {isEditing ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="rounded-lg p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-border/60 px-4 pb-4 pt-3">
                    <AutoGrowTextarea
                      value={block.body}
                      onChange={(v) => updateBlock(block.id, { body: v })}
                      onContextMenu={(e) => handleSplitContextMenu(e, block.id)}
                      minRows={4}
                      className={textareaClass}
                      placeholder="Write your script for this section…"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add block row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-muted-foreground">Add block:</span>
        {KIND_ORDER.map((kind) => (
          <button
            key={kind}
            onClick={() => addBlock(kind)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-opacity hover:opacity-75 ${KIND_COLORS[kind]}`}
          >
            + {KIND_LABELS[kind]}
          </button>
        ))}
      </div>

      {/* Focus mode overlay */}
      {focusedBlockId &&
        (() => {
          const focused = blocks.find((b) => b.id === focusedBlockId);
          if (!focused) return null;
          return (
            <BlockFocusModal
              block={focused}
              onChange={(patch) => updateBlock(focused.id, patch)}
              onClose={() => setFocusedBlockId(null)}
              onContextMenu={(e) => handleSplitContextMenu(e, focused.id)}
            />
          );
        })()}

      {/* Manual split menu — appears only when text is selected and
          right-clicked; nothing ever splits on its own. */}
      {splitMenu && (
        <SplitMenu
          x={splitMenu.x}
          y={splitMenu.y}
          onConfirm={confirmSplit}
          onCancel={() => setSplitMenu(null)}
        />
      )}
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────────────── */

export function CallScriptPage() {
  const [scripts, setScripts] = useState<ScriptMeta[]>(loadScripts);
  const [active, setActive] = useState<ScriptMeta | null>(null);

  function persistAll(next: ScriptMeta[]) {
    setScripts(next);
    saveScripts(next);
  }

  function handleCreate() {
    const s = blankScript();
    persistAll([...scripts, s]);
    setActive(s);
  }

  function handleSave(updated: ScriptMeta) {
    const next = scripts.map((s) => (s.id === updated.id ? updated : s));
    persistAll(next);
    setActive(updated);
  }

  function handleDelete(id: string) {
    persistAll(scripts.filter((s) => s.id !== id));
    setActive(null);
  }

  if (active) {
    return (
      <ScriptEditor
        script={active}
        onSave={handleSave}
        onDelete={handleDelete}
        onBack={() => setActive(null)}
      />
    );
  }

  return (
    <ScriptListView
      scripts={scripts}
      onSelect={setActive}
      onCreate={handleCreate}
    />
  );
}
