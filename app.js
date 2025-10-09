///////// SCAFFOLD.
// 1. Importar librerías.
console.log(THREE);
console.log(gsap);

// 2. Configurar canvas.
const canvas = document.getElementById("lienzo");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 3. Configurar escena 3D.
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true }); // <-- agrega alpha: true
renderer.setSize(canvas.width, canvas.height);
const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);

// 3.1 Configurar mesh.
//const geo = new THREE.TorusKnotGeometry(1, 0.35, 128, 5, 2);
//const geo = new THREE.SphereGeometry(1.5, 128, 128);
const geo = new THREE.OctahedronGeometry(1.5, 50); // <-- Cambia aquí

const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    wireframe: true,
});
const mesh = new THREE.Mesh(geo, material);
scene.add(mesh);
mesh.position.z = -7;

// 3.2 Crear luces.
const frontLight = new THREE.PointLight("#fff9e0", 50, 50);
frontLight.position.set(7, 7, 7);
scene.add(frontLight);

const rimLight = new THREE.PointLight("#fff9e0", 50, 50);
rimLight.position.set(-7, -7, -7);
scene.add(rimLight);



///////// EN CLASE.

//// A) Cargar múltiples texturas.

// 1. "Loading manager".
const manager = new THREE.LoadingManager();

manager.onStart = function (url, itemsLoaded, itemsTotal) {
   console.log(`Iniciando carga de: ${url} (${itemsLoaded + 1}/${itemsTotal})`);
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
   console.log(`Cargando: ${url} (${itemsLoaded}/${itemsTotal})`);
};

manager.onLoad = function () {
   console.log('✅ ¡Todas las texturas cargadas!');
   createMaterial();
};

manager.onError = function (url) {
   console.error(`❌ Error al cargar: ${url}`);
};

// 2. "Texture loader" para nuestros assets.
const loader = new THREE.TextureLoader(manager);

// "Cube texture loader" para cargar skyboxes o environment maps.
const cubeTexLoader = new THREE.CubeTextureLoader(manager);

// 3. Cargamos texturas guardadas en el folder del proyecto.
const pointsTexture = {
   albedo: loader.load('./assets/texturas/puntos/albedo.png'),
   ao: loader.load('./assets/texturas/puntos/ao.png'),
   metalness: loader.load('./assets/texturas/puntos/metallic.png'),
   height: loader.load('./assets/texturas/puntos/height.png'),
   ogl: loader.load('./assets/texturas/puntos/ogl.png'),
   roughness: loader.load('./assets/texturas/puntos/roughness.png'),
   displacement: loader.load('./assets/texturas/puntos/height.png'),
};
var pointsMaterial;
var metalMaterial;

const envMap = cubeTexLoader.load([
   './assets/texturas/mapcubes/Creek/posx.jpg', './assets/texturas/mapcubes/Creek/negx.jpg',   // +X, -X
   './assets/texturas/mapcubes/Creek/posy.jpg', './assets/texturas/mapcubes/Creek/negy.jpg',   // +Y, -Y
   './assets/texturas/mapcubes/Creek/posz.jpg', './assets/texturas/mapcubes/Creek/negz.jpg'    // +Z, -Z
]);

scene.background = envMap;

// 4. Crear material con las texturas cargadas.

function createMaterial() {
    pointsMaterial = new THREE.MeshStandardMaterial({
        envMap: envMap,
        map: pointsTexture.albedo,
        aoMap: pointsTexture.ao,
        //metalnessMap: pointsTexture.metalness,
        normalMap: pointsTexture.normal,
        roughnessMap: pointsTexture.roughness,
        displacementMap: pointsTexture.displacement,
        displacementScale: 0.7,
        side: THREE.FrontSide,
        metalness: 0.3,
         roughness: 0.8,
         // color: "#ffffff",
        // wireframe: true,
    });

    metalMaterial = new THREE.MeshStandardMaterial({
         envMap: envMap,
         map: metalTexture.albedo,
         aoMap: metalTexture.ao,
         normalMap: metalTexture.normal,
         side: THREE.DoubleSide,
         metalness: 0.9,
         roughness: 0.3,
      });
    mesh.material = pointsMaterial;
}

const metalTexture = {
    albedo: loader.load('./assets/texturas/metal/albedo.png'),
   ao: loader.load('./assets/texturas/metal/ao.png'),
   normal: loader.load('./assets/texturas/metal/ogl.png'),
}


function createMetalMaterial() {
      
   }

//// B) Rotación al scrollear.

// 1. Crear un objeto con la data referente al SCROLL para ocuparla en todos lados.
var scroll = {
   y: 0,
   lerpedY: 0,
   speed: 0.005,
   cof: 0.1
};

