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
        user:User,
        users: [User!]!
    }
`;

const resolvers = {
    Query: {
        user: (_,args) => {
            return users.find(user => user.id === args.id);
        },
        users: () =>  users
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers
})

const {url} = await startStandaloneServer(server,{
    listen:{port:8080},
})

console.log(`Server running at ${url}`);