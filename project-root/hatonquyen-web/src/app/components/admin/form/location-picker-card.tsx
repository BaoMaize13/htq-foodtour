import { useMemo, useState } from "react";
import { Loader2, LocateFixed, Navigation } from "lucide-react";
import { MapContainer, useMapEvents, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ValidationMessage } from "./validation-message";
import { BaseMapTileLayer } from "../shared/base-map-tile-layer";

interface LocationPickerCardProps {
  lat: string;
  lng: string;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
  latError?: string;
  lngError?: string;
}

function ClickMarker({
  onSelect,
  hasLocation,
  lat,
  lng,
}: {
  onSelect: (lat: string, lng: string) => void;
  hasLocation: boolean;
  lat: number;
  lng: number;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat.toFixed(6), event.latlng.lng.toFixed(6));
    },
  });

  if (!hasLocation) return null;

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={7}
      pathOptions={{
        color: "#FFFFFF",
        weight: 3,
        opacity: 1,
        fillColor: "#F97316",
        fillOpacity: 1,
      }}
    />
  );
}

export function LocationPickerCard({ lat, lng, onLatChange, onLngChange, latError, lngError }: LocationPickerCardProps) {
  const [locating, setLocating] = useState(false);

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const hasLocation = Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && Math.abs(parsedLat) <= 90 && Math.abs(parsedLng) <= 180;

  const mapCenter = useMemo<[number, number]>(() => {
    if (hasLocation) {
      return [parsedLat, parsedLng];
    }

    return [10.756, 106.649];
  }, [hasLocation, parsedLat, parsedLng]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLatChange(position.coords.latitude.toFixed(6));
        onLngChange(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Navigation className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[13px] text-foreground">Vị trí trên bản đồ</p>
            <p className="text-[11px] text-muted-foreground">Bấm đúng mặt tiền quán để lấy Lat/Lng</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-60"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />} Locate me
        </button>
      </div>

      <div className="aspect-video border-b border-border">
        <MapContainer center={mapCenter} zoom={17} className="h-full w-full">
          <BaseMapTileLayer />
          <ClickMarker hasLocation={hasLocation} lat={parsedLat} lng={parsedLng} onSelect={(nextLat, nextLng) => {
            onLatChange(nextLat);
            onLngChange(nextLng);
          }} />
        </MapContainer>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[12px] text-muted-foreground">Latitude</label>
          <input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(event) => onLatChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-input-background px-3 py-2 text-[13px] text-foreground"
          />
          {latError && <ValidationMessage type="error" message={latError} />}
        </div>
        <div>
          <label className="text-[12px] text-muted-foreground">Longitude</label>
          <input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(event) => onLngChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-input-background px-3 py-2 text-[13px] text-foreground"
          />
          {lngError && <ValidationMessage type="error" message={lngError} />}
        </div>
      </div>
    </div>
  );
}
