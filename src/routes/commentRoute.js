const { Router } = require('express');
const commentRouter = Router({mergeParams: true}); // mergeParams = Server.js에서 라우터 mapping할때 선언한 경로변수 사용할 수 있도록 해줌
const { Blog, User, Comment } = require('../models');
// const { Blog } = require('../models/Blog');
// const { User } = require('../models/User');
const { isValidObjectId } = require('mongoose');

commentRouter.post('/', async (req, res) => {
    try{
        const { blogId } = req.params;
        const { content, userId } = req.body;
        if(!isValidObjectId(blogId)) return res.status(400).send({err: 'blogId is invalid'});
        if(!isValidObjectId(userId)) return res.status(400).send({err: 'userId is invalid'});
        if(typeof content !== 'string') return res.status(400).send({err: 'content is reqired'});

        // 비동기 방식 <- 성능 극대화
        const [blog, user] = await Promise.all([
            Blog.findById(blogId),
            User.findById(userId)
        ]);
        // 동기 방식
        // const blog = await Blog.findById(blogId);
        // const user = await User.findById(userId);
        if(!blog || !user) return res.status(400).send({err: 'blog or user does not exist'});
        if(!blog.islive) return res.status(400).send({err: 'blog is not available'});

        const comment = new Comment({ content, user, userFullName: `${user.name.first} ${user.name.last}`, blog });
        // comment와 blog업데이트는 동시에 발생해도 괜찮으므로 비동기 방식으로 처리해도 괜찮음
        // 다만 이럴경우 DB 부하가 좀 늘어나긴 함
        // MongoDB의 사용 주 원칙 = 쓸때 좀 부하를 받거나 작업이 많아져도 조회할때 성능을 빠르게하자
        await Promise.all([
            comment.save(), 
            Blog.updateOne({ _id: blogId }, { $push:{ comments: comment }})
        ]);
        return res.send(comment);

    } catch(err){
        console.log(err);
        return res.send(400).send({err: err.message});
    }
});
commentRouter.get('/', async (req, res) => {
    try{
        const { blogId } = req.params;
        if(!isValidObjectId(blogId)) return res.status(400).send({err: 'blogId is invalid'});
        const comments = await Comment.find({ blog: blogId });
        return res.send({comments});
    } catch(err){
        console.log(err);
    }
})

commentRouter.patch('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if(typeof content !== 'string')
        return res.status(400).send({err: 'content is required'});
    
    // 원랜 $set:{content: content}로 해줘야하지만 mongoose가 알아서 세팅해줌
    // new: true = 업데이트 한 최신의 엔티티 결과를 가져옴
    const comment = await Comment.findOneAndUpdate({_id : commentId}, {content}, {new: true} );

    // mongoDB에서 사용하는 문법. Blog model내의 comments 필드에 저장된 _id값을 지정함
    // 'comments.$.???' = comments 필드에서 'comments._id'값을 가진 필드를 선택하는것
    // 즉, comments.$.content = comments._id값을 갖는 필드의 content값을 선택하는 몽고 db 문법
    await Blog.updateOne({'comments._id': commentId}, {'comments.$.content': content});

    return res.send({ comment });
})

commentRouter.delete('/:commentId', async (req, res) => {
    const {commentId} = req.params;
    const comment = await Comment.findOneAndDelete({_id : commentId});
    // filter조건에서 ,로 넘겨주는 값은 모두 or조건임. and조건 하고싶으면 $elemMatch:{}로 값 넘겨줘야됨
    await Blog.updateOne({"comments._id" : commentId}, {$pull: {comments: {_id: commentId}}});

    return res.send({ comment });
})
module.exports = { commentRouter };