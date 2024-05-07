const azure = require('azure-storage');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
    context.log('Adding a movie.');

    const movie = req.body;

    if (!movie || !movie.title || !movie.year || !movie.genre || !movie.description || !movie.director || !movie.actors) {
        context.res = {
            status: 400,
            body: "Please provide all required movie details."
        };
        return;
    }

    const movieId = uuidv4();

    const movieEntity = {
        PartitionKey: { _: movieId },
        RowKey: { _: movieId },
        Title: { _: movie.title },
        Year: { _: movie.year.toString() },
        Genre: { _: movie.genre },
        Description: { _: movie.description },
        Director: { _: movie.director },
        Actors: { _: movie.actors }
    };

    const connectionString = process.env.AzureWebJobsStorage;

    const tableService = azure.createTableService(connectionString);

    tableService.insertEntity('movies', movieEntity, function (error, result, response) {
        if (!error) {
            context.res = {
                status: 200,
                body: "Movie added successfully."
            };
            context.done();
        } else {
            context.res = {
                status: 500,
                body: "Error adding movie to the database."
            };
            context.done();
        }
    });
};
