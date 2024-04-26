import axios from "axios";
import readline from "readline";
import stream from "stream";

export async function fetchLatestDataFromStation(stationId = 46225) {
    try {
        const url = `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`;
        const response = await axios.get(url);
        const data = response.data;
        let latestData = {}

        const reader = readline.createInterface({
            input: stream.Readable.from(data)
        });

        let foundData = false;

        return new Promise((resolve, reject) => {
            reader.on('line', (line) => {
                if (!line.startsWith('#') && !foundData) {  // Skip comments and dont look for more data if already found
                    const entries = line.split(/\s+/);
                    latestData = {
                        stationId: stationId,
                        year: entries[0],
                        month: entries[1],
                        day: entries[2],
                        hour: entries[3],
                        minute: entries[4],
                        waveHeight: entries[8],
                        wavePeriod: entries[9],
                        waveDirection: entries[11],
                        waterTemp: entries[14]
                    };
                    foundData = true;
                }
            });

            reader.on('close', () => {
                resolve(latestData);
            });

            reader.on('error', (err) => {
                reject(err);
            });
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchLatestDataFromAllStations(stations) {
    let results = [];
    for (const {id: stationId} of stations) {
        try {
            let d = await fetchLatestDataFromStation(stationId);
            results.push(d);
        } catch (error) {
            console.error(`Failed to fetch data from station ${stationId}`);
        }
    }
    console.log('Fetched data from all stations at', new Date());
    return results;
}

