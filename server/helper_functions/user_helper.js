const { mongoose } = require('mongoose');
const { ObjectID } = require('mongodb');
const { User } = require('../models/user');
const { Profile } = require('../models/profile');
const { friendsHelper } = require('./friend_helper');


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

module.exports = {
    updateUser
};

