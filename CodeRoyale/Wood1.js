/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
**/

const sites = {}

const numSites = parseInt(readline());
for (let i = 0; i < numSites; i++) {
    var inputs = readline().split(' ');
    const siteId = parseInt(inputs[0]);
    const x = parseInt(inputs[1]);
    const y = parseInt(inputs[2]);
    const radius = parseInt(inputs[3]);

    sites[siteId] = { siteId, x, y, radius }
}

// game loop
while (true) {
    var inputs = readline().split(' ');
    const gold = parseInt(inputs[0]);
    const touchedSite = parseInt(inputs[1]); // -1 if none

    const availableSites = []
    const mySites = []
    for (let i = 0; i < numSites; i++) {
        var inputs = readline().split(' ');
        const siteId = parseInt(inputs[0]);
        const ignore1 = parseInt(inputs[1]); // used in future leagues
        const ignore2 = parseInt(inputs[2]); // used in future leagues
        const structureType = parseInt(inputs[3]); // -1 = No structure, 2 = Barracks
        const owner = parseInt(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
        const param1 = parseInt(inputs[5]);
        const param2 = parseInt(inputs[6]);

        const formattedSite = { ...sites[siteId], structureType }

        if( owner === -1 ) {
            availableSites.push(formattedSite)
        }
        if(owner === 0) {
            mySites.push(formattedSite)
        }
    }

    const units = []

    const numUnits = parseInt(readline());
    for (let i = 0; i < numUnits; i++) {
        var inputs = readline().split(' ');
        const x = parseInt(inputs[0]);
        const y = parseInt(inputs[1]);
        const owner = parseInt(inputs[2]);
        const unitType = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER
        const health = parseInt(inputs[4]);

        units.push({ owner, unitType, health, x, y })
    }




    // Write an action using console.log()
    // To debug: console.error('Debug messages...');
    const enemyUnits = units.filter(unit => unit.owner === 1)

    // First line: A valid queen action
    // Second line: A set of training instructions

    const myQueen = units.find(unit => unit.unitType === -1 && unit.owner === 0)
    const enemyQueen = units.find(unit => unit.unitType === -1 && unit.owner === 1)

    const getSiteWeighting = (site) => {
        const myQueenDistance = dist(site.x, site.y, myQueen.x, myQueen.y) - 30 - site.radius

        if(myQueenDistance < 1) {
            return 1
        }

        const avgEnemyDistance = enemyUnits.map(unit => dist(site.x, site.y, unit.x, unit.y))
        .reduce((a, b) => a + b, 0) / enemyUnits.length

        return (
            1 / myQueenDistance + avgEnemyDistance / 100000
        )
    }

    const closestSites = availableSites.sort((a, b) => {
        return getSiteWeighting(b) - getSiteWeighting(a)
    })

    let structureType = "BARRACKS-KNIGHT";

    const knightBarracks = mySites.filter(site => site.structureType === 2)

    if(knightBarracks.length > 2) {
        structureType = "TOWER";
    }

    const mines = mySites.filter(site => site.structureType === 0)

    if(gold < 80 && mines.length < 3) {
        structureType = "MINE";
    }

    if(closestSites.length) {
        const site = closestSites[0]

        console.log(`BUILD ${site.siteId} ${structureType}`)
    }
    else {
        const towers = mySites.filter(site => site.structureType === 1).sort((a, b) => {
            return getSiteWeighting(b) - getSiteWeighting(a)
        })

        const site = towers[0]

        console.log(`BUILD ${site.siteId} TOWER`);
    }

    const trainingSites = mySites.filter(site => site.structureType === 2).sort((a, b) => {
        return dist(a.x, a.y, enemyQueen.x, enemyQueen.y) - dist(b.x, b.y, enemyQueen.x, enemyQueen.y)
    }).slice(0, Math.floor(gold / 80))

    if(trainingSites.length) {
        let str = ' ' + trainingSites.map(site => site.siteId).join(' ')
        console.log(`TRAIN${str}`)
    }
    else {
        console.log(`TRAIN`);
    }
}


function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

