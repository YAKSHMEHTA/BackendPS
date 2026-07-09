import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const users = [
    { id: "1", name: "Yaksh", age: 20,price:40 },
    { id: "2", name: "Alex", age: 25 ,price:50},
    { id: "3", name: "John", age: 30 ,price:10}
];

const typeDefs = `#graphql
    type User {
        id: ID!
        name: String!
        age: Int!
        price:Int
    }

    type Query{
        user(id:ID!):User,
        users: [User!]!
    }

    input CreateUserInput{
        name: String!
        age: Int!
        price:Int
    }

    type Mutation{
        createUser(input:CreateUserInput!):User!
    }
`;

const resolvers = {
    Query: {
        user: (_,args,context) => {
            console.log(context);
            return users.find(user => user.id === args.id);
        },
        users: () =>  users
    },
    Mutation:{
        createUser:(_,args) => {
            const newUser = {
                id:String(users.length+1),
                ...args.input
            }
            users.push(newUser);
            return newUser;
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers
})

const {url} = await startStandaloneServer(server,{
    listen:{port:8080},
    context: async({req}) => {
        return {
            username:"yaksh",
            role:"admin"
        }
    }
})

console.log(`Server running at ${url}`);
