const { mongoose } = require('mongoose');
const { ObjectID } = require('mongodb');
const { User } = require('../models/user');
const { Profile } = require('../models/profile');
const userHelper = require('./user_helper');


//need to add error control
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
    return new Promise((resolve, reject) => {
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
        userHelper.updateUser(String(user._id), { friends: currentUserFriends }).then((userResObj) => {
            userHelper.updateUser(String(friendUser._id), { friends: currentFriendFriends }).then((friendResObj) => {
                resolve({ user: userResObj.updatedUser, friendUser: friendResObj.updatedUser, accepted: true })
            });
        }).catch((err) => {
            resolve({ err, accepted: false });
        });
    })
};


let isFriendExist = (user, friendId) => {
    user.friends.forEach((friend) => {
        if (friend.friendId === friendId) return true;
    });
    return false;
};

let getFriendRequestObject = (id, isReciever) => {
    return isReciever ? { id, requestStatus: 'pending', canApprove: true } : { id, requestStatus: 'pending', canApprove: false }
};


let addFriend = (userId, friendId) => {
    return new Promise((resolve, reject) => {
        getUserAndFriend(userId, friendId).then((usersObj) => {
            let { user, friendUser } = usersObj;
            if (isFriendExist(user, friendId)) return { user, added: false, errorMsg: 'friend already exists!' };
            let [userCurrentFriends, friendCurrentFriends] = [user.friends, friendUser.friends];
            userCurrentFriends.push(getFriendRequestObject(friendId, undefined));
            friendCurrentFriends.push(getFriendRequestObject(userId, true));
            userHelper.updateUserObject(user, userCurrentFriends).then((userResult) => {
                userHelper.updateUserObject(friendUser, friendCurrentFriends).then((friendResult) => {
                    resolve({ user: userResult.updatedUser, friendUser: friendResult.updatedUser, added: true });
                });
            }).catch((errObj) => {
                resolve({ err: errObj.err, added: false });
            });
        });
    })

};


module.exports = {
    acceptFriend,
    getUserAndFriend,
    isFriendExist,
    addFriend,
    getFriendRequestObject
};