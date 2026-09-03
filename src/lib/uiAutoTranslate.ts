/**
 * Whole-app runtime localisation.
 *
 * Any user-visible text that a component did not localise explicitly through
 * `t()` is translated here: the DOM is scanned for text nodes and translatable
 * attributes, each string is resolved against (1) the static phrase dictionary,
 * (2) a persistent browser cache and (3) the `translate-ui` backend function,
 * and the result is written back into the DOM. A MutationObserver keeps newly
 * rendered content (dialogs, toasts, tables, dynamic data) translated too.
 */
import { supabase } from "@/integrations/supabase/client";
import { translatePhrase } from "@/i18n";

type Lang = "en" | "hi";

const CACHE_KEY = "mbd-ui-translations-v1";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG", "PATH", "TEXTAREA", "IFRAME", "CANVAS"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt"];

const DEVANAGARI = /[\u0900-\u097F]/;
const HAS_LETTER = /[A-Za-z\u0900-\u097F]/;
const LATIN_LETTER = /[A-Za-z]/;

/** in-memory cache: `${lang}\u0000${source}` -> translation */
const memory = new Map<string, string>();
/** strings we already asked the backend for and got nothing back (avoid loops) */
const failed = new Set<string>();
const pending = new Set<string>();

let currentLang: Lang = "en";
let observer: MutationObserver | null = null;
let flushTimer: number | null = null;
let scanTimer: number | null = null;
let started = false;

const originals = new WeakMap<Node, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();

const key = (lang: Lang, source: string) => `${lang}\u0000${source}`;

const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(parsed)) memory.set(k, v);
  } catch {
    /* ignore */
  }
};

let saveTimer: number | null = null;
const saveCache = () => {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memory)));
    } catch {
      /* quota — ignore */
    }
  }, 800);
};

const SEPARATOR = /\s*(?:\/|—|–|\||·)\s*/;

/**
 * Bilingual labels such as "Registration type / रजिस्ट्रेशन प्रकार" are reduced
 * to the side that matches the active language.
 */
const pickBilingual = (src: string, lang: Lang): string | null => {
  if (!DEVANAGARI.test(src) || !LATIN_LETTER.test(src)) return null;
  const parts = src.split(SEPARATOR).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const isTarget = (p: string) =>
    lang === "hi" ? DEVANAGARI.test(p) && !LATIN_LETTER.test(p) : LATIN_LETTER.test(p) && !DEVANAGARI.test(p);
  const wanted = parts.filter(isTarget);
  const other = parts.filter((p) => !isTarget(p));
  if (wanted.length === 0 || other.length === 0) return null;
  return wanted.join(" / ");
};

const translatable = (raw: string): boolean => {
  const s = raw.trim();
  if (s.length < 2 || s.length > 400) return false;
  if (!HAS_LETTER.test(s)) return false;
  if (/^https?:\/\//i.test(s)) return false;
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(s)) return false;
  if (/^[A-Z]{2}[A-Z0-9]{6}$/.test(s)) return false; // agent / merchant codes
  return true;
};

/** Resolve a source string, queueing a backend translation when unknown. */
const resolve = (source: string, lang: Lang): string | null => {
  const src = source.trim();
  if (!translatable(src)) return null;

  // strings that already contain no text of the "other" language need no work
  const letters = src.match(/[A-Za-z\u0900-\u097F]/g) ?? [];
  const hiCount = src.match(/[\u0900-\u097F]/g)?.length ?? 0;
  const enCount = letters.length - hiCount;
  const otherShare = letters.length === 0 ? 0 : (lang === "hi" ? enCount : hiCount) / letters.length;
  // mostly already in the target language (brand names such as WhatsApp / UPI remain)
  if (otherShare < 0.2) return null;

  const fromDict = translatePhrase(src, lang);
  if (fromDict && fromDict !== src) {
    const cleaned = pickBilingual(fromDict, lang) ?? fromDict;
    if (cleaned !== src) return cleaned;
  }


  const bilingual = pickBilingual(src, lang);
  if (bilingual && bilingual !== src) return bilingual;

  const cached = memory.get(key(lang, src));
  if (cached) return cached;

  if (!failed.has(key(lang, src))) queue(src);
  return null;
};


const queue = (source: string) => {
  pending.add(source);
  if (flushTimer) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flush, 400);
};

