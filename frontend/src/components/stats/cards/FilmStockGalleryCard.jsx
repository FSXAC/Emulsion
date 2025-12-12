import { useState } from 'react';
import Icon from '../../Icon';
import { getFilmStockImage } from '../../../utils/filmStockImages';

export default function FilmStockGalleryCard({ stock }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation for card (max 15 degrees)
    const rotX = (mouseY / (rect.height / 2)) * -10;
    const rotY = (mouseX / (rect.width / 2)) * 10;
    
    // Calculate subtle translation for thumbnail parallax (max 10px)
    const transX = (mouseX / (rect.width / 2)) * 5;
    const transY = (mouseY / (rect.height / 2)) * 5;
    
    setRotateX(rotX);
    setRotateY(rotY);
    setTranslateX(transX);
    setTranslateY(transY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setTranslateX(0);
    setTranslateY(0);
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <div 
      className="relative perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        perspective: '1000px',
      }}
    >
      <div 
        className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-film-cyan dark:hover:border-film-cyan hover:shadow-xl transition-all duration-300"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: isHovering ? 'border-color 0.3s, box-shadow 0.3s' : 'transform 0.3s ease-out, border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Achievement Badge - Top Right Corner */}
        {stock.count >= 10 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-film-cyan text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
              <Icon name="star" size={10} className="fill-white" />
              {stock.count >= 20 ? 'MASTER' : 'VET'}
            </div>
          </div>
        )}

        {/* Film Stock Image Container */}
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
          {/* Museum Lighting Effects - Below thumbnail */}
          <div className="absolute inset-0 z-0">
            {/* Subtle vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 dark:to-black/40" />
            
            {/* Museum Reflection Effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>

          {/* Film Stock Image - Above museum effects */}
          <img
            src={getFilmStockImage(stock.filmStock, stock.format)}
            alt={stock.filmStock}
            className="relative z-10 w-full h-full object-cover"
            style={{ 
              transform: `translate(${translateX}px, ${translateY}px)`,
              transition: isHovering ? 'none' : 'transform 0.3s ease-out',
            }}
          />
        </div>

        {/* Info Panel */}
        <div className="relative bg-white dark:bg-gray-800 p-3">
          {/* Accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-film-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="space-y-2">
            {/* Film Stock Name */}
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
              {stock.filmStock}
            </h4>

            {/* Format */}
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {stock.format}
            </div>

            {/* Stats - Always visible but subtle */}
            <div className="flex items-center justify-between pt-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-film-cyan/10 text-film-cyan border border-film-cyan/20">
                <Icon name="film" size={12} />
                {stock.count}
              </div>

              {/* Rating */}
              {stock.roll.stars > 0 && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      size={12}
                      className={`${
                        i < stock.roll.stars 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shine Effect on Hover - Keep this! */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-12"
            style={{ transform: 'translateZ(40px)' }}
          />
        </div>
      </div>
    </div>
  );
}
