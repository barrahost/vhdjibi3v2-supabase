import { Play, BarChart } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface Teaching {
  id: string;
  title: string;
  description: string;
  speaker: string;
  category: string;
  tags: string[];
  duration: number;
  fileUrl: string;
  date: Date;
  theme?: string;
  thumbnail_url?: string;
  plays?: number;
}

interface TeachingDetailsProps {
  teaching: Teaching;
}

export function TeachingDetails({ teaching }: TeachingDetailsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4 sm:space-y-6 animate-slide-up">
      {/* Thumbnail */}
      <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] rounded-lg overflow-hidden bg-gray-100">
        {teaching.thumbnail_url ? (
          <img
            src={teaching.thumbnail_url}
            alt={teaching.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#00665C]/10 flex items-center justify-center">
              <Play className="w-8 h-8 text-[#00665C]" />
            </div>
          </div>
        )}
      </div>

      {/* Title and Description */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{teaching.title}</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">{teaching.description}</p>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Orateur</h3>
          <p className="mt-1 text-base sm:text-lg text-gray-900">{teaching.speaker}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Date</h3>
          <p className="mt-1 text-base sm:text-lg text-gray-900">{formatDate(teaching.date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Catégorie</h3>
          <p className="mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
              {teaching.category}
            </span>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Écoutes</h3>
          <p className="mt-1 flex items-center text-gray-700">
            <BarChart className="w-4 h-4 mr-1 text-[#00665C]" />
            <span>{teaching.plays || 0}</span>
          </p>
        </div>
      </div>
      
      {teaching.theme && (
        <div>
          <h3 className="text-sm font-medium text-gray-500">Thème</h3>
          <p className="mt-1 text-base sm:text-lg text-gray-900">{teaching.theme}</p>
        </div>
      )}

      {/* Tags */}
      {teaching.tags && teaching.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1 sm:mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {teaching.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}