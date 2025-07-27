// Sends structured error messages

class ApiError extends Error { // ApiError(custom class) inherits from builtin Error class
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message) // Need to use super method for subclasses to reassign the variables (to use this) as subclass's constructor is in temporal dead zone, built-in error class only accepts message in its constructor
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export {ApiError}