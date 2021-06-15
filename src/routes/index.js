// router 리팩토링
module.exports = {
    ...require('./blogRoute'),
    ...require('./commentRoute'),
    ...require('./userRoute')
}