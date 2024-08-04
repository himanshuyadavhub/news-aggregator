const amqp = require('amqplib');

exports.setupQueue = async (queueName) => {
    let connection;
    let channel;
    try {
        connection = await amqp.connect('amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: false });
        return { connection, channel };
    } catch (error) {
        console.error('Failed to connect to RabbitMQ or create a channel:', error);
        throw error;
    }
};