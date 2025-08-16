let map, directionsService, directionsRenderer;

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
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    polylineOptions: {
      strokeColor: "#0b3d91",   // Darker blue
      strokeWeight: 5,
      strokeOpacity: 0.9
    }
  });

  // Add glowing streetlights instead of markers
  streetlights.forEach(light => {
    addStreetLamp(map, new google.maps.LatLng(light.lat, light.lng), light.working);
  });
}

// Function to create glowing streetlamp overlays
function addStreetLamp(map, position, working) {
  const overlay = new google.maps.OverlayView();

  overlay.onAdd = function () {
    const div = document.createElement("div");
    div.className = working ? "streetlamp working" : "streetlamp broken";
    this.div = div;

    const panes = this.getPanes();
    panes.overlayMouseTarget.appendChild(div);
  };

  overlay.draw = function () {
    const overlayProjection = this.getProjection();
    const pos = overlayProjection.fromLatLngToDivPixel(position);

    if (this.div) {
      this.div.style.left = pos.x + "px";
      this.div.style.top = pos.y + "px";
      this.div.style.position = "absolute";
      this.div.style.transform = "translate(-50%, -50%)";
    }
  };

  overlay.onRemove = function () {
    if (this.div) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  };

  overlay.setMap(map);
}

// Handle form submission
document.getElementById("routeForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;

  // Clear previous route
  directionsRenderer.setDirections({ routes: [] });

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
