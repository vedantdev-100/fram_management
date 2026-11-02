import { create } from "zustand";
interface Toast {
  id: number;
  title: string;
  kind: "success" | "error";
}
export const useToasts = create<{
  items: Toast[];
  add: (title: string, kind?: Toast["kind"]) => void;
  remove: (id: number) => void;
}>((set) => ({
  items: [],
  add: (title, kind = "success") => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items.slice(-3), { id, title, kind }] }));
    window.setTimeout(
      () => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
      6000,
    );
  },
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));
export const notify = (title: string, kind: "success" | "error" = "success") =>
  useToasts.getState().add(title, kind);
