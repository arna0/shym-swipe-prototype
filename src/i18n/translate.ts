// Russian / English switch.
// The app is written in Russian. In English mode every Russian text node on the
// page is swapped for its English version from en.ts (looked up by the exact text),
// including text React renders later. Switching back restores the original.
import { EN } from './en';

export type Lang = 'ru' | 'en';
const KEY = 'shym_lang';
const NON_LETTER_PREFIX = /^([^A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі0-9]+)(.+)$/u;

let lang: Lang = 'ru';
const original = new WeakMap<Node, { ru: string; out: string }>();
const listeners = new Set<(l: Lang) => void>();

function lookup(ru: string): string | null {
  const t = ru.trim();
  if (!t) return null;
  if (EN[t]) return ru.replace(t, EN[t]);
  const m = t.match(NON_LETTER_PREFIX);
  if (m && EN[m[2].trim()]) return ru.replace(m[2].trim(), EN[m[2].trim()]);
  // same text with different numbers: "Пройдено 3 из 5"
  const nums: string[] = [];
  const tmpl = t.replace(/\d+(?:[.,]\d+)?/g, (n) => (nums.push(n), '{n}'));
  if (nums.length && EN[tmpl]) {
    let i = 0;
    return ru.replace(t, EN[tmpl].replace(/\{n\}/g, () => nums[i++] ?? ''));
  }
  return null;
}

function translateNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const saved = original.get(node);
    const current = node.nodeValue ?? '';
    const source = saved && current === saved.out ? saved.ru : current;
    if (lang === 'en') {
      const out = lookup(source);
      if (out !== null && out !== current) {
        original.set(node, { ru: source, out });
        node.nodeValue = out;
      }
    } else if (saved && current === saved.out) {
      node.nodeValue = saved.ru;
      original.delete(node);
    }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'PRE' || el.tagName === 'CODE') return;
  for (const attr of ['placeholder', 'title', 'aria-label']) {
    const v = el.getAttribute(attr);
    if (!v) continue;
    const store = `ru${attr.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`;
    if (!el.dataset[store]) el.dataset[store] = v;
    const ru = el.dataset[store]!;
    el.setAttribute(attr, lang === 'en' ? lookup(ru) ?? ru : ru);
  }
  el.childNodes.forEach(translateNode);
}

export function setLang(next: Lang) {
  lang = next;
  try { localStorage.setItem(KEY, lang); } catch { /* private mode */ }
  document.documentElement.lang = lang;
  translateNode(document.body);
  listeners.forEach((fn) => fn(lang));
}

export const getLang = () => lang;
export function onLangChange(fn: (l: Lang) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function installTranslator() {
  let initial: string | null = new URLSearchParams(location.search).get('lang');
  if (!initial) { try { initial = localStorage.getItem(KEY); } catch { /* ignore */ } }
  lang = initial === 'en' ? 'en' : 'ru';
  new MutationObserver((records) => {
    if (lang !== 'en') return;
    for (const r of records) {
      if (r.type === 'characterData') translateNode(r.target);
      else r.addedNodes.forEach(translateNode);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  document.documentElement.lang = lang;
  if (lang === 'en') requestAnimationFrame(() => translateNode(document.body));
}
