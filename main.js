var pointLight,
    sun,
    earth,
    earthOrbit,
    controls,
    scene,
    camera,
    renderer,
    scene;
var planetSegments = 78;
var earthData = constructPlanetData(
    365.2564,
    0.015,
    25,
    "earth",
    "img/earth.jpg",
    5,
    planetSegments
);
var moonData = constructPlanetData("#", "#");
var orbitData = { value: 200, runOrbit: false, runRotation: true };
var clock = new THREE.Clock();

//////////////////////////////////////////////////////////////////////
function constructPlanetData(
    myOrbitRate,
    myRotationRate,
    myDistanceFromAxis,
    myName,
    myTexture,
    mySize,
    mySegments
) {
    return {
        orbitRate: myOrbitRate,
        rotationRate: myRotationRate,
        distanceFromAxis: myDistanceFromAxis,
        name: myName,
        texture: myTexture,
        size: mySize,
        segments: mySegments,
    };
}

function getTube(size, innerDiameter, facets, myColor, name, distanceFromAxis) {
    var ringGeometry = new THREE.TorusGeometry(
        size,
        innerDiameter,
        facets,
        facets
    );
    var ringMaterial = new THREE.MeshBasicMaterial({
        color: myColor,
        side: THREE.DoubleSide,
    });
    myRing = new THREE.Mesh(ringGeometry, ringMaterial);
    myRing.name = name;

    myRing.rotation.x = Math.PI / 2;
    scene.add(myRing);
    return myRing;
}

//////////////////////////////////////////////////////////////////////
function getMaterial(type, color, myTexture) {
    var materialOptions = {
        color: color === undefined ? "rgb(255, 255, 255)" : color,
        map: myTexture === undefined ? null : myTexture,
    };

    switch (type) {
        case "basic":
            return new THREE.MeshBasicMaterial(materialOptions);
        case "lambert":
            return new THREE.MeshLambertMaterial(materialOptions);
        case "phong":
            return new THREE.MeshPhongMaterial(materialOptions);
        case "standard":
            return new THREE.MeshStandardMaterial(materialOptions);
        default:
            return new THREE.MeshBasicMaterial(materialOptions);
    }
}
                        // Orbit-Width
//////////////////////////////////////////////////////////////////////
function createVisibleOrbits() {
    var orbitWidth = 0.01;
    earthOrbit = getRing(
        earthData.distanceFromAxis + orbitWidth,
        earthData.distanceFromAxis - orbitWidth,
        1320,
        0xffffff,
        "earthOrbit",
        0
    );
}

//////////////////////////////////////////////////////////////////////
function getSphere(material, size, segments) {
    var geometry = new THREE.SphereGeometry(size, segments, segments);
    var obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;

    return obj;
}

//////////////////////////////////////////////////////////////////////
function loadTexturedPlanet(myData, x, y, z, myMaterialType) {
    var myMaterial;
    var passThisTexture;

    if (myData.texture && myData.texture !== "") {
        passThisTexture = new THREE.ImageUtils.loadTexture(myData.texture);
    }
    if (myMaterialType) {
        myMaterial = getMaterial(
            myMaterialType,
            "rgb(255, 255, 255 )",
            passThisTexture
        );
    } else {
        myMaterial = getMaterial(
            "lambert",
            "rgb(255, 255, 255 )",
            passThisTexture
        );
    }

    myMaterial.receiveShadow = true;
    myMaterial.castShadow = true;
    var myPlanet = getSphere(myMaterial, myData.size, myData.segments);
    myPlanet.receiveShadow = true;
    myPlanet.name = myData.name;
    scene.add(myPlanet);
    myPlanet.position.set(x, y, z);

    return myPlanet;
}

//////////////////////////////////////////////////////////////////////
function getPointLight(intensity, color) {
    var light = new THREE.PointLight(color, intensity);
    light.castShadow = true;

    light.shadow.bias = 0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    return light;
}

/**
 * the planet around its orbit, and rotate it.
 
 */
function movePlanet(myPlanet, myData, myTime, stopRotation) {
    if (orbitData.runRotation && !stopRotation) {
        myPlanet.rotation.y += myData.rotationRate;
    }
    if (orbitData.runOrbit) {
        myPlanet.position.x =
            Math.cos(
                myTime * (1.22 / (myData.orbitRate * orbitData.value)) + 10.0
            ) * myData.distanceFromAxis;
        myPlanet.position.z =
            Math.sin(
                myTime * (1.22 / (myData.orbitRate * orbitData.value)) + 10.0
            ) * myData.distanceFromAxis;
    }
}

//////////////////////////////////////////////////////////////////////
function update(renderer, scene, camera, controls) {
    pointLight.position.copy(sun.position);
    controls.update();

    var time = Date.now();

    movePlanet(earth, earthData, time);
    movePlanet(ring, earthData, time, true);

    renderer.render(scene, camera);
    requestAnimationFrame(function() {
        update(renderer, scene, camera, controls);
    });
}

//////////////////////////////////////////////////////////////////////
function init() {
    // Create the camera that allows us to view into the scene.
    camera = new THREE.PerspectiveCamera(
        45, // field of view
        window.innerWidth / window.innerHeight, // aspect ratio
        1, // near clipping plane
        1000 // far clipping plane
    );
    camera.position.z = 60;
    camera.position.x = -60;
    camera.position.y = 60;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Create the scene that holds all of the visible objects.
    scene = new THREE.Scene();

    // Create the renderer that controls animation.
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Attach the renderer to the div element.
    document.getElementById("webgl").appendChild(renderer.domElement);

    // Create controls that allows a user to move the scene with a mouse.
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Load the images used in the background.
    var path = "cubemap/";
    var format = ".jpg";
    var urls = [
        path + "px" + format,
        path + "nx" + format,
        path + "py" + format,
        path + "ny" + format,
        path + "pz" + format,
        path + "nz" + format,
    ];
    var reflectionCube = new THREE.CubeTextureLoader().load(urls);
    reflectionCube.format = THREE.RGBFormat;

    // Attach the background cube to the scene.
    scene.background = reflectionCube;

    // Create light from the sun.
    pointLight = getPointLight(1.5, "rgb(255, 220, 180)");
    scene.add(pointLight);

    // Create light that is viewable from all directions.
    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    // Create the sun.
    var sunMaterial = getMaterial("basic", "rgb(255, 255, 153)");
    sun = getSphere(sunMaterial, 16, 48);
    scene.add(sun);

    // Create the glow of the sun.
    var spriteMaterial = new THREE.SpriteMaterial({
        
        useScreenCoordinates: false,
        color: 0xffffee,
        transparent: false,
        blending: THREE.AdditiveBlending,
    });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(70, 70, 1.0);
    sun.add(sprite); // This centers the glow at the sun.

    // Create the Earth, the Moon, and a ring around the earth.
    earth = loadTexturedPlanet(earthData, earthData.distanceFromAxis, 0, 0);
    moon = loadTexturedPlanet(moonData, moonData.distanceFromAxis, 0, 0);
    

    //////////////////////////////////////////////////////////////////////
    update(renderer, scene, camera, controls);
}

//////////////////////////////////////////////////////////////////////
init();