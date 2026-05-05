import { TileLayer } from "react-leaflet";

const CARTO_LIGHT_TILES_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const CARTO_LIGHT_TILES_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function BaseMapTileLayer() {
  return (
    <TileLayer
      attribution={CARTO_LIGHT_TILES_ATTRIBUTION}
      url={CARTO_LIGHT_TILES_URL}
      subdomains="abcd"
      maxZoom={20}
    />
  );
}

export default BaseMapTileLayer;
