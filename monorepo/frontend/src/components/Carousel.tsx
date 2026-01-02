import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';



export interface CarouselProps<T> {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    keyExtractor?: (item: T) => string;
    autoSlide?: boolean;
    autoSlideInterval?: number;
    autoSlideThreshold?: number;
}

export const Carousel = <T extends any>({
    items,
    renderItem,
    keyExtractor,
    autoSlide = true,
    autoSlideInterval = 3000,
    autoSlideThreshold = 4
}: CarouselProps<T>) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = React.useState(false);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    React.useEffect(() => {
        if (!autoSlide || items.length <= autoSlideThreshold || isPaused) return;

        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { current } = scrollRef;
                // Check if we are near the end
                // We consider "end" if scrollLeft + clientWidth >= scrollWidth - small tolerance
                const isAtEnd = current.scrollLeft + current.clientWidth >= current.scrollWidth - 10;

                if (isAtEnd) {
                    current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    scroll('right');
                }
            }
        }, autoSlideInterval);

        return () => clearInterval(interval);
    }, [autoSlide, autoSlideInterval, autoSlideThreshold, items.length, isPaused]);

    if (items.length === 0) return null;

    return (
        <div
            className="relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                aria-label="Previous"
            >
                <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, index) => {
                    // Try to infer key if not provided
                    const key = keyExtractor
                        ? keyExtractor(item)
                        : (item as any).id || (item as any)._id || index;

                    return (
                        <div
                            key={key}
                            className="flex-none w-[85%] md:w-[45%] lg:w-[30%] snap-center"
                        >
                            {renderItem(item)}
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next"
            >
                <ChevronRight className="w-6 h-6 text-slate-700" />
            </button>
        </div>
    );
};
