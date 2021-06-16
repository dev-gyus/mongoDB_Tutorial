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
            Blog.findByIdAndUpdate(blogId),
            User.findByIdAndUpdate(userId)
        ]);
        // 동기 방식
        // const blog = await Blog.findByIdAndUpdate(blogId);
        // const user = await User.findByIdAndUpdate(userId);
        if(!blog || !user) return res.status(400).send({err: 'blog or user does not exist'});
        if(!blog.islive) return res.status(400).send({err: 'blog is not available'});

        const comment = new Comment({ content, user, blog });
        comment.save();
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

module.exports = { commentRouter };