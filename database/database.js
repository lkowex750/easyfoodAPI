const {createPool} = require('mysql')
let passServer = "Ase%31d2"
let passLocalhost = "1234"

let databaseServer = "comsci_easyfood"
let databaseLocalhost = "easyfood"
const pool = createPool({
    host : "localhost",
    user : "easyfood",
    password : passLocalhost,
    //Ase%31d2
    database : databaseLocalhost,
    //comsci_easyfood
    connectionLimit : 10
})

module.exports = pool