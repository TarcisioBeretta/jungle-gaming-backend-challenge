export interface UnitOfWork {
  commit(): Promise<void>;
}