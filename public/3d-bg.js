const canvas = document.querySelector('#bg-canvas');

// Scene Setup
const scene = new THREE.Scene();

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 150;

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Particle Network Variables
const particlesData = [];
const particleCount = 400; // High count for premium feel
const r = 400; // Radius
const maxDistance = 35; // Connect distance

// Geometries
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);

const color1 = new THREE.Color(0x3b82f6); // Accent 1
const color2 = new THREE.Color(0x8b5cf6); // Accent 2

for (let i = 0; i < particleCount; i++) {
  const x = Math.random() * r - r / 2;
  const y = Math.random() * r - r / 2;
  const z = Math.random() * r - r / 2;

  particlePositions[i * 3] = x;
  particlePositions[i * 3 + 1] = y;
  particlePositions[i * 3 + 2] = z;

  // Add some movement data
  particlesData.push({
    velocity: new THREE.Vector3(-0.2 + Math.random() * 0.4, -0.2 + Math.random() * 0.4, -0.2 + Math.random() * 0.4),
    numConnections: 0
  });

  // Color mix
  const mixedColor = color1.clone().lerp(color2, Math.random());
  particleColors[i * 3] = mixedColor.r;
  particleColors[i * 3 + 1] = mixedColor.g;
  particleColors[i * 3 + 2] = mixedColor.b;
}

particles.setDrawRange(0, particleCount);
particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
particles.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

// Particle Material
const pMaterial = new THREE.PointsMaterial({
  size: 2,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  transparent: true,
  opacity: 0.8
});

const pointCloud = new THREE.Points(particles, pMaterial);
scene.add(pointCloud);

// Lines Setup
const linesGeometry = new THREE.BufferGeometry();
const linePositions = new Float32Array(particleCount * particleCount * 3);
const lineColors = new Float32Array(particleCount * particleCount * 3);

linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

const linesMaterial = new THREE.LineBasicMaterial({
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  transparent: true,
  opacity: 0.15
});

const linesMesh = new THREE.LinePieces(linesGeometry, linesMaterial);
scene.add(linesMesh);

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY);
});

// Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Smooth Camera Pan based on Mouse
  targetX = mouseX * 0.05;
  targetY = mouseY * 0.05;
  camera.position.x += (targetX - camera.position.x) * 0.02;
  camera.position.y += (-targetY - camera.position.y) * 0.02;
  camera.lookAt(scene.position);

  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  for (let i = 0; i < particleCount; i++)
    particlesData[i].numConnections = 0;

  for (let i = 0; i < particleCount; i++) {
    const particleData = particlesData[i];

    particlePositions[i * 3] += particleData.velocity.x;
    particlePositions[i * 3 + 1] += particleData.velocity.y;
    particlePositions[i * 3 + 2] += particleData.velocity.z;

    // Bounce off walls
    if (particlePositions[i * 3] < -r / 2 || particlePositions[i * 3] > r / 2) particleData.velocity.x = -particleData.velocity.x;
    if (particlePositions[i * 3 + 1] < -r / 2 || particlePositions[i * 3 + 1] > r / 2) particleData.velocity.y = -particleData.velocity.y;
    if (particlePositions[i * 3 + 2] < -r / 2 || particlePositions[i * 3 + 2] > r / 2) particleData.velocity.z = -particleData.velocity.z;

    // Check connections
    for (let j = i + 1; j < particleCount; j++) {
      const particleDataB = particlesData[j];
      
      const dx = particlePositions[i * 3] - particlePositions[j * 3];
      const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
      const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < maxDistance) {
        particleData.numConnections++;
        particleDataB.numConnections++;

        const alpha = 1.0 - dist / maxDistance;

        linePositions[vertexpos++] = particlePositions[i * 3];
        linePositions[vertexpos++] = particlePositions[i * 3 + 1];
        linePositions[vertexpos++] = particlePositions[i * 3 + 2];

        linePositions[vertexpos++] = particlePositions[j * 3];
        linePositions[vertexpos++] = particlePositions[j * 3 + 1];
        linePositions[vertexpos++] = particlePositions[j * 3 + 2];

        // Match color to particles
        lineColors[colorpos++] = particleColors[i * 3];
        lineColors[colorpos++] = particleColors[i * 3 + 1];
        lineColors[colorpos++] = particleColors[i * 3 + 2];

        lineColors[colorpos++] = particleColors[j * 3];
        lineColors[colorpos++] = particleColors[j * 3 + 1];
        lineColors[colorpos++] = particleColors[j * 3 + 2];

        numConnected++;
      }
    }
  }

  linesMesh.geometry.setDrawRange(0, numConnected * 2);
  linesMesh.geometry.attributes.position.needsUpdate = true;
  linesMesh.geometry.attributes.color.needsUpdate = true;
  pointCloud.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

// Start loop
animate();
