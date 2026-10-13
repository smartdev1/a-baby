const fs = require('fs');
const r = JSON.parse(fs.readFileSync('C:\Users\Aristide Adouko\Downloads\a_baby\packages\game-config\road-network.json', 'utf-8'));
console.log('edges type:', typeof r.edges);
console.log('edges size:', r.edges ? r.edges.size : 'N/A');
console.log('edges keys sample:', r.edges ? Object.keys(r.edges).slice(0, 3) : 'none');
console.log('intersections:', r.intersections ? r.intersections.length : 'N/A');
console.log('metadata:', r.metadata);
