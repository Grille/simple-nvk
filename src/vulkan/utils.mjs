export class InitializedArray {
  constructor(ctor, count) {
    return [...Array(count)].map(() => new ctor());
  }
};
