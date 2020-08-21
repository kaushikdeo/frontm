// code-review - create two repos if there are two assignments
async function addOrder(client, userEmail, nameOfListing, reservationDates, reservationDetails) {
   // code-review - take all the above inputs in one object. Its more scalable and will not change the function defination
    const usersCollection = client.db("sample_airbnb").collection("users");
    const listingsAndReviewsCollection = client.db("sample_airbnb").collection("listingsAndReviews");
 // code-review - why the addOrder function will have the createReservationDocument function
    const reservation = createReservationDocument(nameOfListing, reservationDates, reservationDetails);
 // code-review - Session creation and transaction code will be part of helper function which can be reused by other functions
    const session = client.startSession();

    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };
 
    try {
     // code-review - helper here too, addOrder should only contain its business logic
        const transactionResults = await session.withTransaction(async () => {
 
            const usersUpdateResults = await usersCollection.updateOne(
                { email: userEmail },
                { $addToSet: { reservations: reservation } },
                { session });
         // code-review - have a logger helper which does the logging Logger.info(...) and that info function will do console.log
            console.log(`${usersUpdateResults.matchedCount} document(s) found in the users collection with the email address ${userEmail}.`);
            console.log(`${usersUpdateResults.modifiedCount} document(s) was/were updated to include the reservation.`);
 
 
            const isListingReservedResults = await listingsAndReviewsCollection.findOne(
                { name: nameOfListing, datesReserved: { $in: reservationDates } },
                { session });
            if (isListingReservedResults) {
                await session.abortTransaction();
                console.error("This listing is already reserved for at least one of the given dates. The reservation could not be created.");
                console.error("Any operations that already occurred as part of this transaction will be rolled back.");
             // code-review - throw error here and abort transaction in catch
                return;
            }
 
            const listingsAndReviewsUpdateResults = await listingsAndReviewsCollection.updateOne(
                { name: nameOfListing },
                { $addToSet: { datesReserved: { $each: reservationDates } } },
                { session });
            console.log(`${listingsAndReviewsUpdateResults.matchedCount} document(s) found in the listingsAndReviews collection with the name ${nameOfListing}.`);
            console.log(`${listingsAndReviewsUpdateResults.modifiedCount} document(s) was/were updated to include the reservation dates.`);
 
        }, transactionOptions);
 
        if (transactionResults) {
            console.log("The reservation was successfully created.");
        } else {
            console.log("The transaction was intentionally aborted.");
        }
    } catch(e){
     // code-review - throw error here 
        console.log("The transaction was aborted due to an unexpected error: " + e);
    } finally {
        await session.endSession();
    }
 
}
