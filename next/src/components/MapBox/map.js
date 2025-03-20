import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { database, ref, get, child, auth } from "../../helpers/firebase";

mapboxgl.accessToken =
  "pk.eyJ1Ijoicm9tYW5rcmF2ZXRzIiwiYSI6ImNrZ2hzajNpejAweDYycW14NXZtYjJycWYifQ.0VN2Nw-1t2JfOHlcSlTYmg";

function Map() {
  const [map, setMap] = useState(null);
  const [city, setCity] = useState("");
  const mapNode = useRef(null);
  const [markers, setMarkers] = useState([]);
  const markerRef = useRef(null);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [placeDesc, setPlaceDesc] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [marker, setMarker] = useState(null);

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

    const popupLocation = `<h3>Твоя локація</h3>`;

    const marker = new mapboxgl.Marker({ color: "red" })
      .setLngLat(coordinates)
      //.setPopup(
        //new mapboxgl.Popup({ className: "marker-user" }).setHTML(popupLocation)
      //)
      .addTo(mapboxMap);

    mapboxMap.getCanvas().style.cursor = "pointer";

    mapboxMap.on("click", (event) => {
      const coords = event.lngLat;
      setSelectedCoords(coords);

      if (marker) {
        marker.setLngLat(coords);
      }

      setShowInfoBox(true);
    });

    mapboxMap.on("load", () => {
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

      mapboxMap.addSource("region-borders-admin", {
        type: "geojson",
        data: "/geoBoundaries-admin.geojson",
      });

      mapboxMap.addLayer({
        id: "region-borders-layer-admin",
        type: "line",
        source: "region-borders-admin",
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
          "text-field": ["get", "hromada"],
          "text-size": 14,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#000000",
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 2,
        },
      });
    });

    setMap(mapboxMap);
    markerRef.current = marker;
    fetchMarkers();
  };

  const handleAddLocation = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("🔒 Будь ласка, увійдіть, щоб зберегти маркер!");
      return;
    }

    if (!placeName || !placeDesc) {
      alert("⚠️ Введіть назву та опис!");
      return;
    }

    if (!selectedCoords) {
      alert("📍 Виберіть точку на карті!");
      return;
    }

    const markerData = {
      name: placeName,
      description: placeDesc,
      coordinates: {
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      },
      timestamp: Date.now(),
      rating: 0,
    };

    try {
      const markersRef = ref(db, `users/${user.uid}/markers`);
      const markersAllRef = ref(db, `markers`);
      const newMarkerRef = push(markersRef);
      const newMarkersAllRef = push(markersAllRef);

      await set(newMarkerRef, markerData);
      await set(newMarkersAllRef, markerData);

      // Update the marker on the map
      marker
        .setLngLat(selectedCoords)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<h3>${placeName}</h3><p>${placeDesc}</p>`
          )
        )
        .addTo(map);

      alert("✅ Маркер успішно збережено!");
      setShowInfoBox(false);
      setPlaceName("");
      setPlaceDesc("");
    } catch (error) {
      console.error("Помилка збереження:", error);
      alert("❌ Не вдалося зберегти маркер!");
    }
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
        <p>Підтрими звернення: <span id="rating-${marker._id}">${
        marker.rating || 0
      }</span></p>
        <button onclick="voteMarker('${marker._id}', 1)">+1</button>
      `;

      new mapboxgl.Marker({ color: "blue" })
        .setLngLat([marker.coordinates.lng, marker.coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ className: "marker-user" }).setHTML(popupHTML)
        )
        .addTo(map);
    });
  }, [map, markers]);

  const updateCity = async () => {
    if (!city) return alert("🔴 Please enter a city!");

    const newCoordinates = await getCityCoordinates(city);
    if (!newCoordinates) return alert("❌ City not found!");

    map.flyTo({ center: newCoordinates, zoom: 12 });

    if (markerRef.current) {
      markerRef.current
        .setLngLat(newCoordinates)
        .setPopup(
          new mapboxgl.Popup({ className: "marker-user" }).setText(city)
        )
        .addTo(map);
    }
  };

  async function getCityCoordinates(city) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${city}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.length > 0
      ? [parseFloat(data[0].lon), parseFloat(data[0].lat)]
      : null;
  }

  return (
    <div>
      <div className="search">
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={updateCity}>Search</button>
      </div>
      <div ref={mapNode} style={{ width: "100%", height: "500px" }} />
      {showInfoBox && (
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            background: "#fff",
            padding: 10,
            borderRadius: 5,
          }}
        >
          <h3>Додати локацію</h3>
          <input
            type="text"
            placeholder="Назва"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Опис"
            value={placeDesc}
            onChange={(e) => setPlaceDesc(e.target.value)}
          />
          <button onClick={handleAddLocation}>Створити</button>
          <button onClick={() => setShowInfoBox(false)}>❌</button>
        </div>
      )}
    </div>
  );
}

export default Map;
