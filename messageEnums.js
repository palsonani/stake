function messageEnums() {

    const loginEnum = (username, userid) => {
        return `username == ${username}`
    }

    const singUpEnum = (username, userid) => {
        return `userId == ${userid}`
    }

    return {
        loginEnum, singUpEnum
    }
}