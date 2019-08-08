export class InitializedArray {
  constructor(ctor, count) {
    return [...Array(count)].map(() => new ctor());
  }
};

export function pushHandle(handles,handle) {

}
export function deleteHandle(handles,handle) {
  
}
