/*
 *
 * This uses code from a THREE.js Multiplayer boilerplate made by Or Fleisher:
 * https://github.com/juniorxsound/THREE.Multiplayer
 * And a WEBRTC chat app made by Mikołaj Wargowski:
 * https://github.com/Miczeq22/simple-chat-app
 *
 * Aidan Nelson, April 2020
 *
 */
class Scene {
  constructor(_movementCallback) {
    this.movementCallback = _movementCallback;

    //THREE scene
    this.scene = new THREE.Scene();
    this.keyState = {};

    //Utility
    this.width = window.innerWidth;
    this.height = window.innerHeight - 100;

    //Add Player
    this.addSelf();

    // Move Player
    this.prevPos;
    this._Pos;
    this.x = 0;
    this.easing = 0.08;

    this.prevPosUp;
    this._PosUp;
    this.y = 1;
    this.easing_y = 0.08;

    // Move Ball
    this.moveBall = false;

    this.time = 3;

    //THREE Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      0.1,
      5000
    );

    this.camera.position.set(0, 1, 20);
    this.scene.add(this.camera);

    // create an AudioListener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.playerGroup.add(this.listener);

    //THREE WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialiasing: true,
    });
    this.renderer.setClearColor(new THREE.Color("#74d2f7"));
    this.renderer.setSize(this.width, this.height);

    // add controls:
    // this.controls = new THREE.PlayerControls(this.camera, this.playerGroup);

    // **** Update Type of Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    // add raycaster
    this.setupRaycaster();

    //Push the canvas to the DOM
    let domElement = document.getElementById("canvas-container");
    domElement.append(this.renderer.domElement);

    //Setup event listeners for events and handle the states
    window.addEventListener("resize", (e) => this.onWindowResize(e), false);
    window.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    window.addEventListener("keyup", (e) => this.onKeyUp(e), false);

    // Helpers
    // this.scene.add(new THREE.GridHelper(500, 500));
    // this.scene.add(new THREE.AxesHelper(10));

    this.addLights();
    createEnvironment(this.scene);

    // Start the loop
    this.frameCount = 0;
    this.update();
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Lighting 💡 0.7

  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffe6, 0.9));
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Clients 👫

  addSelf() {
    let ranColor = new THREE.Color(0xffffff * Math.random());
    let videoMaterial = makeVideoMaterial("local");
    let materialArrow = new THREE.MeshBasicMaterial({ color: ranColor });

    let _head = new THREE.Mesh(new THREE.PlaneGeometry(4, 2, 1), videoMaterial);
    // let _head = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 24), videoMaterial);
    let _arrow = new THREE.Mesh(new THREE.ConeGeometry(.50, 1, 32), materialArrow);

    let rotateMotion = -90;
    _head.position.set(0, 1, 20);
    // _head.position.set(0, 1, 2);
    // _arrow.position.set(0, 3, 2);
    _arrow.position.set(0, 3, 4);
    _head.scale.x = -1;
    _arrow.rotation.x = THREE.Math.degToRad(rotateMotion);

  // // ****************
  // // ****************
  // // ****************
  // // OTHER BEAR
  // // Load the GLTF space model
  // this.loader = new THREE.GLTFLoader();
  // this.loader.load(
  //   // resource URL
  //   './assets/staticModel/bear.glb',
  //   // onLoad callback: what get's called once the full model has loaded
  //   gltf => {
  //     this.model = gltf.scene;
  //     this.scene.add(gltf.scene);

  //     this.model.position.x = 0;
  //     this.model.position.y = 3;
  //     this.model.position.z = 4;

  //     this.model.scale.set(.02, .02, .02);
  //   },
  //   // onProgress callback: optional function for showing progress on model load
  //   undefined,
  //   // onError callback
  //   error => {
  //     console.error(error);
  //   }
  // );

  // // ****************
  // // ****************
  // // ****************


    // https://threejs.org/docs/index.html#api/en/objects/Group
    this.playerGroup = new THREE.Group();
    // this.playerGroup.position.set(0, 0.5, 0);

    this.playerGroup.add(_head);
    this.playerGroup.add(_arrow);

    // add group to scene
    this.scene.add(this.playerGroup);
  }

  // add a client meshes, a video element and  canvas for three.js video texture
  addClient(_id) {
    let videoMaterial = makeVideoMaterial(_id);
    let materialArrow = makeVideoMaterial(_id);

    let _head = new THREE.Mesh(new THREE.PlaneGeometry(4, 2, 1), videoMaterial);
    // let _head = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), videoMaterial);
    let _arrow = new THREE.Mesh(new THREE.ConeGeometry(.50, 1, 32), materialArrow);


    // set position of head before adding to parent object

    _head.position.set(0, 3, -24);
    _arrow.position.set(0, 5, -24);

    _head.scale.x = -1;

    // https://threejs.org/docs/index.html#api/en/objects/Group
    var group = new THREE.Group();
    group.add(_head);
    group.add(_arrow);

    // add group to scene
    this.scene.add(group);

    clients[_id].group = group;

    clients[_id].head = _head;
    clients[_id].head = _arrow;

    clients[_id].desiredPosition = new THREE.Vector3();
    clients[_id].desiredRotation = new THREE.Quaternion();
    clients[_id].movementAlpha = 0;
  }

  removeClient(_id) {
    this.scene.remove(clients[_id].group);
  }

  // overloaded function can deal with new info or not
  updateClientPositions(_clientProps) {
    for (let _id in _clientProps) {
      // we'll update ourselves separately to avoid lag...
      if (_id != id) {
        clients[_id].desiredPosition = new THREE.Vector3().fromArray(
          _clientProps[_id].position
        );
        clients[_id].desiredRotation = new THREE.Quaternion().fromArray(
          _clientProps[_id].rotation
        );
      }
    }
  }

  // snap to position and rotation if we get close
  interpolatePositions() {
    let snapDistance = 0.5;
    let snapAngle = 0.2; // radians
    for (let _id in clients) {
      clients[_id].group.position.lerp(clients[_id].desiredPosition, 0.2);
      clients[_id].group.quaternion.slerp(clients[_id].desiredRotation, 0.2);
      if (
        clients[_id].group.position.distanceTo(clients[_id].desiredPosition) <
        snapDistance
      ) {
        clients[_id].group.position.set(
          clients[_id].desiredPosition.x,
          clients[_id].desiredPosition.y,
          clients[_id].desiredPosition.z
        );
      }
      if (
        clients[_id].group.quaternion.angleTo(clients[_id].desiredRotation) <
        snapAngle
      ) {
        clients[_id].group.quaternion.set(
          clients[_id].desiredRotation.x,
          clients[_id].desiredRotation.y,
          clients[_id].desiredRotation.z,
          clients[_id].desiredRotation.w
        );
      }
    }
  }

  updateClientVolumes() {
    for (let _id in clients) {
      let audioEl = document.getElementById(_id + "_audio");
      if (audioEl) {
        let distSquared = this.camera.position.distanceToSquared(
          clients[_id].group.position
        );

        // if (distSquared > 500) { //Original
          if (distSquared > 1000) {
          // console.log('setting vol to 0')
          audioEl.volume = 0;
        } else {
          // from lucasio here: https://discourse.threejs.org/t/positionalaudio-setmediastreamsource-with-webrtc-question-not-hearing-any-sound/14301/29
          let volume = Math.min(1, 10 / distSquared);
          audioEl.volume = volume;
          // console.log('setting vol to',volume)
        }
      }
    }
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Interaction 🤾‍♀️

  getPlayerPosition() {
    // TODO: use quaternion or are euler angles fine here?
    return [
      [
        // this.playerGroup.position.x = this.x,
        this.playerGroup.position.x,
        this.playerGroup.position.y,
        this.playerGroup.position.z,
      ],
      [
        this.playerGroup.quaternion._x,
        this.playerGroup.quaternion._y,
        this.playerGroup.quaternion._z,
        this.playerGroup.quaternion._w,
      ],
    ];
  }


  getPos() {

    this._Pos = globals.d;
    if (this.prevPos !== this._Pos) {
      console.log("three pos: ", this._Pos);
      this.moveToNewPos();
    }
    this.prevPos = this._Pos;
  }

  moveToNewPos() {
    if (this._Pos === 'RIGHT') {
      // this.moveInX += 1;
      this.moveInX = 14;
      console.log("this is right", this.moveInX);
    }

    else if (this._Pos === 'LEFT') {
      // this.moveInX += -1;
      this.moveInX = -14;
      console.log("this is left", this.moveInX);
    }

    else {
      this.moveInX = 0;
    }
  }
  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////


  getPosUp() {

    this._PosUp = globals.e;
    if (this.prevPosUp !== this._PosUp) {
      console.log("three posUp: ", this._PosUp);
      this.moveToNewPosUp();
    }
    this.prevPosUp = this._PosUp;
  }

  moveToNewPosUp() {
    if (this._PosUp === 'UP') {
      this.moveInY = 10;
      console.log("this is up", this.moveInY);
    }

    else if (this._PosUp === 'MIDDLE') {
      this.moveInY = 1;
      console.log("this is middle", this.moveInY);
    }

    else {
      this.moveInY = 1;
    }
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////

  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.previousIntersects = [];
    window.addEventListener("mouseup", (e) => this.onMouseMove(e), false);
    // window.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
  }

  checkRaycaster() {
    // reset all previous intersects
    this.moveBall = false;
    for (let i = 0; i < this.previousIntersects.length; i++) {
      let obj = this.previousIntersects[i];
      // obj.scale.set(1, 1, 1);
      // obj.position.x;
    }
    //check raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    for (let i = 0; i < intersects.length; i++) {
      // console.log(intersects[i]);

      // intersects[i].object.material.color.set(0xff0000);

      // changing scale of this object
      // intersects[i].object.scale.set(3,3,3);

      this.moveBall = intersects[i];
      // this.moveBall = true;

      // intersects[i].object.position.x += 0.01;

      this.previousIntersects.push(intersects[i].object);
    }
    // this.moveShpere();
    // console.log(intersects.length, "this.moveBall" + this.moveBall);
  }

  moveShpere() {
    console.log("this.moveBall" + this.moveBall);
    return this.moveBall;
  }

  onMouseMove() {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Rendering 🎥

  update() {
   

    this.getPos();
    this.getPosUp();

    // this.time += 0.1,
    // ************
    // Easing
    this.targetX = this.moveInX,
      this.dx = this.targetX - this.x,
      this.x += this.dx * this.easing,

      this.playerGroup.position.x = this.x,
      this.camera.position.x = this.x,

      // ************
      // Easing up and down
      this.targetY = this.moveInY,
      this.dy = this.targetY - this.y,
      this.y += this.dy * this.easing_y,

      this.playerGroup.position.y = this.y,
      this.camera.position.y = this.y,
      // ************
     
      // //  Direct tracking from\ Ml5
      // this.playerGroup.position.x = (globals.a * -1) * 20,
      // this.camera.position.x = (globals.a * -1) * 20,

      // this.camera.position.set((globals.a * -1) * 4, globals.b * 4, globals.c);

      requestAnimationFrame(() => this.update());
    this.frameCount++;

    // updateRaycaster
    this.checkRaycaster();

    updateEnvironment();

    if (this.frameCount % 25 === 0) {
      this.updateClientVolumes();
      this.movementCallback();
    }

    this.interpolatePositions();
    this.controls.update();
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Event Handlers 🍽

  onWindowResize(e) {
    this.width = window.innerWidth;
    this.height = Math.floor(window.innerHeight - window.innerHeight * 0.3);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  // keystate functions from playercontrols
  onKeyDown(event) {
    event = event || window.event;
    this.keyState[event.keyCode || event.which] = true;
  }

  onKeyUp(event) {
    event = event || window.event;
    this.keyState[event.keyCode || event.which] = false;
  }
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// Utilities

function makeVideoMaterial(_id) {
  let videoElement = document.getElementById(_id + "_video");
  let videoTexture = new THREE.VideoTexture(videoElement);

  let videoMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    overdraw: true,
    side: THREE.DoubleSide,
  });

  return videoMaterial;
}
