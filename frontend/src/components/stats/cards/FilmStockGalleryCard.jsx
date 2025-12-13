import { useState } from 'react';
import Icon from '../../Icon';
import { getFilmStockImage } from '../../../utils/filmStockImages';

const BADGE_TIERS = [
  {
    min: 700,
    label: 'LEGEND',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: 'fill-amber-700',
    cardBg: 'bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600',
    frame: 'bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-400 border-amber-300',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.6)] hover:shadow-[0_0_35px_rgba(251,191,36,0.8)]',
  },
  {
    min: 300,
    label: 'ELITE',
    badge: 'bg-red-100 text-red-900 border-red-300',
    icon: 'fill-red-700',
    cardBg: 'bg-gradient-to-br from-red-500 via-red-600 to-red-800',
    frame: 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 border-gray-300',
    glow: 'hover:shadow-xl',
  },
  {
    min: 100,
    label: 'PROVEN',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: 'fill-purple-700',
    cardBg: 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800',
    frame: 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 border-gray-300',
    glow: 'hover:shadow-xl',
  },
  {
    min: 10,
    label: 'BREAKOUT',
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: 'fill-blue-700',
    cardBg: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800',
    frame: 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 border-gray-300',
    glow: 'hover:shadow-xl',
  },
  {
    min: 0,
    label: 'STARTER',
    badge: 'bg-slate-100 text-slate-900 border-slate-300',
    icon: 'fill-slate-700',
    cardBg: 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700',
    frame: 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 border-gray-300',
    glow: 'hover:shadow-xl',
  },
];

const getBadgeForCount = (count) => BADGE_TIERS.find((tier) => count >= tier.min) || BADGE_TIERS[BADGE_TIERS.length - 1];

