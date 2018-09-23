const express = require('express');
const { mongoose } = require('mongoose');
const { ObjectID } = require('mongodb');
const bodyParser = require('body-parser');
const { User } = require('./models/user');
const { Profile } = require('./models/profile');


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

let updateUser = (id, updatedFields) => {
    return new Promise((resolve, reject) => {
        User.findById(id).then((user) => {
            user.set(updatedFields);
            user.save().then((updatedUser) => {
                resolve ({ updatedUser, updated: true });
            }, (err) => {
                resolve ({ err, updated: false });
            })
        }, (err) => {
            resolve ({ err, updated: false });
        })
    });
};

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


let getUserAndFriend = (userId, friendId) => {
    return User.find({
        '_id': {
            '$in': [ObjectID(userId), ObjectID(friendId)]
        }
    }).then((users) => {
        if (users.length === 2) {
            let usersObj = {};
            users.forEach((user) => {
                if (user._id.equals(userId)) {
                    usersObj.user = user;
                }
                else {
                    usersObj.friendUser = user;
                }
            })
            //console.log(users);
            return usersObj;
        }
    });

};


let acceptFriend = (user, friendUser) => {
    let currentUserFriends = user.friends;
    let currentFriendFriends = friendUser.friends;
    currentUserFriends.map((friend) => {
        if (friendUser._id.equals(friend.id)) {
            if (friend.requestStatus === 'pending' && friend.canApprove) {
                friend.requestStatus = 'approved';
                return friend;
            }
            else {
                if (friend.canApprove) throw Error(user, friend, 'user doesnt have permission to approve friend!');
                else throw Error(user, friend, 'request status isnt pending!');
            }
        }
    });
    currentFriendFriends.map((friend) => {
        if (user._id.equals(friend.id)) {
            friend.requestStatus = 'approved';
            return friend;
        }
    });
    updateUser(String(user._id),{friends: currentUserFriends}).then((resObj)=>{
        updateUser(String(friendUser._id),{friends: currentFriendFriends});
    });


};

//accept friend
app.post('/users/:id/friends/accept/:friendId', (req, res) => {
    let id = req.params.id;
    let friendId = req.params.friendId;
    getUserAndFriend(id, friendId).then((usersObj) => {
        let { user, friendUser } = usersObj;
        acceptFriend(user, friendUser);

    });
    //     User.findById(id).then((user) => {
    //         User.findById(friendId).then((friendUser) => {

    //         })
    //         let userFriends = user.friends;
    //         userFriends.forEach((friend) => {
    //             if (friend.id === friendId) {
    //                 if (friend.requestStatus === 'pending' && friend.canApprove) {
    //                     User.findById(friendId).then((friendUser) => {
    //                         addFriend(user, friendUser);
    //                     });
    //                 }
    //             }
    //         });
    //     });
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

