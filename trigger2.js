const azure = require('azure-storage');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
    context.log('Adding a movie rating.');

    const rating = req.body;

    if (!rating || !rating.title || !rating.opinion || !rating.rating || !rating.author) {
        context.res = {
            status: 400,
            body: "Please provide all required rating details."
        };
        return;
    }

    const ratingId = uuidv4();

    const ratingEntity = {
        PartitionKey: { _: ratingId },
        RowKey: { _: ratingId },
        Title: { _: rating.title },
        Opinion: { _: rating.opinion },
        Rating: { _: rating.rating.toString() },
        Date: { _: (new Date()).toISOString() },
        Author: { _: rating.author }
    };

    const connectionString = process.env.AzureWebJobsStorage;

    const tableService = azure.createTableService(connectionString);

    tableService.insertEntity('ratings', ratingEntity, function (error, result, response) {
        if (!error) {
            context.res = {
                status: 200,
                body: "Rating added successfully."
            };
            context.done();
        } else {
            context.res = {
                status: 500,
                body: "Error adding rating to the database."
            };
            context.done();
        }
    });
};
