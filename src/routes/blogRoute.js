const { Router } = require('express');
const blogRouter = Router(); // 라우터 선언
const { Blog } = require('../models/Blog'); // Model가져옴
const { User } = require('../models/User'); 
const { isValidObjectId } = require('mongoose');
const { commentRouter } = require('./commentRoute');
blogRouter.use('/:blogId/comment', commentRouter);

blogRouter.post('/', async (req, res) => {
    try{
        const {title, content, islive, userId} = req.body;
        if(typeof title !== 'string') return res.status(400).send({err: 'title is required'});
        if(typeof content !== 'string') return res.status(400).send({err: 'content is required'});
        if(islive && islive !== 'string') return res.status(400).send({err: 'islive must is boolean'});
        if(!isValidObjectId(userId)) return res.status(400).send({err: 'title is required'});

        let user = await User.findById(userId);
        if(!user) res.status(400).send({err: 'user does not exist'});

        let blog = new Blog({...req.body, user });
        await blog.save();
        return res.send(blog);

    } catch(err){
        console.log(err);
        res.status(500).send({err: err.message});
    }
});

blogRouter.get('/', async (req, res) => {
    try{
        const blogs = await Blog.find({});
        return res.send(blogs);
    } catch(err){
        console.log(err);
        res.status(500).send({err: err.message});
    }
});

blogRouter.get('/:blogId', async (req, res) => {
    try{
        const { blogId } = req.params;
        if (!isValidObjectId(blogId)) return res.status(400).send({err: 'blogId is invalid'});

        const blog = await Blog.findById({_id: blogId});
        return res.send(blog);
    } catch(err){
        console.log(err);
        res.status(500).send({err: err.message});
    }
});

// 엔티티 전체수정
blogRouter.put('/:blogId', async (req, res) => {
    try{
        const { blogId } = req.params;
        const { title, content } = req.body;
        if(typeof title !== 'string') res.status(400).send({err: 'title is required'});
        if(typeof content !== 'string') res.status(400).send({err: 'content is required'});

        const blog = await Blog.findOneAndUpdate({_id: blogId}, { title, content }, {new: true});
        res.send({blog});
    } catch(err){
        console.log(err);
        res.status(500).send({err: err.message});
    }
});

// 엔티티 일부수정
blogRouter.patch('/:blogId/live', async (req, res) => {
    try{
        const { blogId } = req.params;
        if(!isValidObjectId(blogId)) return res.status(400).send({err: 'blogId is invalid'});

        const { islive } = req.body;
        if(typeof islive !== 'boolean') return res.status(400).send({err: 'boolean islive is required'});

        const blog = await Blog.findByIdAndUpdate(blogId, { islive }, {new: true});
        return res.send({ blog });
    } catch(err){
        console.log(err);
        res.status(500).send({err: err.message});
    }
});

module.exports = { blogRouter };