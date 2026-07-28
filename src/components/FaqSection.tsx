"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqSection({ items, id }: { items: FaqItem[]; id?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id={id} className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold uppercase text-white">Perguntas frequentes</h2>
      <div className="flex flex-col divide-y divide-border rounded-md border border-border">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `faq-panel-${index}`;
          return (
            <div key={item.question}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium text-white"
                >
                  {item.question}
                  <Plus size={18} className={`shrink-0 text-lime transition ${isOpen ? "rotate-45" : ""}`} aria-hidden="true" />
                </button>
              </h3>
              {isOpen && (
                <p id={panelId} className="px-4 pb-4 text-sm text-muted">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
