import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { database, ref, get, child } from "../helpers/firebase";

mapboxgl.accessToken = "pk.eyJ1Ijoicm9tYW5rcmF2ZXRzIiwiYSI6ImNrZ2hzajNpejAweDYycW14NXZtYjJycWYifQ.0VN2Nw-1t2JfOHlcSlTYmg";

function Map() {
  const [map, setMap] = useState(null);
  const [city, setCity] = useState("");
  const mapNode = useRef(null);
  const [markers, setMarkers] = useState([]);
  const markerRef = useRef(null);

  const getMap = async () => {
    if (!mapNode.current) return;
    
    const coordinates = await getCityCoordinates("Кременець");
    if (!coordinates) return alert("❌ Error loading default location");

    const mapboxMap = new mapboxgl.Map({
      container: mapNode.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: coordinates,
      zoom: 10,
    });

    const nav = new mapboxgl.NavigationControl();
    mapboxMap.addControl(nav, "top-right");

    const scale = new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: "metric",
    });
    mapboxMap.addControl(scale);

    const fullscreenControl = new mapboxgl.FullscreenControl();
    mapboxMap.addControl(fullscreenControl, "top-right");

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });
    mapboxMap.addControl(geolocate);

    const marker = new mapboxgl.Marker({ color: "red" })
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup({ className: "marker-user" }).setText("Твоя локація"))
      .addTo(mapboxMap);

      mapboxMap.on("load", () => {
        // Add first GeoJSON (Region Borders)
        mapboxMap.addSource("region-borders", {
          type: "geojson",
          data: "/geoBoundaries.geojson",
        });
      
        mapboxMap.addLayer({
          id: "region-borders-layer",
          type: "line",
          source: "region-borders",
          paint: {
            "line-color": "#0000FF", // Blue borders
            "line-width": 0.5,
          },
        });
      
        // Add second GeoJSON (Administrative Borders)
        mapboxMap.addSource("region-borders-admin", {
          type: "geojson",
          data: "/geoBoundaries-admin.geojson",
        });
      
        mapboxMap.addLayer({
          id: "region-borders-layer-admin",
          type: "line",
          source: "region-borders-admin", // FIXED source name
          paint: {
            "line-color": "#FF0000", // Red borders
            "line-width": 1,
          },
        });

        mapboxMap.addSource("region-borders-title", {
          type: "geojson",
          data: "/geoBoundaries-hom-title.geojson",
        });

        mapboxMap.addLayer({
          id: "region-borders-layer-title",
          type: "symbol",
          source: "region-borders-title",
          layout: {
            "text-field": ["get", "hromada"], // Use "hromada" property from GeoJSON
            "text-size": 14,
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#000000", // Black text
            "text-halo-color": "#FFFFFF", // White outline
            "text-halo-width": 2,
          },
        });
      });

    setMap(mapboxMap);
    markerRef.current = marker;
    fetchMarkers();
  };

  const fetchMarkers = async () => {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, "markers"));

      if (snapshot.exists()) {
        const markersData = snapshot.val();
        const formattedMarkers = Object.keys(markersData).map((key) => ({
          id: key,
          ...markersData[key],
        }));
        setMarkers(formattedMarkers);
      } else {
        console.log("❌ No markers found!");
      }
    } catch (error) {
      console.error("❌ Error fetching markers:", error);
    }
  };

  useEffect(() => {
    getMap()
  }, []);

  useEffect(() => {
    if (!map || markers.length === 0) return;

    markers.forEach((marker) => {
      const popupHTML = `
        <h3>${marker.name}</h3>
        <p>${marker.description}</p>
        <p>Підтрими звернення: <span id="rating-${marker._id}">${marker.rating || 0}</span></p>
        <button onclick="voteMarker('${marker._id}', 1)">+1</button>
      `;

      new mapboxgl.Marker({ color: "blue" })
        .setLngLat([marker.coordinates.lng, marker.coordinates.lat])
        .setPopup(new mapboxgl.Popup({ className: "marker-user" }).setHTML(popupHTML))
        .addTo(map);
    });
  }, [map, markers]);

  const updateCity = async () => {
    if (!city) return alert("🔴 Please enter a city!");
    
    const newCoordinates = await getCityCoordinates(city);
    if (!newCoordinates) return alert("❌ City not found!");

    map.flyTo({ center: newCoordinates, zoom: 12 });

    if (markerRef.current) {
      markerRef.current.setLngLat(newCoordinates)
        .setPopup(new mapboxgl.Popup({ className: "marker-user" }).setText(city))
        .addTo(map);
    }
  };

  async function getCityCoordinates(city) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${city}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.length > 0 ? [parseFloat(data[0].lon), parseFloat(data[0].lat)] : null;
  }

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={updateCity}>Search</button>
      </div>
      <div ref={mapNode} style={{ width: "100%", height: "500px" }} />
    </div>
  );
}

export default Map;
