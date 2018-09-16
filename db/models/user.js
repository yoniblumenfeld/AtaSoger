const {mongoose} = require('../db/mongoose');

let User = mongoose.model('User',{
    email: {
        type: String,
        trim: true,
        minlength: 8,
        required: true
    },
    firstName: {
        type: String,
        trim: true,
        minlength: 2,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        minlength: 2,
        required: true
    },
    personId: {
        type: String,
        trim: true,
        minlength: 8,
        required: true
    },
    friends: {
        type: Array,
        default: []
    },
    profile: {
        type: Object,
        default: {}
    }
    
});

module.exports = {User};