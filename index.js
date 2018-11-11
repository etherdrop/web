express = require('express');
path = require('path');

// set up http server
const PORT = process.env.PORT || 5000;
const server = express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('index'))
    .listen(PORT, () => console.log(`HTTP Listening on ${ PORT }`));


console.log('Running XDNS...');
