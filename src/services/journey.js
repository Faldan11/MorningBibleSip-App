/**
 * Spiritual Journey Definitions & Logic
 * Levels 1-7, Faith States, and Growth Stages
 */

export const SPIRITUAL_LEVELS = [
    {
        level: 1,
        name: 'Believer',
        xpRequired: 0,
        description: 'Basic belief, often inconsistent.',
        icon: 'seed-outline'
    },
    {
        level: 2,
        name: 'Attender',
        xpRequired: 500,
        description: 'Routines-based engagement.',
        icon: 'calendar-outline'
    },
    {
        level: 3,
        name: 'Consumer',
        xpRequired: 1500,
        description: 'Attends for personal benefit, knows music/preaching.',
        icon: 'heart-outline'
    },
    {
        level: 4,
        name: 'Disciplined',
        xpRequired: 3500,
        description: 'Intentional prayer and scripture study.',
        icon: 'book-outline'
    },
    {
        level: 5,
        name: 'Servant',
        xpRequired: 7000,
        description: 'Active in helping others without recognition.',
        icon: 'hand-left-outline'
    },
    {
        level: 6,
        name: 'Witness',
        xpRequired: 12000,
        description: 'Life naturally reflects faith.',
        icon: 'megaphone-outline'
    },
    {
        level: 7,
        name: 'Surrendered',
        xpRequired: 20000,
        description: 'Full submission, Christ-centered life.',
        icon: 'infinite-outline'
    }
];

export const FAITH_STATES = [
    {
        id: 'little',
        name: 'Little Faith',
        ref: 'Matthew 8:26',
        description: 'Characterized by doubt, fear, or uncertainty, often relying on circumstances.',
        xpThreshold: 0
    },
    {
        id: 'growing',
        name: 'Growing/Developing Faith',
        ref: 'Maturing',
        description: 'A maturing faith that moves from relying on God only in emergencies to trusting Him daily.',
        xpThreshold: 3000
    },
    {
        id: 'great',
        name: 'Great Faith',
        ref: 'Matthew 8:10',
        description: "An unwavering, fully persuaded faith that acts on God's Word without needing physical proof.",
        xpThreshold: 8000
    },
    {
        id: 'perfect',
        name: 'Perfect/Mature Faith',
        ref: 'James 2:22',
        description: "A mature faith that produces works and rests in complete assurance of God's word.",
        xpThreshold: 15000
    }
];

export const GROWTH_STAGES = [
    { name: 'Imitating', xpThreshold: 0 },
    { name: 'Affiliating', xpThreshold: 2000 },
    { name: 'Searching', xpThreshold: 5000 },
    { name: 'Solidifying', xpThreshold: 10000 },
    { name: 'Mature', xpThreshold: 18000 }
];

/**
 * Calculate current journey state based on XP
 */
export function getJourneyState(xp = 0) {
    // 1. Current Level
    const levelObj = [...SPIRITUAL_LEVELS].reverse().find(l => xp >= l.xpRequired) || SPIRITUAL_LEVELS[0];
    const nextLevel = SPIRITUAL_LEVELS[levelObj.level] || null;
    
    // 2. Faith State
    const faithObj = [...FAITH_STATES].reverse().find(f => xp >= f.xpThreshold) || FAITH_STATES[0];
    
    // 3. Growth Stage
    const growthObj = [...GROWTH_STAGES].reverse().find(g => xp >= g.xpThreshold) || GROWTH_STAGES[0];

    // 4. Progress % to next level
    let progress = 1;
    if (nextLevel) {
        const currentLevelXp = levelObj.xpRequired;
        const nextLevelXp = nextLevel.xpRequired;
        progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    }

    return {
        level: levelObj,
        nextLevel,
        faith: faithObj,
        growth: growthObj,
        progress: Math.min(Math.max(progress, 0), 1),
        xp
    };
}
