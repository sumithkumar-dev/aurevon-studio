import { useEffect } from "react";

export function useMeta({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let el = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = "description";
        document.head.appendChild(el);
      }
      el.content = description;
    }
  }, [title, description]);
}
