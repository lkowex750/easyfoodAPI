const {createPool} = require('mysql')

const pool = createPool({
    host : "localhost",
    user : "easyfood",
    password : "Ase%31d2",
    //Ase%31d2
    database : "comsci_easyfood",
    //comsci_easyfood
    connectionLimit : 10
})

module.exports = pool