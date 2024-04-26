import express from "express";
import cors from "cors";
import {fetchLatestDataFromAllStations} from "./dataFetching.js";
import fs from 'fs';
const app = express();
app.use(cors());

const PORT = 3636;

let latestData = [];

const SWELL_STATIONS = JSON.parse(fs.readFileSync('./data/stations.json', 'utf8'));

try {
    latestData = await fetchLatestDataFromAllStations(SWELL_STATIONS);
} catch (error) {
    console.error('An error occurred:', error);
}

setInterval(async () => {
    try {
        latestData = await fetchLatestDataFromAllStations(SWELL_STATIONS);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}, 60000 * 10);

app.get("/swelldata/:stationId", (req, res) => {
    let d = latestData.find(d => d.stationId === req.params.stationId);
    if (d) {
        console.log(`Sending data for station ${req.params.stationId}`)
        res.json(d);
    } else {
        res.status(404).send("Station not found");
    }
});

app.get("/stationlist", (req, res) => {
    res.json(SWELL_STATIONS);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});