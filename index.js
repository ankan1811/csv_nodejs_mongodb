const express = require('express');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const dotEnv = require("dotenv");
dotEnv.config();

const app = express();
const PORT = 3000;

// MongoDB connection setup
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');

    const cardStatusSchema = new mongoose.Schema({
        cardID: { type: String, unique: true, required: true },
        ID: { type: String, required: true },
        userMobile: { type: String, required: true },
        timestamp: { type: Date, required: true },
    });

    const CardStatus = mongoose.model('CardStatus', cardStatusSchema);

    // Read and insert data from pickup.csv
   // ... (other imports and setup code)

// Read and insert data from pickup.csv
fs.createReadStream('./data/Sample Card Status Info - Pickup.csv')
.pipe(csv())
.on('data', async (row) => {
    try {
        // Manually parse the timestamp string in the "DD-MM-YYYY hh:mm AM/PM" format
        const timestampParts = row['Timestamp'].split(' ');
        const dateParts = timestampParts[0].split('-');
        const timeParts = timestampParts[1].split(':');
        let hours = parseInt(timeParts[0]);
        if (timestampParts[2] === 'PM' && hours !== 12) {
            hours += 12;
        } else if (timestampParts[2] === 'AM' && hours === 12) {
            hours = 0;
        }
        const timestamp = new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[0]),
            hours,
            parseInt(timeParts[1])
        );

        if (!isNaN(timestamp.getTime())) {
            const pickupData = new CardStatus({
                cardID: row['Card ID'],
                ID: row['ID'],
                userMobile: row['User Mobile'],
                timestamp: timestamp
            });
            const savedData = await pickupData.save();
            console.log('Pickup data saved:', savedData);
        } else {
            console.error('Invalid date format:', row['Timestamp']);
            // Handle invalid date format as needed
        }
    } catch (err) {
        console.error('Error saving pickup data:', err);
    }
})
.on('end', () => {
    console.log('Finished processing pickup.csv');
    // Repeat this process for other CSV files
});

});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
