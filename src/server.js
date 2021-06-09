// npm 모듈쓰는방법 dependency의 key값을 갖고 불러옴
const express = require('express');
const { request } = require('http');
const app = express();
const mongoose = require('mongoose');
const {User} = require('./models/User');

const MONGO_URI = 'mongodb+srv://admin:vmffkd495@mongodbtutorial.zvkjv.mongodb.net/BlogService?retryWrites=true&w=majority';

const server = async() => {
    try{
        await mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology:true, useCreateIndex:true});
        console.log('MongoDB connected');
        // express middleware 이용해서 json data parsing해서 req, res에 넣어줌
    app.use(express.json())
    
    
    app.get('/user', async function(req, res) {
        try{
        const users = await User.find({});
        return res.send({users});
        }catch(err){
            console.log(err);
            return res.status(500).send({err : err.message});
        }
    });
    
    // async , await 쓸때는 반드시 try,catch쓸것
    app.post('/user', async function(req, res){
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
    })
    
    // node server가 사용할 포트 설정
    app.listen(3000, function(){
        console.log('server listening on port 3000');
    });

    }catch(err){
        console.log(err);
    }
}

server();