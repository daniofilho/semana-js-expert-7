import cardsFactory from './factories/cardsFactory.js';
import handGestureFactory from './factories/handGestureFactory.js';

await handGestureFactory.initialize();
await cardsFactory.initialize();
