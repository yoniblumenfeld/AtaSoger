const express = require('express');
const { mongoose } = require('mongoose');
const bodyParser = require('body-parser');
const { User } = require('./models/user');
const { Profile } = require('./models/profile');


let app = express();
const port = process.argv[2] || 3000;

app.use(bodyParser.json());
app.post('/users/add', (req, res) => {
    console.log(req.body);
    let user = new User(req.body)
    User.find({ personId: req.body.personId }, (err, users) => {
        if (!users.length) {
            User.find({ email: req.body.email }, (err, users) => {
                if (!users.length) {
                    user.save().then((doc) => {
                        console.log('User saved!', doc);
                        console.log('Creating Profile....');
                        let profile = new Profile({
                            personId: doc.personId,
                        });
                        profile.save().then((profileDoc) => {
                            console.log('Profile created!', profile);
                            res.send({ doc, profile, success: true });
                        })
                        //res.send(doc);
                    })
                }
                else {
                    res.send({ errorMsg: 'Email Exists!', success: false });
                }
            });
        }
        else {
            res.send({ errorMsg: 'personId Exists!', success: false });
        }
    })

});

app.listen(port, () => {
    console.log('Starting app on port', port);
});

