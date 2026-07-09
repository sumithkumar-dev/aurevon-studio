import { useEffect } from "react";

const SITE_NAME = "AUREVON";
const SITE_URL = "https://aurevon.studios";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

type MetaOptions = {
  title: string;
  description?: string;
  /** Absolute URL to a social preview image. Defaults to the site-wide OG image. */
  image?: string;
  /** Root-relative canonical path, e.g. "/services". Defaults to the current pathname. */
  path?: string;
  /** Set true on pages that should never appear in search results (e.g. /admin). */
  noindex?: boolean;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets document.title plus the social/crawler-visible metadata (description,
 * Open Graph, Twitter Card, canonical link, robots) for the current route.
 *
 * Note: this runs client-side after JS executes, same as the title/description
 * handling did before. That's enough for Google and for any crawler that
 * executes JS, but a crawler or link-preview bot that doesn't run JS will
 * still see whatever static fallback (if any) is baked into index.html —
 * that file wasn't part of this audit's scope, so it's worth checking
 * separately that it has sane baseline <title>/description/OG tags too.
 */
export function useMeta({ title, description, image, path, noindex }: MetaOptions) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) upsertMeta("name", "description", description);

    const canonicalPath = path ?? window.location.pathname;
    const canonicalUrl = `${SITE_URL}${canonicalPath === "/" ? "" : canonicalPath}`;
    upsertLink("canonical", canonicalUrl);

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", canonicalUrl);
    if (title) upsertMeta("property", "og:title", title);
    if (description) upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", image ?? DEFAULT_IMAGE);

    upsertMeta("name", "twitter:card", "summary_large_image");
    if (title) upsertMeta("name", "twitter:title", title);
    if (description) upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image ?? DEFAULT_IMAGE);

    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
  }, [title, description, image, path, noindex]);
}
