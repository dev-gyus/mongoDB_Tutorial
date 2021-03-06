// npm 모듈쓰는방법 dependency의 key값을 갖고 불러옴
const express = require('express');
const { request } = require('http');
const app = express();
const mongoose = require('mongoose');
const { userRouter, blogRouter } = require('./routes');
// const { blogRouter } = require('./routes/blogRoute');
const { commentRouter } = require('./routes/commentRoute');

const { generateFakeData } = require('../faker2');

const MONGO_URI = 'mongodb+srv://admin:vmffkd495@mongodbtutorial.zvkjv.mongodb.net/BlogService?retryWrites=true&w=majority';

const server = async() => {
    try{
        await mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology:true, useCreateIndex:true, useFindAndModify:false});
        // mongoose.set('debug', true); // mongoose query debug모드
        console.log('MongoDB connected');
        // express middleware 이용해서 json data parsing해서 req, res에 넣어줌
    app.use(express.json());

    // 라우터 설정
    app.use('/user', userRouter);
    app.use('/blog', blogRouter);
    app.use('/blog/:blogId/comment', blogRouter);
    
    // node server가 사용할 포트 설정
    app.listen(3000, async () => {
        console.log('server listening on port 3000');
        // dummy data 생성
        // await generateFakeData(10, 2, 10);

    });

    }catch(err){
        console.log(err);
    }
}

server();