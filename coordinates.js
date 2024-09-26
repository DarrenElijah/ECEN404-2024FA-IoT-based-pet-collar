var centerCoords = {lat: 30.616249, lng: -96.336853};

function generateRandomCoordinates(center, radius) {
    // Generate a random number of sides between 3 and 8
    var numSides = Math.floor(Math.random() * 6) + 3;
    var vertices = [];
  
    // Calculate the angle between each vertex
    var angleIncrement = (2 * Math.PI) / numSides;
  
    // Generate coordinates for each vertex with random side lengths
    for (var i = 0; i < numSides; i++) {
        // Generate a random side length
        var randomRadius = radius * (0.5 + Math.random()); // Adjust the multiplier as needed for reasonable lengths
  
        // Calculate coordinates based on the random side length
        var angle = i * angleIncrement;
        var dx = randomRadius * Math.cos(angle);
        var dy = randomRadius * Math.sin(angle);
        var vertex = {
            lat: center.lat + dy,
            lng: center.lng + dx
        };
        vertices.push(vertex);
    }
  
    // Close the polygon by adding the first vertex at the end
    vertices.push(vertices[0]);
  
    return vertices;
}

for (var j = 0; j < 7; j++) {
    var vertices = generateRandomCoordinates(centerCoords, 0.003);
    console.log('Vertices ' + (j+1) + ':', vertices);
}
