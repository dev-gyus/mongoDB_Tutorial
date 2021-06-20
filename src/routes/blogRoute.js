const { Router } = require('express');
const blogRouter = Router(); // 라우터 선언
const { Blog, User } = require('../models'); // Model가져옴
// const { User } = require('../models/User'); 
const { isValidObjectId } = require('mongoose'); // Id값이 유효한지 검사하기 위해 mongoose내장 함수 사용
const { commentRouter } = require('./commentRoute');
blogRouter.use('/:blogId/comment', commentRouter);

blogRouter.post('/', async (req, res) => {
    try{
        const {title, content, islive, userId} = req.body;
        if(typeof title !== 'string') return res.status(400).send({err: 'title is required'});
        if(typeof content !== 'string') return res.status(400).send({err: 'content is required'});
        if(islive && typeof islive !== 'boolean') return res.status(400).send({err: 'islive must is boolean'});
        if(!isValidObjectId(userId)) return res.status(400).send({err: 'title is required'});

        let user = await User.findById(userId);
        if(!user) return res.status(400).send({err: 'user does not exist'});

        let blog = new Blog({...req.body, user });
        await blog.save();
        return res.send({blog});

    } catch(err){
        console.log(err);
        res.status(500).send({err: err.message});
    }
});

blogRouter.get('/', async (req, res) => {
    try{
        // Model에 user의 id가 ref='user'로 user객체의 id인것을 선언했으므로 그걸 갖고 채우도록 선언하는 것
        // n+1 문제 해결
        // user의 경우 Blog Model에서 user에 대한 field가 있기 때문에 그냥 populate 선언하면 되지만
        // comment는 Comment Model에 Blog에 대한 id값이 있기 때문에 virtual populate로 선언해야함
        let { page } = req.query;
        page = parseInt(page);
        // pagenation + sorting 조건 추가
        const blogs = await Blog.find({}).limit(3).skip(3 * page).sort({ updatedAt: -1, });
        // .populate([{ path: 'user' }, { path: 'comments', populate: { path : 'user' }}]);
        return res.send({blogs});
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

        // MongoDB에서 사용가능한 Count Query <- Blog model에 nesting함
        // const commentCount = await Comment.find({ blog: blogId }).countDocuments();

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