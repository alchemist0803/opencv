import React, { useEffect, useRef, useState } from 'react';
import { Image } from 'image-js';

import uploadImg from '../assets/imgs/upload.png';
import background from '../assets/imgs/background.png';

const TiltAngleCalculatorFromImg = () => {
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
  // Handle Image Upload
  const handleImageUpload = (e, setImage) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  // Process Image with image-js
  const processImage = async (imageSrc, setAngle) => {
    const img = await Image.load(imageSrc);
    const gray = img.grey();
    const edges = gray.sobelFilter(); // Edge detection

    // Get all edge pixels
    let edgePoints = [];
    for (let y = 0; y < edges.height; y++) {
      for (let x = 0; x < edges.width; x++) {
        if (edges.getPixelXY(x, y)[0] > 0) { // Check if pixel is part of an edge
          edgePoints.push([x, y]);
        }
      }
    }

    if (edgePoints.length < 2) {
      console.error("Not enough edge points detected.");
      return;
    }

    // Perform PCA (Principal Component Analysis)
    const meanX = edgePoints.reduce((sum, p) => sum + p[0], 0) / edgePoints.length;
    const meanY = edgePoints.reduce((sum, p) => sum + p[1], 0) / edgePoints.length;

    let covXX = 0, covYY = 0, covXY = 0;
    for (const [x, y] of edgePoints) {
      const dx = x - meanX;
      const dy = y - meanY;
      covXX += dx * dx;
      covYY += dy * dy;
      covXY += dx * dy;
    }

    // Compute orientation
    const angleRad = 0.5 * Math.atan2(2 * covXY, covXX - covYY);
    let angleDeg = angleRad * (180 / Math.PI);

    // Convert to "vertical-based" angle (90° should be 0°, right tilt = +, left tilt = -)
    if (angleDeg > 0) {
      angleDeg = 90 - angleDeg;
    } else {
      angleDeg = 90 + angleDeg;
    }

    console.log(`Detected angle: ${angleDeg.toFixed(2)}°`);
    setAngle(angleDeg);
  };

  // Calculate Tilt Angle Between Two Images
  const calculateTilt = () => {
    if (angle1 !== null && angle2 !== null) {
      const xRad = (angle1 * Math.PI) / 180;
      const yRad = (angle2 * Math.PI) / 180;

      // Compute tan^2(x) + tan^2(y)
      const tanSquaredSum = Math.pow(Math.tan(xRad), 2) + Math.pow(Math.tan(yRad), 2);

      // Compute z in radians
      const zRad = Math.atan(Math.sqrt(tanSquaredSum));

      // Convert back to degrees
      const zDeg = (zRad * 180) / Math.PI;
      setTiltAngle(zDeg);
    }
  };

  return (
    <>
      <img src={background} width="100%" alt="BG" style={{ position: 'absolute', inset: '0', height: '100%' }} />
      <div style={{ textAlign: 'center', zIndex: '1', position: 'relative' }}>
        <h2>Tilt Angle Calculator</h2>

        <div style={{ display: 'flex', marginTop: '30px', justifyContent: 'center', alignItems: 'cneter', gap: '30px' }}>
          {/* Upload Image 1 */}
          <div onClick={handleLeftClick} style={{ background: 'white', borderRadius: '10px', minHeight: '150px', display: 'flex', flexDirection: 'column', border: '1px solid black', width: '300px', padding: '10px' }}>
            {image1 ? (
              <img src={image1} alt="Image 1" height={300} />
            ) : (
              <img src={uploadImg} alt="Upload" width={50} style={{ margin: 'auto' }} />
            )}
            <input ref={leftImgRef} type="file" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setImage1)} />
            {angle1 !== null && <p>Angle 1: {angle1.toFixed(2)}°</p>}
          </div>

          {/* Upload Image 2 */}
          <div onClick={handleRightClick} style={{ background: 'white', borderRadius: '10px', minHeight: '150px', display: 'flex', flexDirection: 'column', border: '1px solid black', width: '300px', padding: '10px' }}>
            {image2 ? (
              <img src={image2} alt="Image 2" height={300} />
            ) : (
              <img src={uploadImg} alt="Upload" width={50} style={{ margin: 'auto' }} />
            )}
            <input ref={rightImgRef} type="file" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setImage2)} />
            {angle2 !== null && <p>Angle 2: {angle2.toFixed(2)}°</p>}
          </div>
        </div>
        {/* Calculate Tilt Angle */}
        {tiltAngle !== null && <h3>Tilt Angle: {tiltAngle.toFixed(2)}°</h3>}
      </div>
    </>
  );
};

export default TiltAngleCalculatorFromImg;
