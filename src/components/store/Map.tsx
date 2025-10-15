"use client";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

export default function Map({ lat, lng }: { lat: number; lng: number }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  
  if (!isLoaded) return <div className="w-full h-[250px] bg-gray-100 rounded-lg animate-pulse" />;
  
  return (
    <GoogleMap
      zoom={15}
      center={{ lat, lng }}
      mapContainerStyle={{ width: "100%", height: "250px", borderRadius: "12px" }}
    >
      <Marker position={{ lat, lng }} />
    </GoogleMap>
  );
}