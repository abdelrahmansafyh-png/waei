"use client";

import { useEffect, useState } from "react";
import { getFileUrl } from "@/lib/files";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
    button_link: string | null;
};

export default function HomeBannersSlider({
  banners,
}: {
  banners: Banner[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <section className="bg-[#F6FBF9] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#E8EFEC] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
          {/* FIXED HEIGHT */}
          <div className="relative h-[250px] md:h-[420px]">
            {/* SLIDES */}
            <div
              dir="ltr"
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(${active * -100}%)`,
              }}
            >
              {banners.map((banner) => (
                <a
                    key={banner.id}
                    href={banner.button_link || "#"}
                    target={banner.button_link?.startsWith("http") ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className={`relative block h-full w-full shrink-0 ${
                    banner.button_link ? "cursor-pointer" : "cursor-default"
                    }`}
                    onClick={(e) => {
                    if (!banner.button_link) e.preventDefault();
                    }}
                >
                    {/* IMAGE */}
                    {banner.image_url ? (
                    <img
                        src={getFileUrl(banner.image_url)}
                        alt={banner.title}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    ) : (
                    <div className="h-full w-full bg-[#DDF2FF]" />
                    )}

                    <div className="absolute inset-0 bg-white/15" />

                    <div className="absolute inset-0 z-10 flex items-center justify-between px-8 md:px-16">
                    <div dir="rtl" className="max-w-xl text-right">
                        {banner.subtitle && (
                        <div className="mb-4 inline-flex rounded-full bg-white/80 px-5 py-2 text-sm font-black text-[#42BFA8] shadow-sm backdrop-blur">
                            {banner.subtitle}
                        </div>
                        )}

                        <h2 className="text-4xl font-black leading-[1.35] text-[#0B4D6B] md:text-6xl">
                        {banner.title}
                        </h2>

                        {banner.description && (
                        <p className="mt-6 text-lg leading-9 text-[#243B53] md:text-xl">
                            {banner.description}
                        </p>
                        )}
                    </div>
                    </div>
                </a>
                ))}
            </div>

            {/* DOTS */}
            {banners.length > 1 && (
              <div className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 gap-3">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActive(index)}
                    className={`rounded-full transition-all duration-300 ${
                      active === index
                        ? "h-3 w-8 bg-[#42BFA8]"
                        : "h-3 w-3 bg-white"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* ARROWS */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActive((prev) =>
                      prev === 0 ? banners.length - 1 : prev - 1
                    )
                  }
                  className="absolute right-5 top-1/2 z-30 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-3xl font-black text-[#0B4D6B] shadow-xl backdrop-blur transition hover:scale-105 md:flex"
                >
                  →
                </button>

                <button
                  onClick={() =>
                    setActive((prev) =>
                      prev === banners.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute left-5 top-1/2 z-30 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-3xl font-black text-[#0B4D6B] shadow-xl backdrop-blur transition hover:scale-105 md:flex"
                >
                  ←
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}