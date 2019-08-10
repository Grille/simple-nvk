export class InitializedArray {
  constructor(ctor, count) {
    return [...Array(count)].map(() => new ctor());
  }
};


export function pushHandle(handles,handle) {
  let id = handles.length;
  for (let i = 0;i<handles.length;i++){
    if (handles[i]===null){
      id = i;
      break;
    }
  }
  handle.id = id;
  handles[id] = handle;
}
export function deleteHandle(handles,handle) {
  handles[handle.id] = null;
  handle.id = -1;
  /*handles.sort((a, b)=>{
    return b.id - a.id
  });*/
}
