const express = require('express');
const { mongoose } = require('mongoose');
const { ObjectID } = require('mongodb');
const bodyParser = require('body-parser');
const { User } = require('./models/user');
const { Profile } = require('./models/profile');
const { getUserAndFriend, acceptFriend} = require('./helper_functions/friend_helper');
const { updateUser } = require('./helper_functions/user_helper');

let app = express();
const port = process.argv[2] || 3000;

app.use(bodyParser.json());

//Get users
app.get('/users', (req, res) => {
    User.find().then((users) => {
        res.send({ users });
    });
})

//Get user
app.get('/users/:id', (req, res) => {
    let id = req.params.id;
    User.findById(id).then((user) => {
        res.send({ user });
    });
});


//Users add
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

//users Update
app.post('/users/update/:id', (req, res) => {
    let id = req.params.id;
    let updatedFields = req.body;
    updateUser(id, updatedFields).then((resObj) => {
        res.send(resObj);
    });
});

//Users delete
app.post('/users/delete/:id', (req, res) => {
    let id = req.params.id;
    User.findByIdAndRemove(id).then((deletedUser) => {
        res.send({ deletedUser, deleted: true });
    }, (err) => {
        res.send({ err, deleted: false })
    })
});


//show friends
app.get('/users/:id/friends', (req, res) => {
    let id = req.params.id;
    User.findById(id).then((user) => {
        res.send({ id, friends: user.friends });
    })
})

//accept friend
app.post('/users/:id/friends/accept/:friendId', (req, res) => {
    let id = req.params.id;
    let friendId = req.params.friendId;
    getUserAndFriend(id, friendId).then((usersObj) => {
        let { user, friendUser } = usersObj;
        acceptFriend(user, friendUser);
    });
});


//Add Friend
app.post('/users/:id/friends/add/:friendId', (req, res) => {
    let id = req.params.id;
    let friendId = req.params.friendId;
    
    User.findById(id).then((user) => {
        let currentFriends = user.friends;
        currentFriends.forEach((friend) => {
            if (friend.friendId === friendId) {
                res.send({ user, added: false, errorMsg: 'friend already exists!' });
            }
        });
        User.findById(friendId).then((friendUser) => {
            currentFriends.push({ id: friendId, requestStatus: 'pending', canApprove: false })
            user.set({ friends: currentFriends });
            let friendFriends = friendUser.friends;
            friendFriends.push({ id, requestStatus: 'pending', canApprove: true })
            friendUser.set({ friends: friendFriends });
            user.save().then((user) => {
                friendUser.save().then((friendUser) => {
                    res.send({ friendUser, user, added: true });
                })

            });
        }).catch((err) => {
            res.send({ err, added: false });
        })
    })
})


app.listen(port, () => {
    console.log('Starting app on port', port);
});

