const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');


app.use(bodyParser.json());

// Serve static files from the 'public' directory
 app.use(express.static(path.join(__dirname, '../public')));
  // Serve static files from the 'src/js' directory 
  app.use('/js', express.static(path.join(__dirname, '../src/js'))); 
  // Serve static files from the 'src/css' directory
   app.use('/css', express.static(path.join(__dirname, '../src/css')));
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  })
app.post('/api/find-route', (req, res) => {
    const points = req.body.points;
    const bestRoute = solveTSP(points); 
    res.json({ route: bestRoute });
});

function solveTSP(points) {
    const numPenguins = 50; // Number of penguins
    const maxIterations = 1000; // Maximum number of iterations
    const alpha = 0.8; // Influence factor

    let penguins = [];
    for (let i = 0; i < numPenguins; i++) {
        penguins.push(shuffleArray(points.slice()));
    }

    let bestSolution = penguins[0];
    let bestDistance = calculateTotalDistance(bestSolution);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        for (let i = 0; i < numPenguins; i++) {
            let newSolution = perturbSolution(penguins[i]);
            let newDistance = calculateTotalDistance(newSolution);

            if (newDistance < calculateTotalDistance(penguins[i])) {
                penguins[i] = newSolution;
                if (newDistance < bestDistance) {
                    bestSolution = newSolution;
                    bestDistance = newDistance;
                }
            }
        }
    }

    return bestSolution;
}

function calculateTotalDistance(solution) {
    let totalDistance = 0;
    for (let i = 0; i < solution.length - 1; i++) {
        totalDistance += distance(solution[i], solution[i + 1]);
    }
    totalDistance += distance(solution[solution.length - 1], solution[0]);
    return totalDistance;
}

function distance(pointA, pointB) {
    const [lngA, latA] = pointA;
    const [lngB, latB] = pointB;
    const R = 6371e3; // Radius of the Earth in meters
    const phi1 = latA * Math.PI / 180;
    const phi2 = latB * Math.PI / 180;
    const deltaPhi = (latB - latA) * Math.PI / 180;
    const deltaLambda = (lngB - lngA) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

function perturbSolution(solution) {
    let newSolution = solution.slice();
    let idx1 = Math.floor(Math.random() * newSolution.length);
    let idx2 = Math.floor(Math.random() * newSolution.length);
    [newSolution[idx1], newSolution[idx2]] = [newSolution[idx2], newSolution[idx1]];
    return newSolution;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
