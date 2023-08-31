// tower types
const MINE = 0, TOWER = 1, BARRACKS = 2

// creep types
const QUEEN = -1, KNIGHT = 0, ARCHER = 1, GIANT = 2

const TOWER_MAPPING = {
    [TOWER]:    'TOWER',
    [MINE]:     'MINE',
    [BARRACKS]: 'BARRACKS'
}

const numSites = parseInt(readline());

const initialSites = {}

for (let i = 0; i < numSites; i++) {
    var inputs = readline().split(' ');
    const siteId = parseInt(inputs[0]);
    const x = parseInt(inputs[1]);
    const y = parseInt(inputs[2]);
    const radius = parseInt(inputs[3]);

    initialSites[siteId] = { x, y, radius }
}

// game loop
while (true) {
    // get entire game input
    var inputs = readline().split(' ');

    // define variables
    const gold = parseInt(inputs[0]);
    const touchedSite = parseInt(inputs[1]); // -1 if none

    /******** SITE MANAGEMENT **********/

    // define all the groupings of sites initially, preventing needing to filter on the fly
    const sites = [], openSites = [], mySites = [], enemySites = [], myBarracks = [], enemyTowers = []

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

        /** Define site data */
        const site = { ...initialSites[siteId], id: siteId, type: structureType, owner }
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

        /** Add site to respective arrays */
        ([openSites, mySites, enemySites][owner + 1]).push(site);
        sites.push(site);

        if(structureType === BARRACKS && owner === 0) {
            myBarracks.push(site)
        }

        if(structureType === TOWER && owner === 1) {
            enemyTowers.push(site)
        }
    }

    /**************** UNIT MANAGEMENT *****************/
    const units = [], rogueUnits = [], myUnits = [], enemyUnits = []

    // queens
    let myQueen, enemyQueen;

    const numUnits = parseInt(readline());
    for (let i = 0; i < numUnits; i++) {
        var inputs = readline().split(' ');
        const x = parseInt(inputs[0]);
        const y = parseInt(inputs[1]);
        const owner = parseInt(inputs[2]);
        const unitType = parseInt(inputs[3]); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER, 2 = GIANT
        const health = parseInt(inputs[4]);

        const unit = { x, y, owner, type: unitType, health };

        // add to respecive array
        ([rogueUnits, myUnits, enemyUnits][owner + 1]).push(unit);
        
        // add to total array
        units.push(unit);

        // queens
        if(unitType === QUEEN) {
            myQueen    = owner === 0 ? unit : myQueen
            enemyQueen = owner === 1 ? unit : enemyQueen
        }
    }

    /********** SITE MANAGEMENT II ***********/

    const averageSiteDistance = {
        me:    0,
        enemy: 0
    }

    for(const site of sites) {
        const distToMyQueen    = dist(site.x, site.y, myQueen.x, myQueen.y)
        const distToEnemyQueen = dist(site.x, site.y, enemyQueen.x, enemyQueen.y)

        averageSiteDistance.me    += distToMyQueen
        averageSiteDistance.enemy += distToEnemyQueen
    }

    averageSiteDistance.me    /= sites.length
    averageSiteDistance.enemy /= sites.length

    /**
     * Weighting values:
     * 
     * 0 should be absolutely no picking
     * 1 should be 100% chance of picking
     */

    // default weighting for tower types to build
    const towerTypes = {
        'MINE':     { weight: 0.25 },
        'TOWER':    { weight: 0.45 },
        'BARRACKS': { weight: 0.24 }
    }

    // weighing for creep types to train
    const creepTypes = {
        'KNIGHT': { weight: 0.32 },
        'ARCHER': { weight: 0.21 },
        'GIANT':  { weight: 0.25 }
    }

    if(goldSupply < 12) {
        adjustWeight(towerTypes, 'MINE', ( 1 - goldSupply / 12 ) * 0.5 )
    }

    if(enemyUnits.length > myUnits.length) {
        adjustWeight(towerTypes, 'TOWER', (1 - myUnits.length / enemyUnits.length) * 0.5 )
    }

    if(myBarracks.length < 2) {
        adjustWeight(towerTypes, 'BARRACKS', (1 - myBarracks.length / 2) * 0.5 )
    }

    // weight all sites to try to build on
    const siteWeightings = weightStructure(sites)

    sites.forEach(site => {
        let weight = 0.25 // initial weight

        // don't try to build mine if enemies nearby. Weight will be 0 automatically
        if( site.type === MINE && getClosestEntityDistance(site, enemyUnits) - site.radius < 100 ) {
            return;
        }

        weight += 0.2 - (dist2(site, myQueen) / averageSiteDistance.me) * 0.2

        if( site.owner !== -1 ) {
            weight /= 2
        }

        // upgrade tower if touching
        if( site.owner === 0 && (site.type === TOWER && site.attackRadius < 450) ) {
            weight *= 2.5
        }

        // encourage upgrading mine
        if( touchedSite === site.id && site.type === MINE && site.rate < site.maxSize ) {
            weight += (1 - weight) * 0.9
        }

        // don't try to build near enemy towers
        for(const tower of enemyTowers) {
            if(dist2(site, tower) < tower.attackRadius + site.radius) {
                weight /= 4
            }
        }

        adjustWeight(siteWeightings, site.id, weight)
    })

    console.error(Object.values(siteWeightings).sort((a, b) => b.weight - a.weight))

    const bestSiteId = getHighestWeight(siteWeightings)

    const bestSite = siteWeightings[bestSiteId]

    if( bestSite.owner === 0 ) {
        adjustWeight(towerTypes, TOWER_MAPPING[bestSite.type], 0.5)

        // discourage building towers far from the enemy queen
        if( bestSite.type === TOWER ) {
            

            adjustWeight(towerTypes, 'TOWER', (dist2(bestSite, enemyQueen) / averageSiteDistance.enemy) )
        } 
    }

    let bestBuildType = getHighestWeight(towerTypes);

    if(bestBuildType === 'BARRACKS') {
        const bestCreepType = getHighestWeight(creepTypes)
        bestBuildType = `${bestBuildType}-${bestCreepType}`
    }

    console.log(`BUILD ${bestSiteId} ${bestBuildType}`)

    console.log("TRAIN" + (myBarracks.length ? ' ' + myBarracks.map(b => b.id).join(' ') : ''));
}

