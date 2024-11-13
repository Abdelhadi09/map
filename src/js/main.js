require('dotenv').config();
const maptilerApiKey = process.env.MAPTILER_API_KEY;
const openRouteServiceApiKey = process.env.OPENROUTESERVICE_API_KEY;

// const polyline = require('@mapbox/polyline');
// Initialize the MapLibre map
const map = new maplibregl.Map({
  container: "map",
  style: "https://api.maptiler.com/maps/bright/style.json?key=" + maptilerApiKey + "", // Detailed map style URL
  center: [0, 0], // Starting position [lng, lat]
  zoom: 2, // Starting zoom
});

// Array to store points clicked by the user
let points = [];

// Event listener for map click to collect points
map.on("click", function (e) {
  points.push([e.lngLat.lng, e.lngLat.lat]);
  new maplibregl.Marker().setLngLat(e.lngLat).addTo(map);
  if (points.length >= 2) {
    document.getElementById("find-route").disabled = false;
  }
});

// Event listener for the button to find the best route
document.getElementById("find-route").addEventListener("click", () => {
  fetchRoute(points);
});

// Function to fetch the route from OpenRouteService using XMLHttpRequest
function fetchRoute(points) {
  const apiKey = openRouteServiceApiKey;
  const url = `https://api.openrouteservice.org/v2/directions/driving-car`;

  const requestBody = JSON.stringify({
    coordinates: points,
  });

  var request = new XMLHttpRequest();
  request.open("POST", url);
  request.setRequestHeader(
    "Accept",
    "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8"
  );
  request.setRequestHeader("Authorization", apiKey);
  request.setRequestHeader("Content-Type", "application/json");

  request.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        const data = JSON.parse(this.responseText);
        console.log("API Response:", data); // Log the entire response
        if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
          const route = polyline.decode(data.routes[0].geometry);
          console.log("Route Coordinates:", route); // Log route coordinates
          drawRoute(route);
        } else {
          console.error("Invalid data structure in API response");
        }
      } else {
        console.error("Error fetching route:", this.status);
      }
    }
  };

  request.send(requestBody);
}

// Function to draw the route on the map
function drawRoute(route) {
  if (map.getSource("route")) {
    map.removeLayer("route");
    map.removeSource("route");
  }
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: route.map((coord) => [coord[1], coord[0]]), // Convert [lat, lng] to [lng, lat]
      },
    },
  });
  map.addLayer({
    id: "route",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#ff0000", "line-width": 4 },
  });

  // Add numbered markers only for the clicked points
  points.forEach((coord, index) => {
    new maplibregl.Marker({
      element: createLabel(index + 1),
      anchor: "bottom",
    })
    .setLngLat(coord)
    .addTo(map);
  });
}

// Function to create a labeled marker
function createLabel(label) {
  const div = document.createElement("div");
  div.className = "marker";
  div.innerText = label;
  return div;
}
