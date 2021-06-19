// router는 express가 제공해주는 라우터 사용함
const { Router } = require('express');
const userRouter = Router();
const {User, Blog, Comment} = require('../models');
const mongoose = require('mongoose');

userRouter.get('/', async function(req, res) {
    try{
    const users = await User.find({});
    return res.send({users});
    }catch(err){
        console.log(err);
        return res.status(500).send({err : err.message});
    }
});

// async , await 쓸때는 반드시 try,catch쓸것
userRouter.post('/', async function(req, res){
    try{
        let { username, name } = req.body; // let username = req.body.username / let name = req.body.name 이랑 같음
        if(!username) return res.status(400).send({err : "username is required"});
        if(!name || !name.first || !name.last) return res.status(400).send({err : "Both first and last names are required"});
    const user = new User(req.body);
    await user.save();
    return res.send({user});

    }catch(err){
        console.log(err);
        return res.status(500).send({err : err.message}); // http status 반환
    }
});

userRouter.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try{
        if(!mongoose.isValidObjectId(userId)) return res.status(400).send({err: 'invalid userId'});
        const user = await User.findOne({_id: userId});
        return res.send({user});
    }catch(err){
        console.log(err);
        return res.status(500).send({err:err.message});
    }
});

userRouter.delete('/:userId', async (req, res) => {
    const {userId} = req.params;
    try{
        if(!mongoose.isValidObjectId(userId)) return res.status(400).send({err : 'invalid userId'});
        const [user] = await Promise.all([
            User.findOneAndDelete({_id : userId}),
            Blog.deleteMany({'user._id': userId}),
            Blog.updateMany(
                {'comments.user':userId}, 
                {$pull: {comments: {user: userId}}}
            ),
            Comment.deleteMany({user: userId})
        ]);
        return res.send({user});
    }catch(err){
        return res.send({err : err.message});
    }
});

userRouter.put('/:userId', async (req, res) => {
    const {userId} = req.params;
    try{
        if(!mongoose.isValidObjectId(userId)) return res.status(400).send({err : 'invalid userId'});

        const { age, name } = req.body;
        if(!age && !name) return res.status(400).send({err: 'age or name is required'});
        // if(!age) return res.status(400).send({err: 'age is required'});
        if(age && typeof age !== 'number') return res.status(400).send({err: 'age must be a number'});
        if(name && typeof name.first !== 'string' && typeof name.last !== 'string') return res.status(400).send({err: 'first and last name are strings'});

        // findByIdAndUpdate 사용해서 수정하는 방법

        // 둘 중에 하나의 값만 들어와서 업데이트 할 경우 다른 하나의 값은 null로 저장이 되기 때문에 이를 막기 위해 object형태로 몽구스 쿼리문 인자로 넣어야함
        // let updateBody = {};
        // if(age) updateBody.age = age;
        // if(name) updateBody.name = name;

        // const user = await User.findByIdAndUpdate(userId, updateBody, {new : true}); // update할때는 option에 new : true를 줘야 업데이트 반영된 document가 리턴됨, 안주면 반영전 도큐먼트 리턴

        // find 후 save로 저장하는방법, 몽구스가 마치 JPA의 더티체킹해주듯이 변경사항만 체크해서 업데이트 쿼리로 저장해줌
        // {new: true}옵션 안해줘도 됨, 쿼리가 2번나간다는 단점이 있지만 2번정도는 눈감아줄만 하다.
        let user = await User.findById(userId);
        if(age) user.age = age;

        // User의 name정보를 바꿀때 연관된 Blog, Comment에도 변경된 User의 name을 저장해준다
        if(name) {
            user.name = name;
            await Blog.updateMany({'user._id': userId}, {'user.name': name});
            // Document내에 Array가 있는데 그 Array에 Filter에 해당하는 것만 선택해서 변경 할 경우의 문법
            // 'comments.$[element].userFullName.$[user].name.first' 이런경우
            // arrayFilters:[{'element.user._id': userId}, {'user~~':~~~}] 이런식으로 배열로 filter조건 주면 됨
            await Blog.updateMany(
                {}, 
                { 'comments.$[comment].userFullName': `${name.first} ${name.last}`},
                { arrayFilters:[{'comment.user': userId}]}
        );
    }

        await user.save();
        return res.send({user});
    } catch(err){
        return res.send({err: err.message});
    }
})

module.exports = {
    userRouter
}