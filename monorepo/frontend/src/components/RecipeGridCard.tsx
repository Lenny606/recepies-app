import React from 'react';
import { Card } from './ui/Card';
import { User, Edit } from 'lucide-react';
import { getYouTubeThumbnailUrl } from '../utils/videoUtils';

interface Recipe {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    tags: string[];
    created_at: string;
    video_url?: string;
    web_url?: string;
    image_url?: string;
    author_id?: string;
}

interface RecipeGridCardProps {
    recipe: Recipe;
    onClick: () => void;
    onEdit: (e: React.MouseEvent, recipe: Recipe) => void;
}

export const RecipeGridCard: React.FC<RecipeGridCardProps> = ({ recipe, onClick, onEdit }) => {
    return (
        <Card
            onClick={onClick}
            className="group hover:shadow-lg transition-shadow cursor-pointer border-slate-200 flex flex-col h-full min-w-[300px]"
        >
            <div className="p-1 flex flex-col h-full">
                <div className="h-40 bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-4xl group-hover:bg-emerald-50 transition-colors overflow-hidden relative">
                    {recipe.video_url && getYouTubeThumbnailUrl(recipe.video_url) ? (
                        <img
                            src={getYouTubeThumbnailUrl(recipe.video_url)!}
                            alt={recipe.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <span>🥘</span>
                    )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    {recipe.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">
                    {recipe.description || 'Bez popisu.'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs mt-auto">
                    <div className="flex items-center gap-1 font-medium text-emerald-600">
                        <User className="w-3 h-3" />
                        <span>Můj recept</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => onEdit(e, recipe)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium z-10"
                        >
                            <Edit className="w-3 h-3" />
                            <span>Upravit</span>
                        </button>
                        <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
