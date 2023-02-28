import { gestureStrings, knownGestures } from '../utils/gestures.js';

export default class HandGestureService {
  #gestureEstimator;
  #fingerpose;
  #handPoseDetection;
  #handsVersion;
  #detector = null;

  constructor({ fingerpose, handPoseDetection, handsVersion }) {
    this.#gestureEstimator = new fingerpose.GestureEstimator(knownGestures);
    this.#fingerpose = fingerpose;
    this.#handPoseDetection = handPoseDetection;
    this.#handsVersion = handsVersion;
  }

  async estimate(keypoints3D) {
    const predictions = await this.#gestureEstimator.estimate(
      this.#getLandmarksFromKeypoints(keypoints3D),
      // percentual de confiança no gesto
      9 // 90%
    );

    return predictions.gestures;
  }

  async *detectGestures(predictions) {
    for (const hand of predictions) {
      if (!hand.keypoints3D) continue;

      const gestures = await this.estimate(hand.keypoints3D);

      if (!gestures.length) continue;

      // retorna só o gesto que tiver o maior score / probabilidade de estar certo
      const result = gestures.reduce((prev, current) =>
        prev.score > current.score ? prev : current
      );

      const { x, y } = hand.keypoints.find((keypoint) => keypoint.name === 'index_finger_tip');

      yield { event: result.name, x, y }; // ao identificar gesto, já avisa quem chamou essa função e continua o trabalho

      console.log('detected', gestureStrings[result.name]);
    }
  }

  #getLandmarksFromKeypoints(keypoints3D) {
    return keypoints3D.map((keypoint) => [keypoint.x, keypoint.y, keypoint.z]);
  }

  async estimateHands(video) {
    return this.#detector.estimateHands(video, {
      flipHorizontal: true,
    });
  }

  async initializeDetector() {
    if (this.#detector) return this.#detector;

    const detectorConfig = {
      runtime: 'mediapipe', // or 'tfjs',
      solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${this.#handsVersion}`,
      // 'full' é o mais pesado e o mais preciso, mas 'lite' resolve
      modelType: 'lite',
      maxHands: 2,
    };

    this.#detector = await this.#handPoseDetection.createDetector(
      this.#handPoseDetection.SupportedModels.MediaPipeHands,
      detectorConfig
    );
  }
}