import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';
import { getYouTubeThumbnailUrl } from '../utils/videoUtils';

interface Recipe {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    video_url?: string;
    image_url?: string;
}

interface CarouselProps {
    recipes: Recipe[];
    onSelectRecipe: (id: string) => void;
}

export const Carousel: React.FC<CarouselProps> = ({ recipes, onSelectRecipe }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (recipes.length === 0) return null;

    return (
        <div className="relative group">
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
                {recipes.map((recipe) => (
                    <div
                        key={recipe.id || recipe._id}
                        className="flex-none w-[85%] md:w-[45%] lg:w-[30%] snap-center"
                    >
                        <Card
                            onClick={() => onSelectRecipe((recipe.id || recipe._id)!)}
                            className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-white to-slate-50"
                        >
                            <div className="relative aspect-video rounded-t-lg overflow-hidden">
                                {recipe.image_url ? (
                                    <img
                                        src={recipe.image_url}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : recipe.video_url && getYouTubeThumbnailUrl(recipe.video_url) ? (
                                    <img
                                        src={getYouTubeThumbnailUrl(recipe.video_url)!}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-4xl">
                                        🍲
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                    <h3 className="text-white font-bold text-lg line-clamp-2">
                                        {recipe.title}
                                    </h3>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-slate-600 text-sm line-clamp-2">
                                    {recipe.description || 'Bez popisu...'}
                                </p>
                            </div>
                        </Card>
                    </div>
                ))}
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
