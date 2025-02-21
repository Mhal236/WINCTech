import 'react-leaflet';

declare module 'react-leaflet' {
  interface TileLayerProps {
    attribution?: string;
  }

  interface MapContainerProps {
    center: [number, number];
    zoom: number;
  }
} 