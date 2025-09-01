const { connect } = require("../db/mongoClient");
const { findClassNameById, fourWeeksAgoMs } = require("../utility");
const { getGuildRoster, getCharacterGear, getCharacterAppearance } = require("./blizzardController");
const { getGuildAttendance } = require("./warcraftLogsController");

/**
 * Upserts the latest snapshot for a player:
 * - For each slot in latest.items: ensure item is first in items.<SLOT> array (pull by id, then push at position 0).
 * - For scalar fields (image, rank, level, attendance): set them if provided.
 * @param {string} playerName - player's name (unique key in your collection)
 * @param {{
 *   items?: { [slot: string]: { id: number|string, name: string } },
 *   image?: string,
 *   rank?: number|string,
 *   level?: number|string,
 *   attendance?: number|string
 *   playerClass?: string
 * }} latest
 * @param {object} [options]
 * @param {boolean} [options.createIfMissing=false] - set true to create the player doc if it doesn't exist
 */


async function upsertLatestItems(playerName, latest, options = {}) {
    const { createIfMissing = false } = options;
    const db = await connect();
    const players = db.collection('players');
    if (!latest || typeof latest !== 'object') throw new Error('latest payload must be an object');

    const { items = {}, image, rank, level, attendance, playerClass } = latest;
    const ops = [];

    // 0) One-time upsert by name only. Never condition on `items` here.
    ops.push({
        updateOne: {
            filter: { name: playerName },
            update: {
                $setOnInsert: {
                    name: playerName,
                    class: '', // set defaults you want
                    spec: '',
                    core: false,
                    items: {},
                    lastSeen: new Date().toISOString(),
                },
            },
            upsert: createIfMissing,
        },
    });

    // 0b) If doc exists but `items` missing, initialize it (NO upsert here)
    ops.push({
        updateOne: {
            filter: { name: playerName, items: { $exists: false } },
            update: { $set: { items: {} } },
            upsert: false,
        },
    });

    // 1) Per-slot ops (ensure array; pull; push to front)
    for (const [slot, item] of Object.entries(items || {})) {
        if (!item || item.id == null) continue;

        const id = typeof item.id === 'string' ? Number(item.id) : item.id;
        if (!Number.isFinite(id)) continue;
        const normalized = { id, name: item.name };

        // Ensure slot array exists
        ops.push({
            updateOne: {
                filter: { name: playerName, [`items.${slot}`]: { $exists: false } },
                update: { $set: { [`items.${slot}`]: [] } },
                upsert: false,
            },
        });

        // Pull any existing occurrence
        ops.push({
            updateOne: {
                filter: { name: playerName },
                update: { $pull: { [`items.${slot}`]: { id } } },
                upsert: false,
            },
        });

        // Push to front
        ops.push({
            updateOne: {
                filter: { name: playerName },
                update: { $push: { [`items.${slot}`]: { $each: [normalized], $position: 0 } } },
                upsert: false,
            },
        });
    }

    // 2) Scalars (NO upsert)
    const toNum = (v) =>
        typeof v === 'number' ? v :
            (typeof v === 'string' && v.trim() !== '' ? Number(v) : undefined);

    const scalarSet = {};
    if (typeof image === 'string' && image.length) scalarSet.image = image;
    if (typeof playerClass === 'string' && playerClass.length) scalarSet.class = playerClass;
    const rn = toNum(rank); if (Number.isFinite(rn)) scalarSet.rank = rn;
    const ln = toNum(level); if (Number.isFinite(ln)) scalarSet.level = ln;
    const an = attendance; scalarSet.attendance = an;




    if (Object.keys(scalarSet).length) {
        ops.push({
            updateOne: {
                filter: { name: playerName },
                update: { $set: scalarSet },
                upsert: false,
            },
        });
    }

    if (!ops.length) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    return players.bulkWrite(ops, { ordered: true });
}




async function fetchAndUpdatePlayers(){
    const players = await getGuildRoster();
    const playerLibrary = {};
    for (const p of players.members.slice(0, 5)) {
      //get appearance
      let appearance = null;
      try{
        appearance = await getCharacterAppearance(p.character.name);
      }catch(e){
        console.error(`Error fetching appearance for ${p.character.name}:`, e.message);
        continue;
      }

      //get gear
      let gear = {};
      try{
        const equippedItems = (await getCharacterGear(p.character.name)).equipped_items;
        gear = equippedItems.reduce((acc, i) => {
          acc[i.slot.type] = { id: i.item.id, name: i.name };
          return acc;
        }, {});
      }catch(e){
        console.error(`Error fetching gear for ${p.character.name}:`, e.message);
        continue;
      }
      myplayer = p;
      playerLibrary[p.character.name] = {items: gear, image: appearance.assets[0].value, rank: p.rank, level: p.character.level, playerClass: findClassNameById(p.character.playable_class.id)};
      console.log(`Completed player: ${p.character.name}`);
    }
    const attendance1 = await getGuildAttendance(parseInt(process.env.WCL_GUILD_ID), 1);
    const attendance2 = await getGuildAttendance(parseInt(process.env.WCL_GUILD_ID), 2);
    const attendance = [...attendance1.guildData.guild.attendance.data, ...attendance2.guildData.guild.attendance.data];
    for (const player of Object.keys(playerLibrary)){
      let attendanceCount = 0;
      let totalRaids = 0;
      let playerAttendance = [];
      for (const raid of attendance){
        if (["Temple of Ahn'Qiraj", "Blackwing Lair", "Molten Core", "Naxxramas"].includes(raid.zone.name) && raid.startTime > fourWeeksAgoMs()){
          totalRaids++;
          let attended = false;
          if (raid.players.find(p => p.name === player)){
            attendanceCount++;
            attended = true;
          }
          playerAttendance.push({...raid.zone, start: raid.startTime, attended});
        }
      }
      playerLibrary[player].attendance = {rate: attendanceCount/totalRaids*100, history: playerAttendance};
    }

    for (const player of Object.keys(playerLibrary)){
      try{
        await upsertLatestItems(player, playerLibrary[player], { createIfMissing: true });
      }catch(e){
        console.error(`Error upserting player ${player}:`, e.message);
        continue;
      }
    }


    return playerLibrary;
}


module.exports = { upsertLatestItems, fetchAndUpdatePlayers };