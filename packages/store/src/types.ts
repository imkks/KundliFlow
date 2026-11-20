export interface SqliteDb {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

export interface SqliteStatement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}
