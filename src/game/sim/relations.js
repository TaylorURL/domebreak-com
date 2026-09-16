// Readings over a nation's `relations` map — the three the sim and the AI both
// take. They are counted rather than cached because relations change under peace
// deals, alliances and betrayals within a single tick, so a stored tally would go
// stale between the change and the next think. Pure, and deliberately importing
// nothing: stability, war resolution and every diplomacy module reads from here,
// and a leaf module cannot close a cycle back onto any of them.

// Wars a nation is currently fighting.
export function warCount(n) {
    let k = 0;
    for (const s in n.relations) if (n.relations[s] === "war") k++;
    return k;
}

// Alliances a nation currently holds.
export function allyCount(n) {
    let k = 0;
    for (const s in n.relations) if (n.relations[s] === "ally") k++;
    return k;
}

// Is there a third nation both `a` and `b` are at war with? The shared enemy is
// what a coalition forms around.
export function sharesEnemy(a, b) {
    for (const s in a.relations) if (a.relations[s] === "war" && b.relations[s] === "war") return true;
    return false;
}
