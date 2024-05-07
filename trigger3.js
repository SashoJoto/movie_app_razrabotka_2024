const azure = require('azure-storage');

module.exports = async function (context, myTimer) {
    if (myTimer.isPastDue) {
        context.log('Timer function is running late!');
    }

    context.log('Calculating average ratings.');

    const connectionString = process.env.AzureWebJobsStorage;

    const tableService = azure.createTableService(connectionString);

    tableService.queryEntities('movies', null, null, function(error, result, response) {
        if (!error) {
            result.entries.forEach(movieEntity => {
                const movieId = movieEntity.RowKey._;
                const movieTitle = movieEntity.Title._;

                const query = new azure.TableQuery()
                    .where('PartitionKey eq ?', movieId);

                tableService.queryEntities('ratings', query, null, function(error, result, response) {
                    if (!error) {
                        let totalRating = 0;
                        let totalRatingsCount = 0;

                        result.entries.forEach(ratingEntity => {
                            totalRating += parseInt(ratingEntity.Rating._);
                            totalRatingsCount++;
                        });

                        const averageRating = totalRatingsCount === 0 ? 0 : totalRating / totalRatingsCount;

                        const updatedMovieEntity = {
                            PartitionKey: { _: movieId },
                            RowKey: { _: movieId },
                            AverageRating: { _: averageRating.toString() }
                        };

                        tableService.replaceEntity('movies', updatedMovieEntity, function (error, result, response) {
                            if (!error) {
                                context.log(`Average rating calculated and updated for movie '${movieTitle}'.`);
                            } else {
                                context.log(`Error updating average rating for movie '${movieTitle}': ${error}`);
                            }
                        });
                    } else {
                        context.log(`Error querying ratings for movie '${movieTitle}': ${error}`);
                    }
                });
            });
        } else {
            context.log(`Error querying movies: ${error}`);
        }
    });
};