// 2. Escuchar el evento scroll y actualizar el valor del scroll.
function updateScrollData(eventData) {
   scroll.y += eventData.deltaX * scroll.speed;
}

window.addEventListener("wheel", updateScrollData);

// 3. Aplicar el valor del scroll a la rotación del mesh. (en el loop de animación)
function updateMeshRotation() {
   mesh.rotation.y = scroll.lerpedY;
}

// 5. Vamos a suavizar un poco el valor de rotación para que los cambios de dirección sean menos bruscos.
function lerpScrollY() {
     scroll.lerpedY += (scroll.y - scroll.lerpedY) * scroll.cof;
}

//// C) Movimiento de cámara con mouse (fricción) aka "Gaze Camera".
// 1. Crear un objeto con la data referente al MOUSE para ocuparla en todos lados.
var mouse = {
   x: 0,
   y: 0,
   normalOffset: {
       x: 0,
       y: 0
   },
   lerpNormalOffset: {
       x: 0,
       y: 0
   },

   cof: 0.07,
   gazeRange: {
       x: 70,
       y: 30
   }
}
// 2. Leer posición del mouse y calcular distancia del mouse al centro.
function updateMouseData(eventData) {
   updateMousePosition(eventData);
   calculateNormalOffset();
}
function updateMousePosition(eventData) {
   mouse.x = eventData.clientX;
   mouse.y = eventData.clientY;
}
function calculateNormalOffset() {
   let windowCenter = {
       x: canvas.width / 2,
       y: canvas.height / 2,
   }
   mouse.normalOffset.x = ( (mouse.x - windowCenter.x) / canvas.width ) * 2;
   mouse.normalOffset.y = ( (mouse.y - windowCenter.y) / canvas.height ) * 2;
}
function lerpDistanceToCenter() {
   mouse.lerpNormalOffset.x += (mouse.normalOffset.x - mouse.lerpNormalOffset.x) * mouse.cof;
   mouse.lerpNormalOffset.y += (mouse.normalOffset.y - mouse.lerpNormalOffset.y) * mouse.cof;
}

window.addEventListener("mousemove", updateMouseData);

// 3. Aplicar valor calculado a la posición de la cámara. (en el loop de animación)
function updateCameraPosition() {
   camera.position.x = mouse.lerpNormalOffset.x * mouse.gazeRange.x;
   camera.position.y = -mouse.lerpNormalOffset.y * mouse.gazeRange.y;
}

///////// Interacción al click.
// Al hacer click en el canvas, animamos el scale del mesh.
canvas.addEventListener("click", () => {
   gsap.to(mesh.scale, {
       x: mesh.scale.x + 0.2,
       y: mesh.scale.y + 0.2,
       z: mesh.scale.z + 0.2,
       duration: 1,
       ease: "bounce.out" // puedes cambiarlo a ease: "power2.out", etc.
   });
});

// Cambia a textura "puntos" al hacer click en el botón correspondiente
document.getElementById('pointsButton').addEventListener('click', function() {
    mesh.material = pointsMaterial;
});

// Cambia a textura "metal" al hacer click en el botón correspondiente
document.getElementById('metalButton').addEventListener('click', function() {
    mesh.material = metalMaterial;
});

///////// FIN DE LA CLASE.





/////////
// Final. Crear loop de animación para renderizar constantemente la escena.
function animate() {
    requestAnimationFrame(animate);

    lerpScrollY();
    updateMeshRotation();

   lerpDistanceToCenter();
    updateCameraPosition();
    camera.lookAt(mesh.position);

    renderer.render(scene, camera);
}

animate();

document.addEventListener('DOMContentLoaded', function() {
    const instrucciones = document.querySelector('.instrucciones');
    let faded = false;

    function fadeInstructions() {
        if (!faded && instrucciones) {
            instrucciones.style.opacity = '0';
            faded = true;
        }
    }

    window.addEventListener('scroll', fadeInstructions, { once: true });
    window.addEventListener('wheel', fadeInstructions, { once: true });
    window.addEventListener('touchmove', fadeInstructions, { once: true });
    window.addEventListener('keydown', fadeInstructions, { once: true });
});

function updateCanvasSize() {
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;
}

function updateRenderer() {
   renderer.setSize(canvas.width, canvas.height);

   // actualizar pixel ratio (para pantallas retina, pero limitar a 2 para rendimiento)
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function updateCameraAspect() {
   camera.aspect = canvas.width / canvas.height;
   camera.updateProjectionMatrix();
}

 
window.addEventListener("resize", function() {
   updateCanvasSize();
   updateRenderer();
   updateCameraAspect();
});