// helper functions
function distSq(x1, y1, x2, y2) {
    return (x2 - x1) ** 2 + (y2 - y1) ** 2
}
function dist(x1, y1, x2, y2) {
    return Math.sqrt(distSq(x1, y1, x2, y2))
}
function dist2(a, b) {
    return dist(a.x, a.y, b.x, b.y)
}
function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val
}
function weightStructure(items) {
    return items.reduce((acc, item) => {
        acc[item.id] = { ...item, weight: 0 }
        return acc
    }, {})
}
function adjustWeight(weights, key, amount) {
    weights[key].weight = clamp(weights[key].weight + amount, 0, 1)
}
function getHighestWeight(items) {
    let high = -Infinity, val = null
    for(const key in items) {
        if(items[key].weight >= high) {
            high = items[key].weight
            val = key
        }
    }
    return val
}
function getClosestEntityDistance(item, entities) {
    return Math.min(...entities.map(e => dist(item.x, item.y, e.x, e.y)))
}

    // // if low on gold supply, weight towards building a mine
    // if(goldSupply < 10) {
    //     adjustWeight(towerTypes, 'MINE', 1 - goldSupply / 10)
    // }

    // // if low on health, weight towards towers if no gold and archers if there is a good supply
    // if( myQueen.hp / enemyQueen.hp < 1 ) {
    //     adjustWeight(towerTypes, 'TOWER', 1 - myQueen.hp / enemyQueen.hp)
    // }

    // // if low on creeps, weight towards building a knights barracks
    // if(myBarracks.length < 2) {
    //     adjustWeight(towerTypes, 'BARRACKS-KNIGHT', 1)
    // }

    // if(getClosestEntityDistance(myQueen, enemyUnits) < 300) {
    //     adjustWeight(towerTypes, 'MINE', -5)
    //     adjustWeight(towerTypes, 'TOWER', 5)
    // }

    // // move toward closest site
    // const siteWeightings = weightStructure(sites)

    // sites.forEach(site => {
    //     // initial distance weight
    //     let weight = 1 - dist(site.x, site.y, myQueen.x, myQueen.y) / averageSiteDistance.me

    //     if(site.owner != -1) {
    //         weight -= 1
    //     }
        
    //     if(site.owner == 1 || site.type == BARRACKS) {
    //         weight -= 1
    //     }

    //     if(getClosestEntityDistance(site, enemyTowers) < 700) {
    //         weight -= 3
    //     }

    //     // max out mine
    //     if(touchedSite == site.id && site.type == MINE && site.rate < site.maxSize) {
    //         weight += 1.5
    //         adjustWeight(towerTypes, 'MINE', 5)
    //         console.error("MINE", site.maxSize)
    //     }

    //     // don't build mines if enemies nearby
    //     if( site.type === MINE && getClosestEntityDistance(site, enemyUnits) - site.radius < 100 ) {
    //         weight -= 5
    //     }

    //     adjustWeight(siteWeightings, site.id, weight)
    // })

    // const barracksWeightings = weightStructure(myBarracks)

    // myBarracks.forEach(site => {
    //     let weight = 1 - dist(site.x, site.y, enemyQueen.x, enemyQueen.y) / averageSiteDistance.enemy

    //     if(site.type === KNIGHT) {
    //         weight += 1
    //     }

    //     if(site.cooldown > 0) {
    //         weight -= 5
    //     }

    //     adjustWeight(barracksWeightings, site.id, weight)
    // })

    // // console.error(barracksWeightings)

    // console.error(towerTypes)

    // const bestTowerType = getHighestWeight(towerTypes)
    // const bestSite = siteWeightings[getHighestWeight(siteWeightings)]
    // const bestBarracks = barracksWeightings[getHighestWeight(barracksWeightings)]
