/* eslint-disable node/no-unsupported-features/es-syntax */
const { hash, compare } = require("bcrypt");
const { sign } = require("jsonwebtoken");
const { APP_SECRET, getUserId } = require("../utils");
const ErrorCodes = require("../errors");

const Mutation = {
    signup: async (parent, { name, username, password, role }, context) => {
        const hashedPassword = await hash(password, 10);
        const user = await context.prisma.createUser({
            name,
            username,
            password: hashedPassword,
            role
        });
        let expiresIn = "30m";
        return {
            token: sign({ userId: user.id }, APP_SECRET, {expiresIn}),
            user,
        };
    },
    createUser: async (...rest) => {
        return await Mutation.signup(...rest);
    },
    login: async (parent, { username, password }, context) => {
        const user = await context.prisma.user({ username });
        if (!user) {
            throw new Error(ErrorCodes.NO_USER_FOUND +" for user:" + username);
        }
        const passwordValid = await compare(password, user.password);
        if (!passwordValid) {
            throw new Error(ErrorCodes.INVALID_PASSWORD);
        }
        let expiresIn = "30m";
        return {
            token: sign({ userId: user.id }, APP_SECRET, {expiresIn}),
            user,
        };
    },
    deleteUser: async (parent, { username,id }, context) => {
        let toDeleteBy = username ? {username:username} : {id:id};
        console.log(toDeleteBy)
        if(toDeleteBy.username!= undefined || toDeleteBy.id!=undefined)
            return context.prisma.deleteUser( toDeleteBy ); 
        throw new Error(ErrorCodes.NO_ID_OR_USERNAME);
    },
    // createDraft: async (parent, { title, content }, context) => {
    //     const userId = getUserId(context);
    //     return context.prisma.createPost({
    //         title,
    //         content,
    //         author: { connect: { id: userId } },
    //     });
    // },
    // deletePost: async (parent, { id }, context) => {
    //     return context.prisma.deletePost({ id });
    // },
    // publish: async (parent, { id }, context) => {
    //     return context.prisma.updatePost({
    //         where: { id },
    //         data: { published: true },
    //     });
    // },
};

module.exports = {
    Mutation,
};
