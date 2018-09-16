const {mongoose} = require('../db/mongoose');

let Profile = mongoose.model('Profile',{
    personId: {
        type: String,
        default: '000000000',
        required: true
    },
    lastUpdate: {
        type: Date,
        default: Date.now()
    },
    isHome: {
        type: Boolean,
        default: false
    }
});

module.exports = {Profile};