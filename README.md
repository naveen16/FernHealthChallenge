# Fern Health Technical Challenge

## Instructions to run
```sh
$ git clone https://github.com/naveen16/FernHealthChallenge.git
$ cd FernHealthChallenge
$ npm install
$ cd src
$ node coffeeSearch.js
```

You will be prompted to enter a search query. 

## Problem
    
Write a search algorithm that ranks a list of coffee shops from best fit to worst fit based on how close the user
input is to the coffee shop. We will rank these based on the 3 attributes of the coffee shop: name, location, and description.

## Algorithm

There are 3 different attributes we will use to rank the coffee shops: **name**, **location**, **description**.

### Name

For each word in the search query, we try to match it with all of the words in the name data attribute. For each 
exact match found, we add 5 points to the score of the coffee shop. For each partial match we add 2.5 points to the
score. If the partial match is less than half of the name then we only add 1.5 points(small partial matches dont mean as much).

### Location

First we separate the address of the coffee shop into 4 components: **street**, **city**, **state**, **zipcode**.
Zipcode is the most specific of the values so we add 5 points for a zipcode match or 2.5 for a partial match.
For a city match we add 4 points and 2 for partial match.
For a state match we add 3 points and 1.5 for partial match.
Finally for a matching word in the street we add 1 point or .5 for a partial match.

The overall idea is to give more points for a more specific match and less for a more general match.

### Description

For the description we award 2 points for an exact match to a word. We award 0 points for partial matches in this
category. After doing some testing it became evident that partial matches in the description didn't often imply
a better match to the coffee shop. 


After processing the search query for these 3 data attributes we sum the score from all 3 to get a total score for each
coffee shop. We take these scores and sort the shops in descending order with the highest score first and the lowest last.

#### Optimization

The following are some optimizations we made to get better results:
- Dont count road abbreviations (st, rd,..etc) in the matches for name and description
- Dont count stop words (the, and,..etc) for any of the data attributes
- No partial match for description attribute
- Reduced partial match score for name attribute
- Added damping factor to each score addition. The idea is that the first word in the query is more important than the second, the second is more important than the third, and so on. So we apply a damping factor of 0.9 to each query word match. 1st query word is value\*(0.9^0) = value*1, 2nd query word is value\*(0.9^1) and so on.

#### Improvements

The following are some ideas for improvement in the future:
- Find a way to identify proper nouns (Starbucks, Blue Bottle,..etc) and give a higher score for these as right now they count the same as regular nouns (Coffee, Shop)
- Cities that have spaces should match with the query (New York, Los Angeles,..etc), right now cities in the query that are separated by spaces are considered 2 words.
- State abbreviations in the address should match with full state name in the search query (NY should match New York).


