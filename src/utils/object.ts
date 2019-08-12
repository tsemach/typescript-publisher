
function getPropertyName<T, K extends keyof T>(o: T, name: K): T[K] {
    return o[name]; // o[name] is of type T[K]
}

function getProperies<T, K extends keyof T>(from: T, names: K[]) {
  let output = {}

  names.forEach(k => {    
    output[k.toString()] = from[k]    
  })

  return output;
}

export default {getPropertyName, getProperies}