const {Schema, model, Types } = require('mongoose');

const BlogSchema = new Schema({
    title: { type: String, required: true},
    content: { type: String, required: true},
    islive: { type: Boolean, required: true, default: false},
    user: { type: Types.ObjectId, required: true, ref: 'user'}
}, { timestamps: true});

// 자식관계의 모델에서 부모의 id를 갖고있는 경우 virtual Populate를 선언해줘야됨
// 가상의 comment Field를 선언하는 것
BlogSchema.virtual('comments', {
    ref: 'comment',
    localField: '_id',
    foreignField: 'blog',
});

BlogSchema.set('toObject', {virtuals: true});
BlogSchema.set('toJSON', {virtuals: true});

const Blog = model('blog', BlogSchema);

module.exports = { Blog };