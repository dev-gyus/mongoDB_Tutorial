const addSum = (a, b) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(typeof a !== 'number' || typeof b !== 'number') reject('a,b must be numbers');
            resolve(a+b);
        }, 3000);
    });
}

// callback hell을 탈출하기위한 promise사용방법
// addSum(10, 20)
//     .then((sum) => addSum(sum, 1))
//     .then((sum) => addSum(sum, 1))
//     .then((sum) => addSum(sum, 1))
//     .then((sum) => console.log({sum}))
//     .catch((error) => console.log({error}));

// async, await으로 promise를 대체하는 방법
const totalSum = async() => {
    try{
        let sum = await addSum(10, 10);
        let sum2 = await addSum(20, 30);
        console.log({sum, sum2});
    }catch(err){
        if(err) console.log({err});
    }
}

totalSum();