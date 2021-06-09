const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    name: {
        first:{type: String, required: true},
        last: {type: String, required: true}
    },
    age: Number,
    email: String
}, {timestamps: true}); // timestamps option주면 생성, 수정시간 자동으로 넣어줌

const User = mongoose.model('user', UserSchema);

module.exports = { User };