let map, directionsService, directionsRenderer, directLine;

const unsafeStreets = ["Prince Alfred St", "African St"]; // Example unsafe streets
const streetlights = [
  { lat: -33.310, lng: 26.521, working: true },
  { lat: -33.312, lng: 26.523, working: false },
  { lat: -33.313, lng: 26.519, working: true }
];

function initMap() {
  // Initialize map centered on Rhodes University
  map = new google.maps.Map(document.getElementById("result"), {
    zoom: 15,
    center: { lat: -33.311, lng: 26.520 }
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

  // Draw streetlight markers
  streetlights.forEach(light => {
    new google.maps.Marker({
      position: { lat: light.lat, lng: light.lng },
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: light.working ? "green" : "red",
        fillOpacity: 1,
        strokeWeight: 1
      },
      title: light.working ? "Working light" : "Broken light"
    });
  });
}

document.getElementById("routeForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;

  // Clear previous routes and lines
  directionsRenderer.setDirections({ routes: [] });
  if (directLine) directLine.setMap(null);

  // Draw straight line from start to end
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: from }, (fromResults, status1) => {
    if (status1 === "OK") {
      const fromLocation = fromResults[0].geometry.location;

      geocoder.geocode({ address: to }, (toResults, status2) => {
        if (status2 === "OK") {
          const toLocation = toResults[0].geometry.location;

          directLine = new google.maps.Polyline({
            path: [fromLocation, toLocation],
            geodesic: true,
            strokeColor: "#FF0000", // Red straight line
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: map
          });

          // Adjust map to fit the line
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(fromLocation);
          bounds.extend(toLocation);
          map.fitBounds(bounds);

        } else {
          alert("Could not find destination coordinates: " + status2);
        }
      });

    } else {
      alert("Could not find start coordinates: " + status1);
    }
  });

  // Calculate safest walking route
  directionsService.route(
    {
      origin: from,
      destination: to,
      travelMode: google.maps.TravelMode.WALKING,
      provideRouteAlternatives: true
    },
    (result, status) => {
      if (status === "OK") {
        let safeRoute = null;

        result.routes.forEach(route => {
          let isUnsafe = false;

          route.legs[0].steps.forEach(step => {
            unsafeStreets.forEach(street => {
              if (step.instructions.includes(street)) {
                isUnsafe = true;
              }
            });
          });

          if (!isUnsafe && !safeRoute) {
            safeRoute = route;
          }
        });

        if (safeRoute) {
          directionsRenderer.setDirections({ routes: [safeRoute] });
          alert("✅ Safest route found!");
        } else {
          directionsRenderer.setDirections(result);
          alert("⚠️ No fully safe route, showing best available.");
        }
      } else {
        alert("Error calculating route: " + status);
      }
    }
  );
});
