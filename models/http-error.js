class HttpError extends Error {
    constructor(message, content, errorCode){
        super(message);
        this.content = content;
        this.code = errorCode;
    }
};

module.exports = HttpError;