import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

export class LocalD1 {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    for (const name of [
      '0001_initial.sql', '0002_merchant_auth.sql', '0003_webhook_deliveries.sql',
      '0004_privacy_requests.sql',
      '0005_privacy_contact.sql',
      '0006_privacy_resolution.sql',
    ]) {
      this.sqlite.exec(readFileSync(new URL(`../../migrations/${name}`, import.meta.url), 'utf8'));
    }
  }
  prepare(sql) {
    const sqlite = this.sqlite;
    return {bind(...values) {
      return {
        first: async () => sqlite.prepare(sql).get(...values) ?? null,
        run: async () => sqlite.prepare(sql).run(...values),
        sql,
        values,
      };
    }};
  }
  async batch(statements) {
    this.sqlite.exec('BEGIN');
    try {
      const results = statements.map(({sql, values}) => this.sqlite.prepare(sql).run(...values));
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
  rows(sql, ...values) { return this.sqlite.prepare(sql).all(...values); }
  run(sql, ...values) { this.sqlite.prepare(sql).run(...values); }
  close() { this.sqlite.close(); }
}
