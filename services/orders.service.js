// services/orders.service.js
"use strict";

const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");

module.exports = {
	name: "orders",
	mixins: [DbService],
	adapter: new MongoAdapter("mongodb://mongo/orders"),
	collection: "orders",

	settings: {
		fields: ["_id", "username", "email", "items", "total", "status", "createdAt"],

		entityValidator: {
			username: { type: "string", min: 3 },
			email: { type: "email" },
			items: {
				type: "array", items: {
					type: "object", props: {
						name: { type: "string" },
						quantity: { type: "number", min: 1 },
						price: { type: "number", min: 0 }
					}
				}
			},
			total: { type: "number", min: 0 },
			status: { type: "string", enum: ["Pending", "Processed", "Shipped", "Delivered"], default: "Pending" },
			createdAt: { type: "date", default: () => new Date() }
		}
	},

	actions: {
		createOrder: {
			rest: "POST /",
			params: {
				username: { type: "string", min: 3 },
				email: { type: "email" },
				items: {
					type: "array", items: {
						type: "object", props: {
							name: { type: "string" },
							quantity: { type: "number", min: 1 },
							price: { type: "number", min: 0 }
						}
					}
				},
				total: { type: "number", min: 0 }
			},
			async handler(ctx) {
				const order = await this.adapter.insert({
					username: ctx.params.username,
					email: ctx.params.email,
					items: ctx.params.items,
					total: ctx.params.total,
					status: "Pending",
					createdAt: new Date()
				});
				return order;
			}
		}
	},

	methods: {
		async seedDB() {
			await this.adapter.insertMany([
				{
					username: "john_doe",
					email: "john@example.com",
					items: [
						{ name: "Product 1", quantity: 2, price: 10 },
						{ name: "Product 2", quantity: 1, price: 20 }
					],
					total: 40,
					status: "Pending",
					createdAt: new Date()
				}
			]);
		}
	},

	async afterConnected() {
		// Seed the database
		if (process.env.SEED_DB === "true") {
			this.logger.info("Seeding Database...");
			await this.seedDB();
		}
	}
};

// Запуск сервера для тестирования
if (require.main === module) {
	const broker = new ServiceBroker({ nodeID: "orders-service", transporter: "NATS" });
	broker.createService(module.exports);
	broker.start();
}