const flush = async () => {
  flushTimer = null;
  if (pending.size === 0) return;
  const lang = currentLang;
  const texts = Array.from(pending).slice(0, 100);
  texts.forEach((t) => pending.delete(t));

  try {
    const { data, error } = await supabase.functions.invoke("translate-ui", {
      body: { texts, target: lang },
    });
    if (error) throw error;
    const translations = (data?.translations ?? {}) as Record<string, string>;
    let got = 0;
    for (const src of texts) {
      const value = translations[src];
      if (value && value !== src) {
        memory.set(key(lang, src), value);
        got++;
      } else {
        failed.add(key(lang, src));
      }
    }
    if (got > 0) {
      saveCache();
      scheduleScan();
    }
  } catch {
    texts.forEach((t) => failed.add(key(lang, t)));
  }

  if (pending.size > 0) queue(Array.from(pending)[0]);
};

const shouldSkipElement = (el: Element | null): boolean => {
  let node: Element | null = el;
  while (node) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if (node.hasAttribute?.("data-no-translate")) return true;
    if (node.getAttribute?.("translate") === "no") return true;
    node = node.parentElement;
  }
  return false;
};

const translateTextNode = (node: Text, lang: Lang) => {
  const original = originals.get(node) ?? node.nodeValue ?? "";
  if (!originals.has(node)) {
    if (!translatable(original)) return;
    originals.set(node, original);
  }
  const next = resolve(original, lang);
  const value = next ?? original;
  if (node.nodeValue !== value) node.nodeValue = value;
};

const translateAttributes = (el: Element, lang: Lang) => {
  for (const attr of ATTRS) {
    const current = el.getAttribute(attr);
    if (current === null) continue;
    const store = attrOriginals.get(el) ?? {};
    if (store[attr] === undefined) {
      if (!translatable(current)) continue;
      store[attr] = current;
      attrOriginals.set(el, store);
    }
    const original = store[attr];
    const next = resolve(original, lang) ?? original;
    if (current !== next) el.setAttribute(attr, next);
  }
};

/**
 * Sentences broken up by inline markup (`<p>Text <strong>bold</strong> more.</p>`)
 * never match a dictionary entry node-by-node, so the whole block text is tried
 * as one phrase first.
 */
const BLOCK_TAGS = new Set(["P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BUTTON", "LABEL"]);
const blockOriginals = new WeakMap<Element, string>();

const translateBlock = (el: Element, lang: Lang): boolean => {
  if (!BLOCK_TAGS.has(el.tagName)) return false;
  if (el.children.length === 0) return false; // plain text handled per node
  if (el.querySelector("input, textarea, select, svg, img, [data-no-translate]")) return false;
  const current = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!current) return false;
  const original = blockOriginals.get(el) ?? current;
  if (!translatable(original)) return false;
  const next = resolve(original, lang);
  if (!next || next === original) return false;
  blockOriginals.set(el, original);
  if (current !== next) el.textContent = next;
  return true;
};

const walk = (root: Node, lang: Lang) => {
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = (root as Text).parentElement;
    if (!shouldSkipElement(parent)) translateTextNode(root as Text, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (shouldSkipElement(el)) return;

  translateAttributes(el, lang);

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element;
      if (SKIP_TAGS.has(child.tagName) || child.hasAttribute("data-no-translate") || translateBlock(child, lang)) {
        // skip the whole subtree
        let next = walker.nextSibling();
        while (!next && walker.parentNode()) next = walker.nextSibling();
        node = next;
        continue;
      }
      translateAttributes(child, lang);
    } else {
      translateTextNode(node as Text, lang);
    }
    node = walker.nextNode();
  }

    } else {
      translateTextNode(node as Text, lang);
    }
    node = walker.nextNode();
  }
};

const runScan = () => {
  if (!document.body) return;
  observer?.disconnect();
  try {
    walk(document.body, currentLang);
  } finally {
    observe();
  }
};

const scheduleScan = () => {
  if (scanTimer) window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => {
    scanTimer = null;
    runScan();
  }, 60);
};

const observe = () => {
  if (!observer || !document.body) return;
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributeFilter: ATTRS,
  });
};

/** Start (or update) the runtime translation layer for the given language. */
export const startAutoTranslate = (lang: Lang) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  currentLang = lang;

  if (!started) {
    started = true;
    loadCache();
    observer = new MutationObserver(() => scheduleScan());
  }

  scheduleScan();
};

export const stopAutoTranslate = () => {
  observer?.disconnect();
  if (scanTimer) window.clearTimeout(scanTimer);
  if (flushTimer) window.clearTimeout(flushTimer);
};
