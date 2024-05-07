const azure = require('azure-storage');

module.exports = async function (context, req) {
    context.log('Searching for a movie.');

    const searchString = req.query.search;

    const connectionString = process.env.AzureWebJobsStorage;

    const tableService = azure.createTableService(connectionString);

    tableService.queryEntities('movies', null, null, function(error, result, response) {
        if (!error) {
            const movies = [];

            result.entries.forEach(movieEntity => {
                const movie = {
                    id: movieEntity.RowKey._,
                    title: movieEntity.Title._,
                    year: parseInt(movieEntity.Year._),
                    genre: movieEntity.Genre._,
                    description: movieEntity.Description._,
                    director: movieEntity.Director._,
                    actors: movieEntity.Actors._,
                    averageRating: parseFloat(movieEntity.AverageRating._),
                    ratings: []
                };

                const query = new azure.TableQuery()
                    .where('PartitionKey eq ?', movie.id);

                tableService.queryEntities('ratings', query, null, function(error, result, response) {
                    if (!error) {
                        result.entries.forEach(ratingEntity => {
                            const rating = {
                                opinion: ratingEntity.Opinion._,
                                rating: parseInt(ratingEntity.Rating._),
                                date: new Date(ratingEntity.Date._).toISOString(),
                                author: ratingEntity.Author._
                            };
                            movie.ratings.push(rating);
                        });

                        movies.push(movie);
                    } else {
                        context.log(`Error querying ratings for movie '${movie.title}': ${error}`);
                    }
                });
            });

            Promise.all(movies.map(movie => movie.ratings))
                .then(() => {
                    const filteredMovies = searchString ?
                        movies.filter(movie => movie.title.toLowerCase().includes(searchString.toLowerCase())) :
                        movies;

                    context.res = {
                        status: 200,
                        body: filteredMovies
                    };
                    context.done();
                });
        } else {
            context.res = {
                status: 500,
                body: "Error querying movies from the database."
            };
            context.done();
        }
    });
};
