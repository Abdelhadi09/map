require("dotenv").config();
const maptilerApiKey = process.env.MAPTILER_API_KEY;
const openRouteServiceApiKey = process.env.OPENROUTESERVICE_API_KEY;

// Initialize the MapLibre map
const map = new maplibregl.Map({
  container: "map",
  style: "https://api.maptiler.com/maps/bright/style.json?key=" + maptilerApiKey, // Map style URL", // Detailed map style URL
  center: [0, 0], // Starting position [lng, lat]
  zoom: 2, // Starting zoom
});

// Array to store points clicked by the user
let points = [];

// Event listener for map click to collect points
map.on("click", function (e) {
  points.push([e.lngLat.lng, e.lngLat.lat]);
  new maplibregl.Marker().setLngLat(e.lngLat).addTo(map);
});

// Event listener for the button to find the best route
document.getElementById("find-route").addEventListener("click", () => {
  fetchRoute(points);
});

// Function to fetch the route from OpenRouteService
function fetchRoute(points) {
  const apiKey = openRouteServiceApiKey;
  const url = "https://api.openrouteservice.org/v2/directions/driving-car/json";
  const body = JSON.stringify({
    coordinates: points,
  });

  fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
      Authorization: apiKey,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log(data); // Log the response to inspect the data structure
      if (data && data.metadata && data.metadata.query && data.metadata.query.coordinates) {
        const route = data.metadata.query.coordinates;
        drawRoute(route);
      } else {
        throw new Error("Invalid data structure in API response");
      }
    })
    .catch((error) => {
      console.error("Error fetching route:", error);
    });
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
        coordinates: route,
      },
    },
  });

  map.addLayer({
    id: "route",
    type: "line",
    source: "route",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#ff0000",
      "line-width": 4,
    },
  });

  // Add labeled markers for each point in the route
  route.forEach((point, index) => {
    if (Array.isArray(point) && point.length === 2) {
      new maplibregl.Marker({
        element: createLabel(index + 1),
        anchor: "bottom",
      })
        .setLngLat(point)
        .addTo(map);
    } else {
      console.error("Invalid coordinate format:", point);
    }
  });
}

// Function to create a labeled marker
function createLabel(label) {
  const div = document.createElement("div");
  div.className = "marker";
  div.innerText = label;
  return div;
}
