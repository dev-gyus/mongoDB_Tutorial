const {Schema, model, Types } = require('mongoose');
const {CommentSchema} = require('./Comment');

const BlogSchema = new Schema({
    title: { type: String, required: true},
    content: { type: String, required: true},
    islive: { type: Boolean, required: true, default: false},
    user: { _id: { type: Types.ObjectId, required: true, ref: 'user'},
            username: { type: String, required: true},
            name: {
                first:{type: String, required: true},
                last: {type: String, required: true}
            },
        }, 
    // comment 내장
    comments: [CommentSchema],
    // comment Count값을 필드로 가짐
    commentCount: { type:Number, default: 0, required: true }
}, { timestamps: true });

// Schma에 딱히 key가 없는데 Index거는법 (MongoDb상에서 생성되는 필드값을 Index로 걸 경우)
BlogSchema.index({ updatedAt: 1 });

// Compound Key(복합 키)
BlogSchema.index({'user._id': 1, updatedAt: 1});

// text index 만들기 -> 컬렉션당 하나씩만 만들 수 있음
// compass에서 쓰는법 = {$text:{$search:'단어'}} <- 해당 단어가 통째로 들어가있는 경우에만 검색됨
BlogSchema.index({ title: 'text' });

// 자식관계의 모델에서 부모의 id를 갖고있는 경우 virtual Populate를 선언해줘야됨
// 가상의 comment Field를 선언하는 것
// BlogSchema.virtual('comments', {
//     ref: 'comment',
//     localField: '_id',
//     foreignField: 'blog',
// });

// BlogSchema.set('toObject', {virtuals: true});
// BlogSchema.set('toJSON', {virtuals: true});

const Blog = model('blog', BlogSchema);

module.exports = { Blog, BlogSchema };