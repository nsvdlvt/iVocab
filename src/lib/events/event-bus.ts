export type AppEvent = 
  | { type: 'LEARNING_ACTIVITY_RECORDED'; payload: { userId: string; count: number; durationSeconds: number; source: string } };

type EventHandler = (event: AppEvent) => void | Promise<void>;

class EventBusImpl {
  private handlers: Record<string, EventHandler[]> = {};

  subscribe(eventType: AppEvent['type'], handler: EventHandler) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
    return () => this.unsubscribe(eventType, handler);
  }

  unsubscribe(eventType: AppEvent['type'], handler: EventHandler) {
    if (!this.handlers[eventType]) return;
    this.handlers[eventType] = this.handlers[eventType].filter(h => h !== handler);
  }

  async publish(event: AppEvent) {
    const handlers = this.handlers[event.type] || [];
    // Execute all handlers concurrently without blocking
    Promise.all(handlers.map(handler => handler(event))).catch(err => {
      console.error(`Error in event handler for ${event.type}`, err);
    });
  }
}

export const EventBus = new EventBusImpl();
