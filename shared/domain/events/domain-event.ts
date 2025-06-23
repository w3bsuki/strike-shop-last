/**
 * Domain Event Abstractions
 * Base classes and interfaces for domain events
 */

export interface DomainEvent {
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: Date;
  readonly eventId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly payload: Record<string, unknown>
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}