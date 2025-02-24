import React, { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";

const TiltAngleCalculatorFromTensorflow = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [angle1, setAngle1] = useState(null);
  const [angle2, setAngle2] = useState(null);
  const [tiltAngle, setTiltAngle] = useState(null);
  const leftImgRef = useRef(null);
  const rightImgRef = useRef(null);

  useEffect(() => {
    if (image1) {
      processImage(image1, setAngle1);
    }
    if (image2) {
      processImage(image2, setAngle2);
    }
  }, [image1, image2]);

  useEffect(() => {
    calculateTilt();
  }, [angle1, angle2]);

  const handleLeftClick = () => {
    if (leftImgRef.current) {
      leftImgRef.current.click();
    }
  };
  const handleRightClick = () => {
    if (rightImgRef.current) {
      rightImgRef.current.click();
    }
  };

  const handleImageUpload = (e, setImage) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };
  // 0
  // : 
  // bbox
  // : 
  // Array(4)
  // 0
  // : 
  // 23.263683319091797
  // 1
  // : 
  // 3.4604787826538086
  // 2
  // : 
  // 581.2679481506348
  // 3
  // : 
  // 472.541127204895
  // length
  // : 
  // 4
  // [[Prototype]]
  // : 
  // Array(0)
  // class
  // : 
  // "refrigerator"
  // score
  // : 
  // 0.513614296913147
  const processImage = async (imageSrc, setAngle) => {
    const img = new Image();
    img.src = imageSrc;
    console.log('img', img);
    img.onload = async () => {
      const model = await cocossd.load();
      console.log('model', model);
      const predictions = await model.detect(img);
      console.log('predictions', predictions);

      const rod = predictions.find((p) => p.class === "sports ball" || p.class === "stick");
      console.log('rod', rod);
      if (rod) {
        const angleRad = Math.atan2(rod.bbox[3], rod.bbox[2]);
        let angleDeg = angleRad * (180 / Math.PI);
        console.log("angleDeg", angleDeg);
        setAngle(angleDeg.toFixed(2));
      } else {
        setAngle(null);
      }
    }
  };

  const calculateTilt = () => {
    if (angle1 !== null && angle2 !== null) {
      const xRad = (angle1 * Math.PI) / 180;
      const yRad = (angle2 * Math.PI) / 180;
      const tanSquaredSum = Math.pow(Math.tan(xRad), 2) + Math.pow(Math.tan(yRad), 2);
      const zRad = Math.atan(Math.sqrt(tanSquaredSum));
      const zDeg = (zRad * 180) / Math.PI;
      setTiltAngle(zDeg);
    }
  };

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <h2>Tilt Angle Calculator</h2>

        <div style={{ display: 'flex', marginTop: '30px', justifyContent: 'center', gap: '30px' }}>
          <div onClick={handleLeftClick} style={{ background: 'white', borderRadius: '10px', minHeight: '150px', border: '1px solid black', width: '300px', padding: '10px' }}>
            {image1 && <img src={image1} alt="Image 1" height={300} />}
            <input ref={leftImgRef} type="file" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setImage1)} />
            {angle1 !== null && <p>Angle 1: {angle1}°</p>}
          </div>

          <div onClick={handleRightClick} style={{ background: 'white', borderRadius: '10px', minHeight: '150px', border: '1px solid black', width: '300px', padding: '10px' }}>
            {image2 && <img src={image2} alt="Image 2" height={300} />}
            <input ref={rightImgRef} type="file" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setImage2)} />
            {angle2 !== null && <p>Angle 2: {angle2}°</p>}
          </div>
        </div>
        {tiltAngle !== null && <h3>Tilt Angle: {tiltAngle.toFixed(2)}°</h3>}
      </div>
    </>
  );
};

export default TiltAngleCalculatorFromTensorflow;
