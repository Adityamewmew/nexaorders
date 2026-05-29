import React from 'react';
import { Plus } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface MenuCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  onClick: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ name, price, imageUrl, isAvailable, onClick }) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-transform relative"
      onClick={isAvailable ? onClick : undefined}
    >
      {/* Gambar */}
      <div className="h-28 w-full bg-slate-200 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-3xl">🍽️</span>
          </div>
        )}
        
        {/* Overlay Habis */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-md">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-slate-800 leading-tight mb-2 line-clamp-2">
          {name}
        </h3>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-bold text-brand-primary">
            {formatRupiah(price)}
          </span>
          
          <button 
            disabled={!isAvailable}
            className={`p-1.5 rounded-lg transition-colors ${
              isAvailable 
                ? 'bg-brand-primary text-white hover:bg-brand-primaryHover'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
