const User = require('../models/User')
const Product = require('../models/Product')
const Client = require('../models/Client')
const Order = require('../models/Order')

const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: 'variables.env' })


const CreateToken = (user, secret, expiresIn) => {
    // console.log(user)
    const {id, email, name, surname} = user
    return jwt.sign({ id, email, name, surname }, secret, { expiresIn})
}

//Resolvers
const resolvers = {
    Query: {
        getUser: async (_, {}, ctx) => {
            return ctx.user
        },
        getProducts: async () => {
            try {
                const products = await Product.find({})
                return products
            } catch (error) {
                console.log(error)
            }
        },
        getProduct: async (_, { id }) => {

            //Revisar que el producto existe
            const product = await Product.findById(id)

            if(!product) {
                throw new Error('Producto no encontrado')
            }

            return product

        },
        getClients: async () => {
            try {
                const clients = await Client.find({})
                return clients
            } catch (error) {
                console.log(error)
            }
        },
        getClientsSeller: async (_, {}, ctx) => {
            try {
                const clients = await Client.find({ seller: ctx.user.id.toString() })
                return clients
            } catch (error) {
                console.log(error)
            }

        },
        getClient: async (_, { id }, ctx) => {

            //Revisar si existe el cliente
            const client = await Client.findById(id)

            if(!client) {
                throw new Error('Cliente no encontrado')
            }

            //Revisar si tiene los permisos
            if(client.seller.toString() !== ctx.user.id) {
                throw new Error('No posees los permisos necesarios')
            }

            return client
        },
        getOrders: async () => {
            try {
                const orders = await Order.find({})
                return orders
            } catch (error) {
                console.log(error)
            }
        },
        getOrdersSeller: async (_, {}, ctx) => {
            try {
                const orders = await Order.find({ seller: ctx.user.id }).populate('client')

                console.log(orders)
                return orders
            } catch (error) {
                console.log(error)
            }
        },
        getOrder: async (_, {id}, ctx) => {
            //Verificar si existe el pedido
            const order = await Order.findById(id)
            if(!order) {
                throw new Error('Pedido no encontrado')
            }

            //Verificar que sea quien lo creo
            if(order.seller.toString() !== ctx.user.id) {
                throw new Error('No posees los permisos necesarios')
            }

            //Retornar un resultado
            return order
        },
        getOrdersState: async (_, {state}, ctx) => {
            const orders = await Order.find({ seller : ctx.user.id , state })
            return orders
        },
        betterClients: async () => {
            const clients = await Order.aggregate([
                { $match : { state: "COMPLETADO"} },
                { $group : {
                    _id: "$client",
                    total: { $sum: '$total' }
                }},
                {
                    $lookup: {
                        from: 'clients',
                        localField: '_id',
                        foreignField: "_id",
                        as: 'client'
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort : { total : -1 }
                }
            ])
            return clients
        },
        betterSellers: async () => {
            const sellers = await Order.aggregate([
                { $match: { state : "COMPLETADO" }},
                { $group: {
                    _id : "$seller",
                    total : { $sum : '$total' }
                }},
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: "_id",
                        as: 'seller'
                    }
                },
                {
                    $limit : 3
                },
                {
                    $sort : { total : -1 }
                }
            ])
            return sellers
        },
        searchProduct: async (_, { text }) => {
            const products = await Product.find({ $text: {$search: text } }).limit(10)
            return products
        }
    },
    Mutation: {
        newUser: async (_, {input}, ) => {

            const {email, password} = input

            //Revisar si el usuario esta registrado previamente
            const isUser = await User.findOne({email})
            if (isUser) {
                throw new Error('El usuario ya esta registrado')
            }

            //Hashear el password
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt)
            
            try {
                //Guardar en la DB
                const user = new User(input)
                user.save(); //Guardar en la db
                return user
            } catch (error) {
                console.log(error)
            }

        },
        authenticateUser: async (_, {input}) => {

            const {email, password} = input
            
            //Si el usuario existe
            const isUser = await User.findOne({email})
            
            if (!isUser) {
                throw new Error('El usuario no existe')
            }

            //revisar si el password es correcto
            const correctPassword = await bcryptjs.compare(password, isUser.password)
            if(!correctPassword) {
                throw new Error('El password es incorrecto')
            }

            //crear el token
            return {
                token: CreateToken(isUser, process.env.SECRET, '999h')
            }

        },
        newProduct: async (_, {input}) => {
            try {
                const product = new Product(input)

                //almacenar
                const result = await product.save()
                return result
            } catch (error) {
                console.log(error)
            }
        },
        updateProduct: async (_, {id, input}) => {
            //Revisar que el producto existe
            let product = await Product.findById(id)

            if(!product) {
                throw new Error('Producto no encontrado')
            }

            //Guardar en la DB
            product = await Product.findOneAndUpdate({ _id : id }, input, { new: true });
            return product
        },
        deleteProduct: async (_, {id}) => {
            //Revisar que el producto existe
            let product = await Product.findById(id)

            if(!product) {
                throw new Error('Producto no encontrado')
            }

            //Eliminar el producto
            await Product.findOneAndDelete({_id : id})
            return "Producto Eliminado"
        },
        newClient: async (_, {input}, ctx) => {

            console.log(ctx)

            const { email } = input

            //Revisar si el cliente esta regisrado
            console.log(input)
            const client = await Client.findOne({email})

            if(client) {
                throw new Error('El cliente ya esta registrado')
            }

            const newClient = new Client(input)

            //asignar vendedor
            newClient.seller = ctx.user.id

            //Guardar en la DB
            try {
                const result = await newClient.save()
                return result
            } catch (error) {
                console.log(error)
            }

        },
        updateClient: async (_, {id, input}, ctx) => {
            //verifocar si existe el cliente
            let client = await Client.findById(id)

            if(!client) {
                throw new Error('Cliente no encontrado')
            }

            //Verificar al vendedor
            if(client.seller.toString() !== ctx.user.id) {
                throw new Error('No posees los permisos necesarios')
            }

            //Guardar cambios
            client = await Client.findOneAndUpdate({_id : id}, input, {new: true})
            return client

        },
        deleteClient: async (_, {id}, ctx) => {
            //verifocar si existe el cliente
            let client = await Client.findById(id)

            if(!client) {
                throw new Error('Cliente no encontrado')
            }

            //Verificar al vendedor
            if(client.seller.toString() !== ctx.user.id) {
                throw new Error('No posees los permisos necesarios')
            }

            //Eliminar Cliente
            await Client.findOneAndDelete({_id : id})
            return "Cliente Eliminado"

        },
        newOrder: async (_, {input}, ctx) => {

            const { client } = input

            //Verificar si el cliente existe
            let isClient = await Client.findById(client)
            
            if(!isClient) {
                throw new Error('Cliente no encontrado')
            }

            //Verificar de que vendedor es cada cliente
            if(isClient.seller.toString() !== ctx.user.id) {
                throw new Error('No posees los permisos necesarios')
            }

            //Revisar que el stock este disponible------------------------------------------

            for await (const article of input.order) {
                const { id } = article;

                const product = await Product.findById(id);

                if(article.amount > product.existence) {
                    throw new Error(`El articulo: ${product.name} excede la cantidad disponible`)
                } else {
                    //Restar cantidad de stock
                    product.existence = product.existence - article.amount
                    await product.save()
                }
            }

            //Crear nuevo pedido
            const newOrder = new Order(input)

            //Asignarle un vendedor
            newOrder.seller = ctx.user.id

            //Guardar en la DB
            const result = await newOrder.save()
            return result
        },
        updateOrder: async (_, {id, input}, ctx) => {

            const { client } = input
            //Verificar si el pedido existe
            const isOrder = await Order.findById(id)
            if(!isOrder) {
                throw new Error('El pedido no existe')
            }

            //Verificar si existe el cliente
            const isClient = await Client.findById(client)
            if(!isClient) {
                throw new Error('El cliente no existe')
            }

            //Si el cliente y el pedido pertenecen al vendedor
            if(isClient.seller.toString() !== ctx.user.id) {
                throw new Error('No posees los permisos necesarios')
            }

            //Revisar stock suficiente
            if(input.order) {
                for await (const article of input.order) {
                    const { id } = article;
    
                    const product = await Product.findById(id);
    
                    if(article.amount > product.existence) {
                        throw new Error(`El articulo: ${product.name} excede la cantidad disponible`)
                    } else {
                        //Restar cantidad de stock
                        product.existence = product.existence - article.amount
                        await product.save()
                    }
                }
            }

            //Guardar el pedido
            const result = await Order.findOneAndUpdate({_id : id}, input, {new : true})
            return result
        },
        deleteOrder: async (_, {id}, ctx) => {
            //Verificar si existe el pedido
            const order = await Order.findById(id)
            if(!order) {
                throw new Error('Pedido no encontrado')
            }

            //Verificar si tiene los permisos
            if(order.seller.toString() !== ctx.user.id) {
                throw new Error('no posees los permisos necesarios')
            }

            //Eliminar de la DB
            await Order.findOneAndDelete({_id : id})
            return 'Pedido Eliminado'
        }
    }
}

module.exports = resolvers;