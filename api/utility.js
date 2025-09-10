
function fourWeeksAgoMs() {
  const now = Date.now();                     // current time in ms
  const FOUR_WEEKS_MS = 1000 * 60 * 60 * 24 * 7 * 4; // 4 weeks worth of ms
  return now - FOUR_WEEKS_MS;
}

function getObjectWithHighestStartAndPerformance(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return null; // handle empty or invalid input
  }

  // Filter out objects that don't have a performance array with length > 0
  const validObjects = arr.filter(
    obj => Array.isArray(obj.performance) && obj.performance.length > 0
  );

  if (validObjects.length === 0) {
    return null; // no valid objects
  }

  // Reduce to find the one with the highest start value
  return validObjects.reduce((maxObj, currentObj) => {
    return (currentObj.start > maxObj.start) ? currentObj : maxObj;
  });
}

function parseMax(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return null; // handle invalid input
  }

  return arr.reduce((maxObj, currentObj) => {
    return (currentObj.parse > maxObj.parse) ? currentObj : maxObj;
  });
}
function iparseMax(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return null; // handle invalid input
  }

  return arr.reduce((maxObj, currentObj) => {
    return (currentObj.iparse > maxObj.iparse) ? currentObj : maxObj;
  });
}



const playableClasses = [
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/1?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Warrior",
    "id": 1
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/2?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Paladin",
    "id": 2
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/3?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Hunter",
    "id": 3
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/4?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Rogue",
    "id": 4
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/5?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Priest",
    "id": 5
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/7?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Shaman",
    "id": 7
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/8?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Mage",
    "id": 8
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/9?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Warlock",
    "id": 9
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/11?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Druid",
    "id": 11
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/6?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Death Knight",
    "id": 6
  },
  {
    "key": {
      "href": "https://us.api.blizzard.com/data/wow/playable-class/10?namespace=static-5.5.0_61496-classic-us"
    },
    "name": "Monk",
    "id": 10
  }
]

function findClassNameById(id) {
  const cls = playableClasses.find(c => c.id === id);
  return cls ? cls.name.toUpperCase() : null;
}

module.exports = { fourWeeksAgoMs,  findClassNameById, getObjectWithHighestStartAndPerformance, parseMax, iparseMax};