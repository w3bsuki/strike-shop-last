/**
 * Observer Pattern Exports
 * Central export point for all event emitter implementations
 */

export {
  type CartEventType,
  type CartEventData,
  type CartEventListener,
  type CartEventSubscription,
  type CartEventEmitterConfig,
  type EventMetrics,
  CartEventEmitter,
  cartEventEmitter,
  CartAnalyticsListener,
  cartAnalyticsListener,
} from './CartEventEmitter';

// Future event emitter exports will go here
// export { ProductEventEmitter } from './ProductEventEmitter'
// export { OrderEventEmitter } from './OrderEventEmitter'
// export { UserEventEmitter } from './UserEventEmitter'
