import { EventEmitter as EE } from "events";

export class EventEmitter extends EE {
  waitFor(event: string, errorEvents = ["error"]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // Track event sources for cleanup
      const eventMappings: Array<{ source: EventEmitter; event: string; handler: (e: unknown) => void }> = [];

      const cleanup = () => {
        // Clean up all registered event handlers
        for (const mapping of eventMappings) {
          mapping.source.off(mapping.event, mapping.handler);
        }
      };

      const resolver = (e: unknown) => {
        cleanup();
        resolve(e);
      };

      const catcher = (e: unknown) => {
        cleanup();
        reject(e);
      };

      // Helper function to parse and attach event
      const attachEvent = (eventString: string, handler: (e: unknown) => void) => {
        const dotIndex = eventString.indexOf(".");

        if (dotIndex > 0) {
          // Property event format: "property.event"
          const propertyName = eventString.substring(0, dotIndex);
          const eventName = eventString.substring(dotIndex + 1);

          // Check if property exists and is an EventEmitter
          const property = (this as Record<string, unknown>)[propertyName];
          if (property && property instanceof EventEmitter) {
            property.once(eventName, handler);
            eventMappings.push({ source: property, event: eventName, handler });
            return;
          }
        }

        // Fall back to using the full string as event name on current object
        this.once(eventString, handler);
        eventMappings.push({ source: this, event: eventString, handler });
      };

      // Attach main event
      attachEvent(event, resolver);

      // Attach error events
      for (const errorEvent of errorEvents) {
        attachEvent(errorEvent, catcher);
      }
    });
  }
}
