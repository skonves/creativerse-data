const sut = [[1], [2, 3, 4], [5, 6], [7, 8, 9]]
const result = sut.reduce((a, b) => a.concat(b))

console.log(sut)
console.log(result)