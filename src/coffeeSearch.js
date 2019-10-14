const coffeeShops = require('./CoffeeShops');
const roadAbbreviations = require('./RoadAbbreviations');
const removeStopwords = require('./StopWords');
const readline = require('readline');
require('colors');

const NAME_EXACT_MATCH = 5;
const NAME_PARTIAL_MATCH = NAME_EXACT_MATCH/2;
const NAME_SMALL_PARTIAL_MATCH = NAME_PARTIAL_MATCH - 1;

const ZIP_MATCH = 5;
const ZIP_PARTIAL_MATCH = ZIP_MATCH/2;
const CITY_MATCH = 4;
const CITY_PARTIAL_MATCH = CITY_MATCH/2;
const STATE_MATCH = 3;
const STATE_PARTIAL_MATCH = STATE_MATCH/2;
const STREET_MATCH = 1;
const STREET_PARTIAL_MATCH = STREET_MATCH/2;

const DESCRIPTION_MATCH = 2;

/* 
    The earlier words in the query are more important than the later ones
    so we will apply the following formula to the scores.
    1st query word = score*1
    2nd query word = score*0.9
    3rd query word = score*0.9^2
    ... and so on. This reduces the value of the query matches as the words go on.
*/
const DAMPING_FACTOR = 0.9;


const processQuery = (query) => {
    // shallow copy of coffee shops array of objects
    let coffeeShopsWithScores = JSON.parse(JSON.stringify(coffeeShops));
    // go through each coffee shop and calculate a score 
    coffeeShopsWithScores.forEach((coffeeShopWithScore) => {
        let score = processCoffeeShop(coffeeShopWithScore, query);
        coffeeShopWithScore.score = score;
    });
    // sort them by score, highest score first
    const rankedCoffeeShops = sortCoffeeShops(coffeeShopsWithScores);
    printResults(rankedCoffeeShops);
}

// sorts coffee shops by score descending
const sortCoffeeShops = (coffeeShopsWithScores) => {
    return coffeeShopsWithScores.sort((a,b) => b.score - a.score);
}

const printResults = (rankedCoffeeShops) => {
    console.log();
    console.log(`Search Results\n`.black);
    rankedCoffeeShops.forEach((shop, i) => {
        console.log(`Rank ${i+1}`.black);
        console.log(`Name: ${shop.name}`.green);
        console.log(`Address: ${shop.address}`.blue);
        console.log(`Description: ${shop.description}`.cyan);
        console.log(`Score: ${shop.score}`.red);
        console.log();
    })
}

// calculate score for each of the 3 attributes and sum them for total score
const processCoffeeShop = (coffeeShop, query) => {
    const nameScore = calculateNameScore(coffeeShop.name.toLowerCase(), query);
    const addressScore = calculateAddressScore(coffeeShop.address.toLowerCase(), query);
    const descriptionScore = calculateDescriptionScore(coffeeShop.description.toLowerCase(), query);

    return nameScore + addressScore + descriptionScore;
}


/*
    Name scoring algorithm:
    Exact match for word in name: 5 pts
    Partial match for word in name: 2.5 pts
*/
const calculateNameScore = (name, query) => {
    if (query.length === 0) {
        return 0;
    }
    let score = 0;
    // separate words and remove punctuation with this regex (leaves apostrophe)
    const nameWords = name.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    const queryWords = query.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    queryWords.forEach((queryWord, ind) => {
        // dont count road abbreviations in name
        if (roadAbbreviations.has(queryWord)) {
            return;
        }
        nameWords.forEach((nameWord) => {
            // 5 pts for exact word match and 2.5 points for partial match
            // apply damping factor
            if (queryWord === nameWord) {
                score += NAME_EXACT_MATCH*Math.pow(DAMPING_FACTOR, ind);
            } else if (nameWord.indexOf(queryWord) >= 0) { // if queryWord is in nameWord
                if (queryWord.length < (nameWord.length/2)) { // if the query word only matches a small portion of name give less points
                    score += NAME_SMALL_PARTIAL_MATCH*Math.pow(DAMPING_FACTOR, ind);
                } else {
                    score += NAME_PARTIAL_MATCH*Math.pow(DAMPING_FACTOR, ind);
                }
            }
        });
    });
    return score;
}

