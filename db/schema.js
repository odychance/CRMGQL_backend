const { gql } = require('apollo-server')

//Schema
const typeDefs = gql`
    type User {
        id: ID
        name: String
        surname: String
        email: String
        created: String
    }

    type Token {
        token: String
    }

    type Product {
        id: ID
        name: String
        existence: Int
        price: Float
        created: String
    }

    type Client {
        id: ID
        name: String
        surname: String
        company: String
        email: String
        telephone: String
        seller: ID
    }

    type Order {
        id: ID
        order: [OrderGroup]
        total: Float
        client: Client
        seller: ID
        date: String
        state: StateOrder
    }

    type OrderGroup {
        id: ID
        amount: Int
        name: String
        price: Float
    }

    type TopClient {
        total: Float
        client: [Client]
    }

    type TopSeller {
        total: Float
        seller: [User]
    }

    input UserInput {
        name: String!
        surname: String!
        email: String!
        password: String!
    }

    input AuthenticateInput {
        email: String!
        password: String!
    }

    input ProductInput {
        name: String!
        existence: Int!
        price: Float!
    }

    input ClientInput {
        name: String!
        surname: String!
        company: String!
        email: String!
        telephone: String!
    }
    
    input OrderInput {
        order: [OrderProductInput]
        total: Float
        client: ID
        state: StateOrder
    }
    
        input OrderProductInput {
            id: ID
            amount: Int
            name: String
            price: Float
        }

    enum StateOrder {
        PENDIENTE
        COMPLETADO
        CANCELADO
    }

    type Query {
        #Usuarios
        getUser : User
    
        #Productos
        getProducts : [Product]
        getProduct(id: ID!) : Product

        #Clientes
        getClients: [Client]
        getClientsSeller : [Client]
        getClient(id: ID!) : Client

        #Pedidos
        getOrders: [Order]
        getOrdersSeller: [Order]
        getOrder(id: ID!) : Order
        getOrdersState(state : String!) : [Order]

        #Busquedas avanzadas
        betterClients : [TopClient]
        betterSellers : [TopSeller]
        searchProduct(text: String!) : [Product]
    }

    type Mutation {
        # Users
        newUser(input: UserInput) :  User
        authenticateUser(input: AuthenticateInput) : Token
    
        #Products
        newProduct(input: ProductInput) : Product
        updateProduct(id: ID!, input: ProductInput) : Product
        deleteProduct(id: ID!) : String

        #Clients
        newClient(input: ClientInput) : Client
        updateClient(id: ID!, input: ClientInput) : Client
        deleteClient(id: ID!) : String
    
        #Pedidos
        newOrder(input: OrderInput) : Order
        updateOrder(id: ID!, input: OrderInput) : Order
        deleteOrder(id: ID!) : String
    }
`;

module.exports = typeDefs;