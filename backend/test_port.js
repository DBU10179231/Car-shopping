const express = require('express');
const app = express();
app.listen(5002, () => {
    console.log('Test success!');
    process.exit(0);
});
