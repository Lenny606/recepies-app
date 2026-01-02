import React from 'react';
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

interface HeroRecipeCardProps {
    recipe: Recipe;
    onClick: () => void;
}

export const HeroRecipeCard: React.FC<HeroRecipeCardProps> = ({ recipe, onClick }) => {
    return (
        <Card
            onClick={onClick}
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
    );
};
