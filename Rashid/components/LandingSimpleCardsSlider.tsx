"use client";

import { useRef, useState } from "react";
import { getFileUrl } from "@/lib/files";

type LandingItem = {
  id?: string;
  section: string;
  item_key: string;
  icon: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string | null;
  color_class: string | null;
  sort_order: number;
  is_active: boolean;
};

const numberColors = [
  "bg-[var(--rashid-color-8b5cf6)]",
  "bg-[var(--rashid-color-19b889)]",
  "bg-[var(--rashid-color-8b5cf6)]",
  "bg-[var(--rashid-color-f8b23a)]",
  "bg-[var(--rashid-color-7048e8)]",
];

function mediaSrc(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/images")) return path;
  return getFileUrl(path);
}

function SliderMedia({ item }: { item: LandingItem }) {
  if (item.image_url) {
    return (
      <img
        src={mediaSrc(item.image_url)}
        alt={item.title || ""}
        className="h-full w-full object-cover"
        draggable={false}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--rashid-color-f3eeff)] via-[var(--rashid-color-e8fbfd)] to-[var(--rashid-color-fff5dd)]">
      <span className="text-8xl leading-none drop-shadow-sm">{item.icon || "⭐"}</span>
    </div>
  );
}

export default function LandingSimpleCardsSlider({ items }: { items: LandingItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const goTo = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
    setActiveIndex(safeIndex);

    cardRefs.current[safeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  if (!items.length) return null;

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden py-2" dir="rtl">
      <button
        type="button"
        onClick={() => goTo(activeIndex - 1)}
        disabled={activeIndex === 0}
        aria-label="السابق"
        className="absolute right-1 top-[42%] z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl font-black text-[var(--rashid-color-14224a)] shadow-[0_12px_30px_rgba(18,34,74,.18)] transition hover:bg-[var(--rashid-color-e8fbfd)] disabled:cursor-not-allowed disabled:opacity-30 md:flex"
      >
        ‹
      </button>

      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain px-4 pb-10 pt-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6 md:px-14">
        {items.map((item, index) => {
          const color = numberColors[index % numberColors.length];

          return (
            <div
              key={item.item_key}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="min-w-[275px] snap-center sm:min-w-[305px] lg:min-w-[320px]"
            >
              <article className="relative overflow-visible rounded-[2rem] transition duration-200 hover:-translate-y-1">
                <div className="h-[310px] overflow-hidden rounded-[2rem] bg-[var(--rashid-color-f4f7ff)] shadow-[0_18px_45px_rgba(18,34,74,.12)] sm:h-[335px] lg:h-[355px]">
                  <SliderMedia item={item} />
                </div>

                <div className="relative z-10 mx-auto -mt-16 min-h-[150px]  rounded-[0_0_2rem_2rem] bg-white px-5 pb-6 pt-7 text-center shadow-[0_16px_36px_rgba(18,34,74,.12)] sm:min-h-[160px]">
                  <div className="mb-3 flex items-center justify-center gap-3">
                    {/* <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color} text-base font-black text-white shadow-[0_8px_18px_rgba(18,34,74,.18)]`}>
                      {index + 1}
                    </span> */}
                    <h3 className="m-0 text-xl font-black leading-[1.35] text-[var(--rashid-color-14224a)] sm:text-[22px]">
                      {item.title}
                    </h3>
                  </div>

                  <p className="mx-auto m-0 max-w-[245px] text-sm font-bold leading-7 text-[var(--rashid-color-526079)] sm:text-[15px]">
                    {item.description}
                  </p>
                </div>
              </article>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => goTo(activeIndex + 1)}
        disabled={activeIndex >= items.length - 1}
        aria-label="التالي"
        className="absolute left-1 top-[42%] z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl font-black text-[var(--rashid-color-14224a)] shadow-[0_12px_30px_rgba(18,34,74,.18)] transition hover:bg-[var(--rashid-color-e8fbfd)] disabled:cursor-not-allowed disabled:opacity-30 md:flex"
      >
      ›
      </button>
    </div>
  );
}
