// tower types
const MINE = 0, TOWER = 1, BARRACKS = 2

// creep types
const KNIGHT = 0, ARCHER = 1, GIANT = 2

const numSites = parseInt(readline());
for (let i = 0; i < numSites; i++) {
    var inputs = readline().split(' ');
    const siteId = parseInt(inputs[0]);
    const x = parseInt(inputs[1]);
    const y = parseInt(inputs[2]);
    const radius = parseInt(inputs[3]);
}

// game loop
while (true) {
    // get entire game input
    const inputs = readline().split(' ');

    // define variables
    const gold = parseInt(inputs[0]);
    const touchedSite = parseInt(inputs[1]); // -1 if none

    const sites = [], mySites = [], enemySites = []

    // the amount of gold being recieved per turn
    let goldSupply = 0

    for (let i = 0; i < numSites; i++) {
        var inputs = readline().split(' ');
        const siteId = parseInt(inputs[0]);
        const goldRemaining = parseInt(inputs[1]); // -1 if unknown
        const maxMineSize = parseInt(inputs[2]); // -1 if unknown
        const structureType = parseInt(inputs[3]); // -1 = No structure, 0 = Goldmine, 1 = Tower, 2 = Barracks
        const owner = parseInt(inputs[4]); // -1 = No structure, 0 = Friendly, 1 = Enemy
        const param1 = parseInt(inputs[5]);
        const param2 = parseInt(inputs[6]);

        const site = { id: siteId, type: structureType, owner }

        if(structureType === MINE) {
            site.maxSize = maxMineSize
            site.gold = goldRemaining
            site.rate = param1
            goldSupply += site.rate
        }
        else if(structureType === TOWER) {
            site.hp = param1
            site.attackRadius = param2
        }
        else if(structureType === BARRACKS) {
            site.cooldown = param1
            site.spawnType = param2
        }
        
        // add site to respective array
        [sites, mySites, enemySites][owner + 1].push(site)
    }

    const units = []
    const numUnits = parseInt(readline());
    for (let i = 0; i < numUnits; i++) {
        var inputs = readline().split(' ');
        const x = parseInt(inputs[0]);
        const y = parseInt(inputs[1]);
        const owner = parseInt(inputs[2]);
        const unitType = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
        const health = parseInt(inputs[4]);

        units.push({ x, y, owner, type: unitType, health })
    }

    // get weighting for best site type to build
    const weights = {
        'MINE':            0,
        'TOWER':           0,
        'BARRACKS-KNIGHT': 0,
        'BARRACKS-ARCHER': 0,
        'BARRACKS-GIANT':  0
    }

    // if low on gold supply, weight towards building a mine
    if(goldSupply < 10) {
        adjustWeight(weights, 'MINE', 0.5)
    }

    // if low on health, weight towards towers if no gold and archers if there is a good supply

    // if low on creeps, weight towards building a knights barracks

    // First line: A valid queen action
    // Second line: A set of training instructions
    console.log('WAIT');

    console.log('TRAIN');
}

// helper functions
function distSq(x1, y1, x2, y2) {
    return (x2 - x1) ** 2 + (y2 - y1) ** 2
}
function dist(x1, y1, x2, y2) {
    return distSq(x1, y1, x2, y2)
}
function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val
}
function adjustWeight(weights, weightType, amount) {
    const values = Object.values(weights)
    const averageWeight = values.reduce((a, b) => a + b, 0) / values.length

    for(const key in weights) {
        const diff = averageWeight / amount
        if(weightType === key) {
            weights[key] += amount / values.length
        }
        else {
            weights[key] -= diff
        }
        weights[key] = clamp(weights[key], 0, 1)
    }
}
function getHightestWeight(weights) {
    let high = 0, val = Object.keys(weights[0])
    for(const key in weights) {
        if(weights[key] > high) {
            high = weights[key]
            val = key
        }
    }
    return val
}
