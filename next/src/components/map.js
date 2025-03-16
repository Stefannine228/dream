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
    
    const coordinates = await getCityCoordinates("Кременець"); // Default location
    if (!coordinates) return alert("❌ Error loading default location");

    const mapboxMap = new mapboxgl.Map({
      container: mapNode.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: coordinates,
      zoom: 10,
    });

    const marker = new mapboxgl.Marker({ color: "red" })
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup().setText("Кременець"))
      .addTo(mapboxMap);

    markerRef.current = marker;
    setMap(mapboxMap);
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
    getMap();
  }, []);

  useEffect(() => {
    if (!map || markers.length === 0) return;

    markers.forEach((marker) => {
      const popupHTML = `
        <h3>${marker.name}</h3>
        <p>${marker.description}</p>
        <p>Підтримали: <span id="rating-${marker._id}">${marker.rating || 0}</span></p>
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
        .setPopup(new mapboxgl.Popup().setText(city))
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
