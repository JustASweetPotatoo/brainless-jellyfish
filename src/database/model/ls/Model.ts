export interface ModelOptions {
  readonly createTimestamp?: Date;
}

export interface ModelJSON {
  readonly create_timestamp: Date;
}

export default abstract class Model<O extends ModelOptions, J extends ModelJSON> {
  public readonly createTimestamp: Date;

  constructor(options: O) {
    this.createTimestamp = options.createTimestamp ?? new Date();
  }

  abstract toJSON(): J;
}
