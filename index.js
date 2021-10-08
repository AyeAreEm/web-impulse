// dependencies
const express = require('express');
const datastore = require('nedb');
const bcrypt = require('bcrypt');
const showdown = require('showdown');

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

let converter = new showdown.Converter()
converter.setFlavor('github');

// routes
app.get('/', (req, res) => {
    blogData.find({}, (err, docs) => {
        let convertedDocs = betterDocs(docs);

        res.render('index', {
            blogs: convertedDocs,
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
                    let data = { username, password: result, bio: "" };
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
        let convertedDocs;
        let userDetails;

        blogData.find({author: req.params.id}, (err, docs) => {
            convertedDocs = betterDocs(docs);

            accData.find({username: req.params.id}, (err, docs) => {

                docs.forEach(doc => {
                    let username = doc.username;
                    let bio = doc.bio;
                    userDetails = {username, bio};

                    res.render('profile', {
                        blogs: convertedDocs,
                        user: userDetails
                    });
                });
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

app.get('/account/settings', (req, res) => {
    res.render('settings');
});

app.post('/account/settings', (req, res) => {
    try {
        accData.update({username : req.body.oldUsername}, {$set: {username: req.body.username, bio: req.body.bio}}, {}, () => {
            res.sendStatus(200);
        });
    } catch {
        res.sendStatus(500);
    }
});

app.get('/account/passwords', (req, res) => {
    res.render('editPass');
});

app.post('/account/passwords', (req, res) => {
    try {
        accData.find({}, (err, docs) => {
            let found = docs.find(elem => {
                return elem.username == req.body.username && bcrypt.compareSync(req.body.oldPass, elem.password);
            });

            if (found) {
                hash(req.body.password).then(result => {
                    accData.update({username: req.body.username}, {$set: {password: result}}, {}, () => {
                        res.sendStatus(200);
                    });
                });
            } else if (found == undefined) {
                res.sendStatus(409);
            }
        });
    } catch {
        res.sendStatus(500);
    }
});

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
            let convertedDocs = betterDocs(docs);

            res.render('fullPost', {
                blogs: convertedDocs
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

function betterDocs(docs) {
    let convertedDocs = [];
    docs.forEach(doc => {
        let htmlTxt = converter.makeHtml(doc.content);
        let author = doc.author;
        let title = doc.title;
        let date = doc.today;
        let id = doc._id;
        convertedDocs.push({author, title, content: htmlTxt, id, date});
    });

    return convertedDocs;
}

const port = process.env.PORT || 5000;
app.listen(port);