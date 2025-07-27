// Wraps async functions to handle errors cleanly

const asyncHandler = (requestHandler) => {
    return (req, res, next) => { // return is necessary because its a higher-order function(function that takes a function), else nothing is passed back to Express, and you’ll get an error 
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export { asyncHandler }

// 🔑 Why return is important with Promises:
// Returning a Promise allows other code (like await, .then(), or Express) to:

// Wait for the result

// Handle errors properly

// Not returning means the Promise still runs, but:

// The caller can’t access the result

// Errors may be ignored or uncaught

// 🧠 In Express Middleware (e.g. asyncHandler):
// You must return the function and the Promise inside it, so Express can:

// Recognize it as middleware

// Handle any async errors via next(err)


// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (err) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }