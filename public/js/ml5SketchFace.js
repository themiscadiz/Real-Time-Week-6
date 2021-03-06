window.globals = { a: 0, b: 0, c: 0, d: 0, e: 0 };

let faceapi;
let video;
let detections;

let smoothMov = 0.0001;
let lerpPos = [];
let x = 0;
let y = 0;
let pointsLength = 30;


// Position tracking
let _position;
let _positionUp;
let prevPos;
let prevPosUp;
let focalPoint;

// by default all options are set to true
const detection_options = {
    withLandmarks: true,
    withDescriptors: false,
}


function setup() {
    // createCanvas(360, 270);

    // load up your video
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide(); // Hide the video element, and just show the canvas

    faceapi = ml5.faceApi(video, detection_options, modelReady)
    textAlign(RIGHT);
    // textSize(15);

    //  LERP
    for (let i = 0; i < pointsLength; i++) {
        let thispoint = createVector(0, 0);
        lerpPos.push(thispoint);
    }
}

function modelReady() {
    console.log('ready!')
    console.log(faceapi)
    faceapi.detect(gotResults)
}

function gotResults(err, result) {
    if (err) {
        console.log(err)
        return
    }
    // console.log(result)
    detections = result;

    // background(220);
    // background(255);
    // image(video, 0, 0, width, height)
    if (detections) {
        if (detections.length > 0) {
            // console.log(detections)
            drawLandmarks(detections)
        }

    }
    faceapi.detect(gotResults)
}


function drawLandmarks(detections) {
    noFill();
    stroke(161, 95, 251)
    strokeWeight(2)
    // console.log(detections[0].landmarks._positions);

    for (let i = 0; i < detections.length; i++) {

        // drawCircles(detections[i].parts);
        const allPoints = detections[i].landmarks._positions;
        drawCircles(allPoints);
    }
}

function drawCircles(feature) {
    for (let i = 0; i < feature.length; i++) {
        // NO LERP
        // const x = feature[i]._x
        // const y = feature[i]._y
        // let betweenEyes = createVector(feature[27]._x, feature[27]._y)
        // // ellipse(x, y, 10);
        // ellipse(betweenEyes.x, betweenEyes.y, 10);


        // WITH LERP
        lerpPos[i] = createVector(feature[i]._x, feature[i]._y);

        x = lerp(lerpPos[i].x, feature[i]._x, smoothMov);
        y = lerp(lerpPos[i].y, feature[i]._y, smoothMov);

        let smoothPoints = createVector(x, y);
        lerpPos[i] = smoothPoints;
    }
    //   ellipse(lerpPos[27].x, lerpPos[27].y, 10);
    //   window.globals.a = lerpPos[27].x;


    //   let xMap = map(lerpPos[27].x, 0, width, -0.50, 0.50);
    let xMap = map(lerpPos[27].x, 0, width, -.50, .50);
    let yMap = map(lerpPos[27].y, 0, height, 0.50, -0.50);
    //   console.log(lerpPos[27].x);



    // distance 
    let leftEye = createVector(lerpPos[42].x, lerpPos[42].y);
    let rightEye = createVector(lerpPos[39].x, lerpPos[39].y);

    let distance = leftEye.dist(rightEye);
    // console.log(distance);
    let zMap = map(distance, 60, 10, 2, -2);

    let floorLimit = map(yMap, 0.50, -0.10, 2, 0);
    // console.log("yMap ", yMap);
    // console.log("zMap ", zMap);

    window.globals.a = xMap;
    window.globals.b = floorLimit;
    // window.globals.c = zMap;


    // tracking position for buttons
    focalPoint = createVector(lerpPos[27].x, lerpPos[27].y);
    positionTracking(focalPoint);
    positionTrackingUpDown(focalPoint);

}


//******************************** 

function positionTracking(focalPoint) {

    let rightRectSize = createVector(width / 3, height);
    if (focalPoint.x < rightRectSize.x) {
      _position = "RIGHT";
    // _position = 1;
    }
  
    let centerRectSize = createVector(width / 1.5, height);  
    if (focalPoint.x < centerRectSize.x && focalPoint.x > rightRectSize.x) {
      _position = "CENTER";
    // _position = 0;
    }  
  
    let leftRectSize = createVector(width, height);
  
    if (focalPoint.x > centerRectSize.x) {
      _position = "LEFT";
    // _position = -1;
    }

    window.globals.d = _position;

    // update Position in console
    if (prevPos !== _position) {
      console.log(_position);
    }
    prevPos = _position;
  
  }

// **********
// **********
// **********

  function positionTrackingUpDown(focalPoint) {

    let rightRectSize = createVector(width, height / 4);
    if (focalPoint.y < rightRectSize.y) {
        _positionUp = "UP";
    }
  
    let centerRectSize = createVector(width, height);  
    if (focalPoint.y < centerRectSize.y && focalPoint.y > rightRectSize.y) {
        _positionUp = "MIDDLE";
    }  

    window.globals.e = _positionUp;

    // update Position in console
    if (prevPosUp !== _positionUp) {
      console.log(_positionUp);
    }
    prevPosUp = _positionUp;
  
  }