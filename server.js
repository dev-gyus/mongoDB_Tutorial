// npm 모듈쓰는방법 dependency의 key값을 갖고 불러옴
const express = require('express');
const { request } = require('http');
const app = express();

app.use(express.json())

const users = [];

app.get('/user', function(req, res) {
    


    return res.send(users);
});

app.post('/user', function(req, res){
    users.push({name: req.body.name, age: req.body.age});
    return res.send({success: true});
})

// node server가 사용할 포트 설정
app.listen(3000, function(){
    console.log('server listening on port 3000');
})