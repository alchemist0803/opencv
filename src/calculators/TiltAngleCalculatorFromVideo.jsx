import React, { useEffect, useRef, useState } from 'react';
import { Image } from 'image-js';

import uploadImg from '../assets/imgs/upload.png';
import background from '../assets/imgs/background.png';

const TiltAngleCalculatorFromVideo = () => {
  const [video, setVideo] = useState(null);
  const [angle1, setAngle1] = useState(null);
  const [angle2, setAngle2] = useState(null);
  const [tiltAngle, setTiltAngle] = useState(null);
  const [processedImg, setProcessedImg] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (video) {
      processVideo(video);
    }
  }, [video]);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      setVideo(videoURL);
    }
  };

  // Process each video frame
  const processVideo = (videoSrc) => {
    const videoElement = videoRef.current;
    videoElement.src = videoSrc;

    videoElement.addEventListener('play', () => {
      const processFrame = async () => {
        if (!videoElement.paused && !videoElement.ended) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;

          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL('image/png');

          // Process the frame to get tilt angle
          await processFrameForTiltAngle(frameData);

          // Request the next frame
          requestAnimationFrame(processFrame);
        }
      };
      processFrame();
    });
  };

  // Custom Thresholding to remove background
  const thresholdImage = (img, thresholdValue) => {
    const width = img.width;
    const height = img.height;
    const thresholdedImg = img.clone(); // Create a new image

    // Helper function to get grayscale value of a pixel
    const getGrayValue = (x, y) => {
      const pixel = img.getPixelXY(x, y);
      return pixel[0]; // Assuming grayscale intensity is in the first channel
    }

    for (let y = 1; y < height - 1; y++) {  // Avoid edges
      for (let x = 1; x < width - 1; x++) {
        const currentGrayValue = getGrayValue(x, y);

        // Get grayscale values of the neighboring pixels (8-connected neighbors)
        const neighbors = [
          getGrayValue(x - 1, y), // Left
          getGrayValue(x + 1, y), // Right
          getGrayValue(x, y - 1), // Top
          getGrayValue(x, y + 1), // Bottom
          getGrayValue(x - 1, y - 1), // Top-left
          getGrayValue(x + 1, y - 1), // Top-right
          getGrayValue(x - 1, y + 1), // Bottom-left
          getGrayValue(x + 1, y + 1)  // Bottom-right
        ];

        // console.log('neighbors', neighbors);
        // console.log('currentGrayValue', currentGrayValue);

        // Calculate the maximum difference in grayscale value with its neighbors
        const maxDifference = Math.max(...neighbors.map(neighbor => Math.abs(currentGrayValue - neighbor)));
        // If no significant difference, set pixel to black
        // if (maxDifference > thresholdValue) {
        //   thresholdedImg.setPixel(x, y, [0, 0, 0]); // Set to black
        // } else {
        //   thresholdedImg.setPixel(x, y, [255, 255, 255]); // Set to white (foreground)
        // }
        thresholdedImg.setPixel(x, y, [0, 0, 0]); // Set to black
      }
    }

    return thresholdedImg;
  };

  // Process the frame to calculate the angle using image-js
  const processFrameForTiltAngle = async (frameSrc) => {
    let img = await Image.load(frameSrc);
    let hslImage = img.colorDepth(8).hsl();
    for (let i = 0; i < img.width * img.height; i++) {
      let [h, s, l] = hslImage.getPixel(i);
      // if (h > 190 && h < 250) { // Range for blue colors
      //   img.setPixel(i, [255, 255, 255]); // Replace with white
      // }
      if (l > 10) {
        img.setPixel(i, [255, 255, 255]);
      }
    }

    const gray = img.grey();
    // const thresholded = gray.threshold({ lower: 100, upper: 255 });
    const thresholded = thresholdImage(gray, 300);
    setProcessedImg(gray.toDataURL());
    const edges = thresholded.sobelFilter();
    // setProcessedImg(edges.toDataURL());
    let edgePoints = [];
    for (let y = 0; y < edges.height; y++) {
      for (let x = 0; x < edges.width; x++) {
        if (edges.getPixelXY(x, y)[0] > 0) {
          edgePoints.push([x, y]);
        }
      }
    }

    if (edgePoints.length < 2) {
      console.error("Not enough edge points detected.");
      return;
    }
    // console.log('edges', edgePoints);

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

    // Convert to "vertical-based" angle
    if (angleDeg > 0) {
      angleDeg = 90 - angleDeg;
    } else {
      angleDeg = 90 + angleDeg;
    }
    console.log('angleDeg', angleDeg);
    setAngle1(angleDeg); // You can set angle1 or angle2 depending on your needs
    calculateTilt(); // Calculate tilt angle with the new value
  };

  // Calculate Tilt Angle
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
        <h2 color='black'>Tilt Angle Calculator from Video</h2>

        <div style={{ marginTop: '30px' }}>
          <div onClick={() => document.getElementById('video-upload').click()} style={{ background: 'white', borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid black' }}>
            <input id="video-upload" type="file" style={{ display: 'none' }} onChange={handleVideoUpload} />
            <p>Upload Video</p>
          </div>
        </div>

        <div style={{ marginTop: '30px' }}>
          {video && (
            <video ref={videoRef} width="640" height="360" controls autoPlay muted>
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Display tilt angle */}
        {tiltAngle !== null && <h3>Tilt Angle: {tiltAngle.toFixed(2)}°</h3>}
        {processedImg !== null ? <img src={processedImg} alt="Processed" /> : null}
      </div>
    </>
  );
};

export default TiltAngleCalculatorFromVideo;
