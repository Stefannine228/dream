import React, {useState, useRef, useEffect} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; 

function Map() {
  const [map, setMap] = useState();
  const [coordinates, setCoordinates] = useState();
  const mapNode = useRef(null);
  const [markers, setMarkers] = useState([]);

  

  const getMap = async () => {
    const node = mapNode.current;
    const coordinates = await getCityCoordinates('Кременець');
    setCoordinates(coordinates)
    if (typeof window === "undefined" || node === null) return;
    const mapboxMap = new mapboxgl.Map({
      container: node,
            accessToken: "pk.eyJ1Ijoicm9tYW5rcmF2ZXRzIiwiYSI6ImNrZ2hzajNpejAweDYycW14NXZtYjJycWYifQ.0VN2Nw-1t2JfOHlcSlTYmg",
            style: "mapbox://styles/mapbox/streets-v11",
      center: coordinates,
      zoom: 10,
    });
    const popup = new mapboxgl.Popup({ offset: 25 }).setText("You location");
    const marker = new mapboxgl.Marker()
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(mapboxMap);

    setMap(mapboxMap);
    fetchMarkers();
  }


  const fetchMarkers = async () => {
    try {
      const response = await fetch("https://your-api.com/markers"); // Replace with your API
      const data = await response.json();
      setMarkers(data);
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
        <p>Підтримали: <span id="rating-${marker._id}">${marker.rating || 0}</span></p>
        <button onclick="voteMarker('${marker._id}', 1)">+1</button>
      `;

      new mapboxgl.Marker({ color: "red" })
        .setLngLat([marker.coordinates.lng, marker.coordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML(popupHTML))
        .addTo(map);
    });
  }, [map, markers]);

//   async function setMapLocation() {
//     //event.preventDefault();
//     const city = document.getElementById("cityInput").value;
//     if (!city) {
//         alert("Будь ласка, введіть місто!");
//         return;
//     }

//     const coordinates = await getCityCoordinates(city);
//     if (coordinates) {
//         initializeMap(coordinates);
//     } else {
//         alert("Не вдалося знайти це місто. Введіть інше.");
//     }
//     return false;
// }


  async function getCityCoordinates(city) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${city}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
        return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    } else {
        return null;
    }
}

    return <div ref={mapNode} style={{ width: "100%", height: "100%" }} />;
}

export default Map