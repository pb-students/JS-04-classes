const ENERGY_COST = 0.21

class Product {
    #intl = new Intl.RelativeTimeFormat('pl')

    constructor (id, name, model, releaseDate, price, consumption) {
        for (const [key, value] of Object.entries({ id, name, model, releaseDate, price, consumption })) {
            this[key] = value
        }

        this.releaseDate = new Date(this.releaseDate)
    }

    cost () {
        return this.price
    }

    energyCost () {
        return ENERGY_COST * this.consumption
    }

    age () {
        return new Date().getFullYear() - this.releaseDate.getFullYear()
    }

    ageAsYears () {
        return this.#intl.format(this.age(), 'year').slice(3)
    }
}

class ProductList {
    #products = {}

    printProduct (id) {
        console.log(this.#products[id])
    }

    printAllProducts () {
        for (const id in this.#products) {
            this.printProduct(id)
        }
    }

    addProduct (product) {
        if (product.id in this.#products) {
            throw new Error(`Product ${product.id} is already on a list`)
        }

        this.#products[product.id] = product
    }

    updateProduct (id, productLike) {
        if (!(id in this.#products)) {
            throw new Error(`Product ${id} is not on a list`)
        }

        for (const [key, value] of Object.entries(productLike)) {
            if (!(value instanceof Function)) {
                this.#products[id][key] = value
            }
        }
    }

    getProduct (id) {
        if (!(id in this.#products)) {
            throw new Error(`Product ${id} is not on a list`)
        }

        return this.#products[id]
    }
}

class Warehouse extends ProductList {
    #quantityMap = {}

    addProduct (product, quantity = 1) {
        try {
            super.addProduct(product)
        } catch (e) {}

        this.#quantityMap[product.id] ??= 0
        this.#quantityMap[product.id] += quantity

    }

    takeProduct (id) {
        const product = this.getProduct(id)

        if (this.#quantityMap[id] === 0) {
            throw new Error(`Product ${id} is out of stock`)
        }

        this.#quantityMap[id] -= 1

        // NOTE: Return a shallow copy of product
        return { ...product }
    }

    getQuantity (id) {
        // NOTE: Check if product exists
        this.getProduct(id)

        return this.#quantityMap[id]
    }
}

class Shop extends ProductList {
    addProduct (...args) {
        if (args.length === 4) {
            return this.addProduct(`${Math.random()}-${+new Date}`.slice(2), ...args)
        }

        if (args.length === 5) {
            const [id, name, model, price, consumption] = args
            const product = new Product(id, name, model, new Date(), price, consumption)
            super.addProduct(product)

            // NOTE: Return shallow copy of product
            return { ...product }
        }

        if (args.length === 1) {
            return super.addProduct(args[0])
        }

        throw new Error(`Illegal number of arguments.`)
    }
}

class Order {
    #shop = null
    #warehouse = null
    #quantityMap = {}

    constructor (shop, warehouse) {
        this.#shop = shop
        this.#warehouse = warehouse
    }
    
    addProduct (id) {
        try {
            this.#shop.getProduct(id)
        } catch (e) {
            throw new Error(`Product ${id} is not available in this shop`)
        }

        try {
            this.#warehouse.getProduct(id)
        } catch (e) {
            throw new Error(`Product ${id} is not available in this warehouse`)
        }

        this.#quantityMap[id] ??= 0
        if (this.#warehouse.getQuantity(id) < this.#quantityMap[id] + 1) {
            throw new Error(`Order quantity exceeds warehouse stock`)
        }

        this.#quantityMap[id] += 1
    }

    commit () {
        for (const [id, quantity] of Object.entries(this.#quantityMap)) {
            for (let i = 0; i < quantity; ++i) {
                this.#warehouse.takeProduct(id)
            }
        }
    }
}

const shop = new Shop()
const warehouse = new Warehouse()

const { id: a } = shop.addProduct('Product', 'A', 8, 16)
const { id: b } = shop.addProduct('test-id', 'Product', 'B', 8, 16)

const c = 'product-c'
const productC = new Product(c, 'Prod', 'C', '1993-01-01', 9, 10)
shop.addProduct(productC)
warehouse.addProduct(productC, 3)

const order = new Order(shop, warehouse)
order.addProduct(c)
order.addProduct(c)
order.commit()

try {
    order.commit()
    console.log('order did not fail')
} catch (e) {
    console.log('order failed successfully')
}