/*
    Address scoring algorithm:
    Match zip: 5 pts-- 2.5 for partial
    Match city: 4 pts-- 2 for partial
    Match state: 3 pts-- 1.5 for partial
    Match street value: 1 pt-- .5 for partial
*/
const calculateAddressScore = (address, query) => {
    if (query.length === 0) {
        return 0;
    }
    const { street, city, state, zip } = getAddressComponents(address);
    let score = 0;
    // separate words and remove punctuation with this regex (leaves apostrophe)
    const queryWords = query.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    queryWords.forEach((queryWord, ind) => {
        // accumulate score based on matches and apply damping factor to each
        if (queryWord === zip) {
            score += ZIP_MATCH*Math.pow(DAMPING_FACTOR, ind);
        } else if (zip.indexOf(queryWord) >= 0) { // partial zip match
            score += ZIP_PARTIAL_MATCH*Math.pow(DAMPING_FACTOR, ind);
        }
        if (queryWord === city) {
            score += CITY_MATCH*Math.pow(DAMPING_FACTOR, ind);
        } else if (city.indexOf(queryWord) >= 0) { // partial city match
            score += CITY_PARTIAL_MATCH*Math.pow(DAMPING_FACTOR, ind);
        }
        if (queryWord === state) {
            score += STATE_MATCH*Math.pow(DAMPING_FACTOR, ind);
        } else if (state.indexOf(queryWord) >= 0) { // partial state match
            score += STATE_PARTIAL_MATCH*Math.pow(DAMPING_FACTOR, ind);
        }
        if (queryWord === street) {
            score += STREET_MATCH*Math.pow(DAMPING_FACTOR, ind);
        } else if (street.indexOf(queryWord) >= 0) { // partial street match
            score += STREET_PARTIAL_MATCH*Math.pow(DAMPING_FACTOR, ind);
        }
    });
    return score;
}

const getAddressComponents = (address) => {
    // address components are separated by commas, [street,city,state,zip]
    const addressParts = address.split(',');
    // state and zip separated by space so split to get each    
    const state = addressParts.slice(-1)[0].split(' ')[1]; 
    const zip = addressParts.slice(-1)[0].split(' ')[2] ;
    const city = addressParts.slice(-2)[0];
    const street = addressParts.slice(-3)[0];

    return {
        street,
        city,
        state,
        zip
    }
}

/*
    Address scoring algorithm:
    Match word: 2 pts
    No points for partial match
*/
const calculateDescriptionScore = (description, query) => {
    if (query.length === 0) {
        return 0;
    }
    let score = 0;
    // separate words and remove punctuation with this regex (leaves apostrophe)
    const descriptionWords = description.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    const queryWords = query.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    queryWords.forEach((queryWord, ind) => {
        // dont count road abbreviations in description
        if (roadAbbreviations.has(queryWord)) {
            return;
        }
        descriptionWords.forEach((descriptionWord) => {
            // 2 pts for exact word match and 0 points for partial match(description is long so partial match doesnt mean as much)
            // apply damping factor
            if (queryWord === descriptionWord) {
                score += DESCRIPTION_MATCH*Math.pow(DAMPING_FACTOR, ind);
            }
        });
    });
    return score;
}

// prompt user for search query, keep asking until they exit with ctrl-c
const main = () => {
    const rl = readline.createInterface(process.stdin, process.stdout);

    rl.setPrompt('Enter your search query (press enter to submit, ctrl-c to exit): ');
    rl.prompt();

    rl.on('line', function(line) {
        // only process if they entered a valid query
        if (line.length !== 0) {
            // ignore stop words
            let query = removeStopwords(line.toLowerCase());
            processQuery(query);
        } else {
            console.log('Please enter a query.')
        }
        rl.prompt();
    }).on('close',function(){
        console.log('...exiting');
        process.exit(0);
    });
}

main();