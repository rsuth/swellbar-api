// read each line of stationlist.txt and fetch data from each station
import fs from 'fs';
import readline from 'readline';
import { fetchLatestDataFromStation } from './dataFetching.js';

async function getGoodStations() {
    const fileStream = fs.createReadStream('stationlist.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const goodStations = [];
    const badStations = [];

    for await (const line of rl) {
        try {
            const data = await fetchLatestDataFromStation(line);

            const today = new Date();
            const dataDate = new Date(data.year, data.month - 1, data.day); // month is 0-indexed

            if (dataDate.getDate() === today.getDate() &&
                dataDate.getMonth() === today.getMonth() &&
                dataDate.getFullYear() === today.getFullYear() &&
                Object.values(data).every(value => value !== undefined)) {
                console.error(`Got data for station ${line}`);
                goodStations.push(line);
            }
        } catch (error) {
            console.error(`Failed to fetch data for station ${line}`);
            badStations.push(line);
        }
    }

    return {
        goodStations,
        badStations
    };
}

const stations = JSON.parse(fs.readFileSync('data/stations.json', 'utf8'))
console.log(stations);


async function findBadStations(stations) {
    let badStations = [];
    let alldata = [];   

    const promises = stations.map(async station => {
        console.log(`fetching data for station ${station.id}`)
        try {
            const s = await fetchLatestDataFromStation(station.id);
            if(s.waveHeight == 'MM'){
                badStations.push(station.id);
            }
            alldata.push(s);
        } catch (error) {
            console.error(`Failed to fetch data for station ${station.id}`);
        }
    });

    await Promise.all(promises);

    return {badStations, alldata};
}

const d = await findBadStations(stations);

// cache the station data
fs.writeFileSync('data/stationData.json', JSON.stringify(d.alldata, null, 2));

// print the stations that dont seem to have height data
console.log(`found ${d.badStations.length}/${stations.length} bad stations:\n${d.badStations.join('\n')}`);

// filter out the bad stations from station list
const goodStations = stations.filter(s => !d.badStations.includes(s.id));
fs.writeFileSync('data/goodStations.json', JSON.stringify(goodStations, null, 2));
