console.log('client code running.');
const axios = require('axios');

const URI = 'http://localhost:3000';

const test = async () => {
    console.time('loading time: ');
    await axios.get(`${URI}/blog`);

    // Promise를 이용하여 async처리
//     blogs = await Promise.all(blogs.map(async (blog) => {
//     const [res1, res2] = await Promise.all([axios.get(`${URI}/user/${blog.user}`), axios.get(`${URI}/blog/${blog._id}/comment`)]);
//     blog.user = res1.data.user;
//     blog.comments = await Promise.all(res2.data.comments.map(async comment => {
//         const { data: { user }} = await axios.get(`${URI}/user/${comment.user}`) // comment 단 유저정보도 comment도 넣어줌
//         comment.user = user
//         return comment;
//     }))
//     return blog;
// }));
console.timeEnd('loading time: ');
};

// nesting을 사용하면 Read 성능이 아주빨라짐
const testGroup = async () => {
    await test();
    await test();
    await test();
    await test();
    await test();
    await test();
    await test();
}

testGroup();
