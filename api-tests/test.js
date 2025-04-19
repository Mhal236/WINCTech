const axios = require("axios"); console.log("Testing axios"); axios.get("https://jsonplaceholder.typicode.com/todos/1").then(res => console.log(res.data)).catch(err => console.error(err));