export default function FilmStockGalleryCard({ stock }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 }); // Percentage 0-100

  const tier = getBadgeForCount(stock.totalExposures);
  const isStarter = tier.label === 'STARTER';

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate 3D rotation
    const rotX = (mouseY / (rect.height / 2)) * 15;
    const rotY = (mouseX / (rect.width / 2)) * -15;
    
    // Calculate percentage position for holographic effects (0-100)
    const px = Math.abs(Math.floor(100 / rect.width * (e.clientX - rect.left)));
    const py = Math.abs(Math.floor(100 / rect.height * (e.clientY - rect.top)));

    setRotateX(rotX);
    setRotateY(rotY);
    setMousePosition({ x: px, y: py });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovering(false);
  };

  return (
    <div 
      className="relative perspective-1000 group cursor-pointer select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovering(true)}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={`
          relative w-full aspect-[2.5/3.5] rounded-xl transition-all duration-300
          ${tier.glow}
        `}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: isHovering ? 'none' : 'transform 0.5s ease-out',
        }}
      >
        {/* Frame / Border */}
        <div className={`absolute inset-0 p-[6px] rounded-xl ${tier.frame} shadow-inner`}>
          
          {/* Metallic Border Shine */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.8) 45%, rgba(255,255,255,0.0) 50%)`,
              backgroundSize: '150% 150%',
              backgroundPosition: isHovering ? `${mousePosition.x}% ${mousePosition.y}%` : '50% 50%',
              mixBlendMode: 'overlay',
              opacity: isHovering ? 1 : 0,
              transition: isHovering ? 'opacity 0.1s ease-out' : 'opacity 0.5s ease-out',
            }}
          />

          {/* Inner Content Container */}
          <div className="h-full w-full bg-white dark:bg-gray-900 rounded-lg flex flex-col overflow-hidden shadow-sm relative">
            
            {/* Top Area - Colorful Matte Background */}
            <div className={`relative flex-grow ${tier.cardBg} flex flex-col min-h-0 overflow-hidden`}>
              
              {/* Asymmetric Design Elements */}
              {/* Diagonal Slash */}
              <div className="absolute inset-0 bg-white/10 -skew-y-12 scale-150 origin-bottom-left translate-y-10" />

              {/* Tier Badge - Offset Asymmetrically */}
              <div className="absolute top-3 left-0 right-0 flex justify-end pr-3 z-20">
                <div className={`
                  px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border-y border-l shadow-lg flex items-center gap-1 transform skew-x-[-10deg] origin-right
                  ${tier.badge}
                `}>
                  <div className="skew-x-[10deg] flex items-center gap-1">
                     <Icon name="star" size={8} className={tier.icon} />
                     {tier.label}
                  </div>
                </div>
              </div>

              {/* Rating Stars - High Contrast Ribbon on Left */}
              {stock.avgRating > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 z-10">
                  {Array.from({ length: 5 }, (_, i) => {
                    const filled = i < Math.round(stock.avgRating);
                    if (!filled) return null;
                    return (
                      <div key={i} className="relative">
                        <Icon
                          name="star"
                          size={12}
                          className="text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
                          fill="currentColor"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sparkles Effect - Only for ELITE and LEGEND */}
              {/* TODO: move to asset */}
              {(tier.label === 'ELITE' || tier.label === 'LEGEND') && (
                <div
                  className="absolute inset-0 pointer-events-none z-9 rounded-xl"
                  style={{
                    backgroundImage: `
                      url("https://assets.codepen.io/13471/holo.png"),
                      linear-gradient(125deg, #ff008450 15%, #fca40040 30%, #ffff0030 40%, #00ff8a20 60%, #00cfff40 70%, #cc4cfa50 85%)
                    `,
                    backgroundPosition: isHovering ? `${50 + (mousePosition.x - 50) / 7}% ${50 + (mousePosition.y - 50) / 7}%` : '50% 50%',
                    backgroundSize: '100%',
                    backgroundBlendMode: 'overlay',
                    mixBlendMode: 'color-dodge',
                    opacity: isHovering ? (tier.label === 'ELITE' ? 0.3 : 0.7) : 0,
                    filter: isHovering ? 'brightness(1) contrast(1)' : 'brightness(1) contrast(1)',
                    transition: isHovering ? 'opacity 0.1s ease-out' : 'opacity 0.5s ease-out'
                  }}
                />
              )}

              {/* Film Image - Floating Overlay */}
              <div className="flex-grow flex items-center justify-center p-1 relative z-10 min-h-0 w-full">
                 <img
                    src={getFilmStockImage(stock.filmStock, stock.format)}
                    alt={stock.filmStock}
                    className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500"
                  />
              </div>

              
            </div>

            {/* Bottom Info Section */}
            <div className="relative bg-white dark:bg-gray-800 p-3 pt-5 z-20 min-h-0">
               {/* Angled cutout effect */}
               <div className="absolute -top-4 left-0 right-0 h-4 bg-white dark:bg-gray-800" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}></div>

              {/* Name */}
              <div className="flex items-center justify-left text-left mb-2 pl-2">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2 w-full uppercase tracking-tight transform -skew-x-6">
                  {stock.filmStock}
                </h3>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-1 text-[10px] border-t border-gray-100 dark:border-gray-700 pt-2">
                <div className="flex flex-col items-center justify-center border-r border-gray-100 dark:border-gray-700">
                  <span className="text-gray-400 dark:text-gray-500 uppercase text-[8px] font-bold tracking-wider">Fmt</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-200">{stock.format}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-gray-100 dark:border-gray-700">
                   <span className="text-gray-400 dark:text-gray-500 uppercase text-[8px] font-bold tracking-wider">Rolls</span>
                   <span className="font-mono font-bold text-gray-700 dark:text-gray-200">{stock.count}</span>
                </div>
                 <div className="flex flex-col items-center justify-center">
                   <span className="text-gray-400 dark:text-gray-500 uppercase text-[8px] font-bold tracking-wider">Exp</span>
                   <span className="font-mono font-bold text-film-cyan">{stock.totalExposures}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Pokemon Card Style Holo Gradient */}
          <div
            className="absolute inset-0 pointer-events-none z-30 rounded-xl"
            style={{
              background: isStarter 
                ? `
                  linear-gradient(
                    115deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.4) 25%,
                    transparent 47%,
                    transparent 53%,
                    rgba(255, 255, 255, 0.4) 75%,
                    transparent 100%
                  )
                `
                : `
                  linear-gradient(
                    115deg,
                    transparent 0%,
                    rgb(0, 231, 255) 25%,
                    transparent 47%,
                    transparent 53%,
                    rgb(255, 0, 231) 75%,
                    transparent 100%
                  )
                `,
              backgroundSize: '250% 250%',
              backgroundPosition: isHovering ? `${mousePosition.x}% ${mousePosition.y}%` : '50% 50%',
              mixBlendMode: 'color-dodge',
              opacity: isHovering ? 0.88 : 0,
              filter: isHovering ? 'brightness(0.66) contrast(1.33)' : 'brightness(0.5) contrast(1)',
              transition: isHovering ? 'opacity 0.1s ease-out' : 'opacity 0.5s ease-out'
            }}
          />
        </div>
      </div>
    </div>
  );
}
