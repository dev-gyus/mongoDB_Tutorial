const { Router } = require('express');
const commentRouter = Router({mergeParams: true}); // mergeParams = Server.js에서 라우터 mapping할때 선언한 경로변수 사용할 수 있도록 해줌
const { Blog, User, Comment } = require('../models');
// const { Blog } = require('../models/Blog');
// const { User } = require('../models/User');

// startSession = Transaction 사용하기위한 변수
const { isValidObjectId, startSession } = require('mongoose');

commentRouter.post('/', async (req, res) => {
    // transaction 적용
    const session = await startSession();
    let comment;

    try{
        // transaction 적용
        // await session.withTransaction(async () => {
            const { blogId } = req.params;
            const { content, userId } = req.body;
            if(!isValidObjectId(blogId)) return res.status(400).send({err: 'blogId is invalid'});
            if(!isValidObjectId(userId)) return res.status(400).send({err: 'userId is invalid'});
            if(typeof content !== 'string') return res.status(400).send({err: 'content is reqired'});
    
            // 비동기 방식 <- 성능 극대화
            const [blog, user] = await Promise.all([
                // Blog.findById(blogId, {}, { session }),
                // Transaction 적용하는방법, findById()는 3번째 인자가 option이므로 3번째 인자에 session을 넣음
                // find에도 transaction을 걸어야 동시성 문제 안생김
                Blog.findById(blogId, {}, {}),
                User.findById(userId, {}, {})
            ]);
            // 동기 방식
            // const blog = await Blog.findById(blogId);
            // const user = await User.findById(userId);
            if(!blog || !user) return res.status(400).send({err: 'blog or user does not exist'});
            if(!blog.islive) return res.status(400).send({err: 'blog is not available'});
    
            // blog에 그냥 blog를 넣어주면 comment<->blog 서로 같은걸 참조하기 때문에 무한루프 발생함 => blogId넣을것
            comment = new Comment({ 
                content, 
                user, 
                userFullName: `${user.name.first} ${user.name.last}`, 
                blog: blogId 
            });

            // Transaction Rollback하는 기능 -> Exception Check시 사용
            // await session.abortTransaction();

            // 위의 return status(400)은 db 반영 자체는 됨. 다만 find기도하고 critical한 로직이 아니라 rollback안함
            // transaction을 너무 많은곳에서 사용하면 api자체의 성능이 떨어지기때문에 꼭 필요한 부분에서만 transaction사용할것

            // comment와 blog업데이트는 동시에 발생해도 괜찮으므로 비동기 방식으로 처리해도 괜찮음
            // 다만 이럴경우 DB 부하가 좀 늘어나긴 함
            // MongoDB의 사용 주 원칙 = 쓸때 좀 부하를 받거나 작업이 많아져도 조회할때 성능을 빠르게하자
            // await Promise.all([
            //     comment.save(), 
            //     Blog.updateOne({ _id: blogId }, { $push:{ comments: comment }})
            // ]);
            

            // blog.commentCount++;
            // blog.comments.push(comment);
    
            // // shift() 배열에서 가장 오래된 항목 Pop하는 기능 (해당 값 리턴 && 배열에서 제거)
            // if (blog.commentCount > 3) blog.comments.shift();
    
            // await Promise.all( 
            // [   
            //     comment.save({session}), 
            //     blog.save()
            // ]);

            // blog를 업데이트 할때 blog에 내장된 Collection 내 문서의 가장 최신의 push data 3개를 제외한 나머지를 지워서 업데이트 할 것 ($slice: 3 으로 하면 오래된거 3개로 바뀜)
            // $push:{comments: {$each: [comment]}} = $push:{comments: comment} 랑 똑같은 개념. 내장 Collection에 Document push해주는 기능
            await Promise.all([ 
                comment.save(), 
                // 하나의 document내의 모든 기능은 atomicity함. 즉, 하나의 Document안에서는 내장된 collection까지 atomicity를 보장함
                // 즉, Transaction을 남발하기보단, 하나의 document내에 nesting을 하는 방법으로 구현하는것이 필요하다
                Blog.updateOne(
                {_id: blogId}, 
                { $inc: {commentCount: 1},
                $push:{ comments: {$each: [comment], $slice: -3}}
            })]);
    
            return res.send(comment);
        // });

    } catch(err){
        console.log(err);
        return res.send(400).send({err: err.message});
    } finally {
        // transaction 성공했든 실패했든 session은 종료해야함
        await session.endSession();
    }
});
commentRouter.get('/', async (req, res) => {
    try{
        // 만약에 queryString에 page 파라미터가 없는경우 0을 디폴트값으로 설정해줌
        let { page = 0 } = req.query;
        page = parseInt(page);
        const { blogId } = req.params;
        if(!isValidObjectId(blogId)) return res.status(400).send({err: 'blogId is invalid'});

        // comment 조회시 paging
        const comments = await Comment.find({ blog: blogId })
        .skip(page * 3)
        .limit(3)
        .sort({ createdAt: -1 });
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