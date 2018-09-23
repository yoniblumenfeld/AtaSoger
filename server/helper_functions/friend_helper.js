const { mongoose } = require('mongoose');
const { ObjectID } = require('mongodb');
const { User } = require('../models/user');
const { Profile } = require('../models/profile');
const { userHelper } = require('./user_helper');

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

module.exports = {
    acceptFriend,
    getUserAndFriend
};