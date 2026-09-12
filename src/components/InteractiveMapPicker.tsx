import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Crosshair } from 'lucide-react';
import { District, DISTRICT_LABELS } from '../types';

interface InteractiveMapPickerProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lon: number, districtHint?: District) => void;
  selectedDistrict: District;
}

export const SHYMKENT_LANDMARKS = [
  {
    name: 'ТРЦ «Shymkent Plaza» (Аль-Фараби)',
    lat: 42.3195,
    lon: 69.5932,
    district: District.AL_FARABI,
    address: 'пр. Тәуке хан / пл. Аль-Фараби 3/1',
  },
  {
    name: 'мкр. Нұрсат / Акимат (Каратау)',
    lat: 42.3688,
    lon: 69.6284,
    district: District.KARATAU,
    address: 'пр. Астана 44, мкр. Нұрсат',
  },
  {
    name: 'Шымкент-Сити / Бульвар (Туран)',
    lat: 42.3512,
    lon: 69.5388,
    district: District.TURAN,
    address: 'мкр. Шымкент-Сити, бульвар Независимости',
  },
  {
    name: 'Парк «Жайлаукөл» / Озеро Тұлпар (Абай)',
    lat: 42.3045,
    lon: 69.5741,
    district: District.ABAY,
    address: 'ул. Казиева, прибрежная зона Тұлпар',
  },
  {
    name: 'ул. Капал Батыра / Промзона (Енбекши)',
    lat: 42.2891,
    lon: 69.6455,
    district: District.ENBEKSHI,
    address: 'ул. Қапал батыр 88',
  },
  {
    name: 'Стадион им. Кажымукана (Аль-Фараби)',
    lat: 42.3242,
    lon: 69.5878,
    district: District.AL_FARABI,
    address: 'ул. Мадели кожа 1',
  },
];

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  latitude,
  longitude,
  onCoordinatesChange,
  selectedDistrict,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Custom Pulsing Leaflet Icon
  const createCustomIcon = () => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(34, 211, 238, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 24px; height: 24px; background: #22d3ee; border: 3px solid #0c0c0e; border-radius: 50%; box-shadow: 0 0 12px rgba(34, 211, 238, 0.9); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; background: #000; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: true,
      });

      // CartoDB Dark Matter tiles matching Sophisticated Dark
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Create draggable marker
      const marker = L.marker([latitude, longitude], {
        icon: createCustomIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const markerPos = e.target.getLatLng();
        onCoordinatesChange(Number(markerPos.lat.toFixed(5)), Number(markerPos.lng.toFixed(5)));
      });

      // Click on map to move marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onCoordinatesChange(Number(lat.toFixed(5)), Number(lng.toFixed(5)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force render tiles properly
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }

    return () => {
      // Keep instance or cleanup on unmount
    };
  }, []);

  // Update marker & pan map when latitude/longitude props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - latitude) > 0.0001 || Math.abs(currentPos.lng - longitude) > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true, duration: 0.5 });
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black shadow-inner h-[260px] sm:h-[300px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating coordinates badge */}
        <div className="absolute top-3 left-3 z-[400] bg-[#0e0e11]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-cyan-300 flex items-center gap-2 shadow-lg">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-white font-sans font-medium">{DISTRICT_LABELS[selectedDistrict]?.ru}</span>
        </div>

        <div className="absolute bottom-3 right-3 z-[400] bg-[#0e0e11]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-gray-400">
          Нажмите на карту или перетащите маркер
        </div>
      </div>

      {/* Quick Landmark Presets in Shymkent */}
      <div className="space-y-1.5">
        <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>Быстрый выбор ориентира в Шымкенте:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {SHYMKENT_LANDMARKS.map((lm, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onCoordinatesChange(lm.lat, lm.lon, lm.district)}
              className="text-left px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 text-[11px] text-gray-300 hover:text-white transition-all flex items-center justify-between"
            >
              <span className="truncate">{lm.name.split('(')[0]}</span>
              <span className="text-[9px] text-cyan-400 font-mono ml-1 shrink-0">
                {DISTRICT_LABELS[lm.district]?.kz.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
