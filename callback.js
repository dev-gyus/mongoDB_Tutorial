const addSum = (a, b, callback) => {
    setTimeout(() => {
        if(typeof a !== 'number' || typeof b !== 'number'){
            callback('a, b must be numbers');
            return;
        }
        callback(undefined, a+b);
    }, 3000);
}

let callback = (error, sum) => {
    if(error) console.log({error});
    console.log({sum});
}

addSum(10, 20, callback);

addSum(10, 'asdf', callback);