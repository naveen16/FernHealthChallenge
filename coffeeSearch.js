const coffeeShops = require('./CoffeeShops');
const readline = require('readline');
require('colors');

const roadAbbreviations = new Set();
roadAbbreviations.add('st');
roadAbbreviations.add('rd');
roadAbbreviations.add('ave');
roadAbbreviations.add('ln');
roadAbbreviations.add('blvd');


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
    // separate words and remove punctuation with this regex (leaves apostrophe and dashes)
    const nameWords = name.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    const queryWords = query.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    queryWords.forEach((queryWord) => {
        if (roadAbbreviations.has(queryWord)) {
            return;
        }
        nameWords.forEach((nameWord) => {
            // 5 pts for exact word match and 2.5 points for partial match
            if (queryWord === nameWord) {
                score += 5;
            } else if (nameWord.indexOf(queryWord) >= 0) { // if queryWord is in nameWord
                if (queryWord.length < (nameWord.length/2)) { // if the query word only matches a small portion of name give less points
                    score += 1.5
                } else {
                    score += 2.5;
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
    // separate words and remove punctuation with this regex (leaves apostrophe and dashes)
    const queryWords = query.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    queryWords.forEach((queryWord) => {
        if (queryWord === zip) {
            score += 5;
        } else if (zip.indexOf(queryWord) >= 0) {
            score += 2.5
        }
        if (queryWord === city) {
            score += 4;
        } else if (city.indexOf(queryWord) >= 0) {
            score += 2
        }
        if (queryWord === state) {
            score += 3;
        } else if (state.indexOf(queryWord) >= 0) {
            score += 1.5
        }
        if (queryWord === street) {
            score += 1;
        } else if (street.indexOf(queryWord) >= 0) {
            score += .5
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
    Match word partially: 1 pt
*/
const calculateDescriptionScore = (description, query) => {
    if (query.length === 0) {
        return 0;
    }
    let score = 0;
    // separate words and remove punctuation with this regex (leaves apostrophe and dashes)
    const descriptionWords = description.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    const queryWords = query.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    queryWords.forEach((queryWord) => {
        if (roadAbbreviations.has(queryWord)) {
            return;
        }
        descriptionWords.forEach((descriptionWord) => {
            // 2 pts for exact word match and 0 points for partial match(description is long so partial match doesnt mean as much)
            if (queryWord === descriptionWord) {
                score += 2;
            }
        });
    });
    return score;
}

const stopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now']

const removeStopwords = (str) => {
    res = []
    words = str.match(/[a-zA-Z0-9]+[']?[a-zA-Z0-9]*/g);
    for(i=0;i<words.length;i++) {
        if(!stopwords.includes(words[i])) {
            res.push(words[i])
        }
    }
    return(res.join(' '))
}


// prompt user for search query, keep asking until they exit with ctrl-c
const main = () => {
    const rl = readline.createInterface(process.stdin, process.stdout);

    rl.setPrompt('Enter your search query (press enter to submit, ctrl-c to exit): ');
    rl.prompt();

    rl.on('line', function(line) {
        // ignore stop words
        query = removeStopwords(line.toLowerCase());
        processQuery(query);
        rl.prompt();
    }).on('close',function(){
        console.log('...exiting');
        process.exit(0);
    });
}

main();