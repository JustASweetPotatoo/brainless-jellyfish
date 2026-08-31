export abstract class BaseModel<TJSON> {
  abstract toJSON(): TJSON;

  static fromJSON<T, J>(this: new (json: J) => T, json: J): T {
    return new this(json);
  }

  static fromJSONArray<T, J>(this: new (json: J) => T, rows: J[]): T[] {
    return rows.map((r) => new this(r));
  }
}
