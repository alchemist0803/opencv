import ObjectDetectionFromCamera from "./calculators/ObjectDetectionFromCamera";
import TiltAngleCalculatorFromImg from "./calculators/TiltAngleCalculatorFromImg";
import TiltAngleCalculatorFromVideo from "./calculators/TiltAngleCalculatorFromVideo";

function App() {
  return (
    <>
      {/* Image-js is working well if the image is clear, but not on practical */}
      {/* <TiltAngleCalculatorFromImg /> */}
      {/* Trying to use Tensorflow in complex situation */}
      <TiltAngleCalculatorFromVideo />
      {/* Using camera to capture images */}
      {/* <ObjectDetectionFromCamera /> */}
    </>
  );
}

export default App;
