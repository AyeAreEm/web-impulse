// dependencies
const express = require('express');
const datastore = require('nedb');
const bcrypt = require('bcrypt');

// init dependencies
const app = express();
const accData = new datastore('accounts.nedb');
accData.loadDatabase();

const blogData = new datastore('blogs.nedb');
blogData.loadDatabase();

app.use(express.json());

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static('views'));;

// routes
app.get('/', (req, res) => {
    blogData.find({}, (err, docs) => {
        res.render('index', {
            blogs: docs
        });
    });
});

// account tings
app.get('/sign-up', (req, res) => {
    res.render('signUp');
});

app.post('/sign-up', (req, res) => {
    try {
        accData.find({}, (err, docs) => {
            let found = docs.find(elem => elem.username == req.body.username);

            if (found == undefined) {
                hash(req.body.password).then(result => {
                    let username = req.body.username;
                    let data = { username, password: result };
                    accData.insert(data);
                    res.sendStatus(200);
                });
            } else if (found) {
                res.sendStatus(409);
            }
        });
    } catch {
        res.sendStatus(500);
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    try {
        accData.find({}, (err, docs) => {
            let found = docs.find(elem => {
                return elem.username == req.body.username && bcrypt.compareSync(req.body.password, elem.password)
            });

            if (found == undefined) {
                res.sendStatus(409);
            } else if (found) {
                res.sendStatus(200);
            }
        });
    } catch {
        res.sendStatus(500);
    }
});

app.get('/profile/:id', (req, res) => {
    try {
        blogData.find({author: req.params.id}, (err, docs) => {
            res.render('profile', {
                blogs: docs,
                user: req.params.id
            });
        });
    } catch {
        res.sendStatus(500);
    }
});

app.post('/profile', (req, res) => {
    // need to make a "constant" because the username and userUrl not match even tho they are the same string.
    let constant = req.body.username;

    try {
        if (req.body.username == constant && req.body.userUrl == constant) {
            res.sendStatus(200);
        } else {
            res.sendStatus(409);
        }
    } catch {
        res.sendStatus(500);
    }
});

/* 
DO NOT DO '/profile/:id/settings'
INSTEAD DO '/account/settings' (or something like that) 
AND DO MOST OF THE SETTINGS STUFF USING CLIENT SIDE THEN SEND IT TO THE SERVER SIDE
*/

// post tings
app.get('/create-post', (req, res) => {
    res.render('posting');
});

app.post('/create-post', (req, res) => {
    try {
        blogData.insert(req.body);
    } catch {
        res.sendStatus(409);
    }
});

app.get('/post/:id', (req, res) => {
    try {
        blogData.find({_id: req.params.id}, (err, docs) => {
            res.render('fullPost', {
                blogs: docs
            });
        });
    } catch {
        res.sendStatus(500);
    }
});

// hashing function
async function hash(password) {
    return await bcrypt.hash(password, 10);
}

const port = process.env.PORT || 5000;
app.listen(port);