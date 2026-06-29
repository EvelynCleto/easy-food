import { useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

type State = {
  position: LatLng | null;
  error: string | null;
  loading: boolean;
  /** Whether we used a fallback (default São Paulo center) instead of real GPS */
  fallback: boolean;
};

const FALLBACK: LatLng = { lat: -23.5631, lng: -46.6544 }; // Av. Paulista

export function useGeolocation(): State {
  const [state, setState] = useState<State>({
    position: null,
    error: null,
    loading: true,
    fallback: false,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ position: FALLBACK, error: "Geolocalização indisponível", loading: false, fallback: true });
      return;
    }
    const t = setTimeout(() => {
      // permission prompt taking too long
      setState((s) => (s.position ? s : { position: FALLBACK, error: null, loading: false, fallback: true }));
    }, 6000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(t);
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
          fallback: false,
        });
      },
      (err) => {
        clearTimeout(t);
        setState({ position: FALLBACK, error: err.message, loading: false, fallback: true });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
    return () => clearTimeout(t);
  }, []);

  return state;
}