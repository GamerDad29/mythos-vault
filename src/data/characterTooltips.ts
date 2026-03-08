// src/data/characterTooltips.ts
// Skill, feature, and gear tooltip data for all player characters.
// Voice: 40% Sanderson (mechanics named) / 40% BLM (specific emotional detail) / 20% Abercrombie (honest cost)

export interface TooltipData {
  definition: string;   // D&D mechanical description — one sentence, clear and direct
  flavor?: string;      // Character-specific flavor in the 40/40/20 voice — 1-3 sentences
  homebrew?: boolean;   // DM-crafted or co-crafted with the player
}

type CharacterTooltips = Record<string, TooltipData>;

// ─── Skill Tooltips ───────────────────────────────────────────────────────────

export const SKILL_TOOLTIPS: Record<string, CharacterTooltips> = {

  'pc-cannonball-kar-thul': {
    'Athletics': {
      definition: 'Strength checks for climbing, jumping, grappling, swimming, and feats of raw physical power.',
      flavor: "Cannonball doesn't climb walls. He argues with them until they let him up. His Athletics isn't technique — it is the sheer unreasonable belief that his body can do whatever his ambition demands, and the terrifying frequency with which he's right.",
    },
    'Acrobatics': {
      definition: 'Dexterity checks for balance, tumbling, contorting, and maintaining precise physical control.',
      flavor: "He's a 3'6\" halfling who regularly charges giants, leaps from moving wagons, and wins. The body knows what the brain has already decided. You just have to decide it first.",
    },
    'Intimidation': {
      definition: 'Charisma checks for frightening, threatening, or coercing others through force of personality.',
      flavor: "Every tavern in Karnuk has a story about the shirtless halfling who made a grown man back down. Cannonball doesn't perform menace — he generates it the way a bonfire generates heat. It is a byproduct of what he already is.",
    },
    'Nature': {
      definition: 'Intelligence checks for knowledge of terrain, plants, animals, weather, and the natural world.',
      flavor: "Born to Goliath clan peaks and educated by years of wandering, Cannonball knows how the world works before most people ask the question. He won't explain it to you. He'll just already be ready when the storm comes.",
    },
    'Sleight of Hand': {
      definition: 'Dexterity checks for pickpocketing, planting items, palming objects, and fine manual concealment.',
      flavor: "The hands that swing a greataxe are, unexpectedly, also the hands that took your coin purse three minutes ago. Nobody checks a halfling's hands the way they check everyone else's. Cannonball has not corrected this oversight.",
    },
    'Stealth': {
      definition: 'Dexterity checks for moving silently and avoiding detection by sight and sound.',
      flavor: "He is conspicuous in every way that matters — until he's not. Something in the halfling's build and the Outlander's training adds up to a man who can become part of the rock when he needs to. It costs him nothing but patience.",
    },
    'Survival': {
      definition: 'Wisdom checks for tracking, foraging, navigating, predicting weather, and enduring harsh conditions.',
      flavor: "He's been finding his way through wild places since he was fifteen. The Underdark is different from the peaks, but the fundamentals are the same: know what wants to eat you, find water before you need it, sleep somewhere nothing else sleeps.",
    },
  },

  'pc-bpop': {
    'Arcana': {
      definition: 'Intelligence checks for knowledge of spells, magical items, arcane traditions, and the planes.',
      flavor: "Bpop catalogues magic the way he catalogues everything else: as a system with discoverable rules. He served a dragon and survived stone giants and studied under nobody, and still understands the weave better than most wizards. Resentment is an excellent motivator.",
    },
    'History': {
      definition: 'Intelligence checks for historical events, legendary figures, ancient civilizations, and past lore.',
      flavor: "He was a tool in a Red Dragon's hoard of useful things. He listened. He remembered. History, to Bpop, is the database of who had power, how they held it, and when they lost it. He studies it with the focus of someone who intends to do better.",
    },
    'Investigation': {
      definition: 'Intelligence checks for searching, deduction, finding hidden objects, and reverse-engineering how things work.',
      flavor: "Bpop examines the world the way a watchmaker examines a broken clock: every imperfection is a clue, every mechanism tells a story. He doesn't investigate — he reverse-engineers reality. He finds the answer before you've finished stating the problem.",
    },
    'Nature': {
      definition: 'Intelligence checks for terrain, plants, animals, weather, and natural phenomena.',
      flavor: "Stone Giants live on mountains. The foundations of things — geological, botanical, ecological — are Bpop's first language. He won't find wilderness beautiful. He'll just know exactly what it's doing.",
    },
    'Survival': {
      definition: 'Wisdom checks for following tracks, foraging, navigating, and enduring harsh conditions.',
      flavor: "He walked out of a cave collapse with nothing but his tools and his Steel Defender. Survival, for Bpop, is a design problem with specific constraints. He solves it the same way he solves everything else: methodically, without panic, and with appropriate resentment toward the conditions.",
    },
  },

  'pc-iblith-gorch': {
    'Acrobatics': {
      definition: 'Dexterity checks for balance, tumbling, contorting, and maintaining precise physical control under pressure.',
      flavor: "Iblith doesn't move through spaces — he negotiates with them. His Acrobatics is the architecture of survival made into reflex: forty years of being in bodies that don't belong where they are teaches you to make every footfall a decision.",
    },
    'Deception': {
      definition: 'Charisma checks for concealing truth, misleading, or projecting a false appearance.',
      flavor: "He was hidden for years before he could walk without help. By the time Jarlaxle found him, concealment was not a skill — it was a grammar. He speaks it without an accent.",
    },
    'Insight': {
      definition: 'Wisdom checks for reading people, detecting lies, understanding motives, and sensing emotional subtext.',
      flavor: "He read the truth of a cloaked figure before anyone else had processed the light. He can tell when someone is lying by the way they distribute their weight. Iblith's Insight is what happens when survival depends not on being strong enough to win, but on knowing exactly when not to fight.",
    },
    'Stealth': {
      definition: 'Dexterity checks for moving silently and avoiding detection.',
      flavor: "Iblith doesn't hide. He simply decides that you're not going to see him, and the shadows comply. Forty years of being the wrong color in every room taught him that visibility is a choice — and he stopped choosing it a long time ago.",
    },
    'Survival': {
      definition: 'Wisdom checks for tracking, foraging, navigating, and enduring harsh conditions.',
      flavor: "The Underdark tries to kill everything in it. Iblith has been here long enough to take it personally. His Survival is applied stubbornness — the accumulated weight of every time the world tried to correct his existence and failed.",
    },
    "Thieves' Tools": {
      definition: 'Dexterity checks for picking locks, disarming traps, and bypassing mechanical security systems.',
      flavor: "A lock is a question about who has permission to be somewhere. Iblith has never believed in other people's answers to that question. His tools are the counterargument.",
    },
  },

  'pc-morrighan-bustlewing': {
    'Arcana': {
      definition: 'Intelligence checks for knowledge of spells, magical traditions, arcane theory, and the planes.',
      flavor: "She is a Warlock who took a second class to understand the mechanism of what was already happening to her. Morrighan's Arcana is not curiosity — it is inventory management. She knows what she carries so she can use it precisely.",
    },
    'Deception': {
      definition: 'Charisma checks for concealing truth, misleading, and projecting false appearances.',
      flavor: "She rarely lies. That's what makes her Deception so effective. She selects which truths to offer, arranges them in the order most useful to her, and lets you build the wrong conclusion from entirely accurate components.",
    },
    'History': {
      definition: 'Intelligence checks for historical events, ancient civilizations, legends, and lost lore.',
      flavor: "She grew up among worshippers of a death goddess, surrounded by records of every transition between living and not. Morrighan's History is comprehensive in the way an archive is comprehensive — she has read the whole thing and found it informative.",
    },
    'Intimidation': {
      definition: 'Charisma checks for threatening, browbeating, and compelling cooperation through fear.',
      flavor: "Morrighan doesn't raise her voice. She doesn't need to. She simply looks at you with the serene certainty of someone who has already watched you die in a future she finds mildly interesting — and lets you figure out the rest.",
    },
    'Investigation': {
      definition: 'Intelligence checks for searching, deduction, and finding hidden or obscured information.',
      flavor: "She examines things the way she examines people — not for what they claim to be, but for what they reveal in the spaces between. Her Investigation is the patience of someone who knows the answer will come to her eventually, because everything does.",
    },
    'Nature': {
      definition: 'Intelligence checks for terrain, flora, fauna, weather, and the natural world.',
      flavor: "She grew in the Shadowglade. She knows the taxonomy of things that grow in permanent shade, the cycle of seasons in a place where seasons don't strictly apply, and how things decompose. She finds this last part particularly interesting.",
    },
    'Performance': {
      definition: 'Charisma checks for entertaining and moving audiences through music, speech, dance, or storytelling.',
      flavor: "Everything Morrighan does in public is a performance. The eerie calm, the measured responses, the small dark smile — all of it is genuine. She has found that sincerity and theater are not opposites. They are the same thing deployed at different scales.",
    },
    'Persuasion': {
      definition: 'Charisma checks for influencing others through diplomacy, reason, and social grace.',
      flavor: "She persuades the way water persuades stone — patiently, repeatedly, from a direction you stopped watching. You end up agreeing with Morrighan. You're never entirely sure when you decided to.",
    },
  },
};

// ─── Feature Tooltips ─────────────────────────────────────────────────────────

export const FEATURE_TOOLTIPS: Record<string, CharacterTooltips> = {

  'pc-cannonball-kar-thul': {
    'Reckless Attack': {
      definition: 'Attack with advantage on your turn. Until your next turn, attacks against you also have advantage.',
      flavor: "Cannonball never considers the second half of this sentence. That's probably not a coincidence.",
    },
    'Rage (4/Long Rest)': {
      definition: 'Bonus action: enter Rage for 1 minute. Advantage on STR checks/saves, +2 damage, resistance to bludgeoning, piercing, and slashing damage.',
      flavor: "Cannonball activates Rage the way most people exhale. It is not a decision. It is a direction.",
    },
    'Elemental Cleaver': {
      definition: 'While raging, infuse your weapon with an elemental energy type. The fire variant extends your reach by 5 feet and adds fire damage on hit.',
      flavor: "He chose fire immediately and has been on fire — sometimes literally — ever since. The Stonebrand Tattoo pulses hot when it activates.",
      homebrew: true,
    },
    "Giant's Havoc": {
      definition: 'While raging, your size increases by one category, your reach extends 5 feet, and you deal bonus damage on every hit.',
      flavor: "This is how a 3'6\" halfling becomes a Large-category problem. The math checks out.",
    },
    'Extra Attack': {
      definition: 'When you take the Attack action, you can make two weapon attacks instead of one.',
      flavor: "He does not use this to be methodical. He uses it to be conclusive.",
    },
    'Danger Sense': {
      definition: 'Advantage on DEX saving throws against effects you can see, such as traps, spells, and breath weapons.',
      flavor: "He doesn't explain how he knows. He just knows. The party has learned to trust it.",
    },
    'Stonebrand Tattoo': {
      definition: 'A magical tattoo that channels elemental energy through the body, anchoring the Elemental Cleaver infusion and the power of Giant\'s Havoc.',
      flavor: "He carries his clan's mark in his skin. It flares hot when he Rages — a warmth from the mountains that followed him into the dark.",
      homebrew: true,
    },
  },

  'pc-bpop': {
    'Steel Defender — Mr. Cogsworth (AC 15)': {
      definition: 'A mechanical construct you create and bond with. AC 15, attacks as a bonus action, and uses its reaction to reduce damage taken by a nearby creature.',
      flavor: "Bpop would not describe this as a relationship. Bpop would be wrong. Third Watch proved it.",
      homebrew: true,
    },
    'Extra Attack': {
      definition: 'When you take the Attack action, you can make two weapon attacks instead of one.',
      flavor: "Bpop doesn't attack for sport. He attacks to solve a problem. Extra Attack means the problem gets solved twice.",
    },
    'Battle Ready': {
      definition: 'Use INT instead of STR/DEX for attack and damage with magic weapons. Add INT to initiative when not surprised.',
      flavor: "He is always the most prepared person in the room. Battle Ready is just the game confirming it.",
    },
    'Tool Expertise': {
      definition: 'Your proficiency bonus is doubled for any ability check made with a tool you are proficient with.',
      flavor: "He has worked with tools his whole life — first for others, now for himself. The doubled proficiency is the least of it.",
    },
    'Spell Sniper': {
      definition: 'Doubles the range of attack-roll spells, ignores half and three-quarters cover, and grants a bonus cantrip.',
      flavor: "Bpop fights from range when he can, up close when he has to, and calculates the difference before either. Spell Sniper is why the difference usually favors him.",
    },
    'Draconic Cry (3/Long Rest)': {
      definition: 'Bonus action: you and allies within 10 ft. gain advantage on attack rolls against a target of your choice until the start of your next turn.',
      flavor: "There is something in his voice from the years under the dragon — something that recognizes, from the inside, what fear looks like being manufactured.",
    },
    'Strike of the Giants (3/Long Rest)': {
      definition: 'When you hit with a weapon attack, invoke giant power to deal bonus damage and apply an additional effect based on giant type.',
      flavor: "He never apologizes for how he learned this. He never will.",
    },
  },

  'pc-iblith-gorch': {
    'Shadow Step (60 ft. teleport in dim light)': {
      definition: 'While in dim light or darkness, teleport up to 60 ft. to another dim or dark space you can see. Gain advantage on your first melee attack this turn.',
      flavor: "He doesn't cross the distance. He removes the distance.",
    },
    'Flurry of Blows': {
      definition: 'Spend 1 Focus Point as a bonus action to make two additional unarmed strikes.',
      flavor: "A round with Stunning Strike and Flurry is a round where someone goes down. Iblith calculates this in the moment of decision, not after.",
    },
    'Sentinel': {
      definition: 'When a creature within 5 ft. attacks someone other than you, make an opportunity attack. Creatures you hit with opportunity attacks have their speed reduced to 0.',
      flavor: "He doesn't let things leave on their terms.",
    },
    'Shadow Strike Mastery (reroll miss 1/SR)': {
      definition: 'Once per short rest, when you miss with an attack roll, you may reroll it and use the new result.',
      flavor: "He doesn't accept misses. He accepts renegotiation.",
      homebrew: true,
    },
    'Stunning Strike': {
      definition: 'After landing a hit, spend 1 Focus Point to force a CON save (DC 18) or the target is stunned until the start of your next turn.',
      flavor: "DC 18. That's not a check — that's a sentence.",
    },
    'Empowered Strikes (Force damage)': {
      definition: 'Your unarmed strikes count as magical and deal Force damage instead of bludgeoning.',
      flavor: "The force in his strikes doesn't come from anger. It comes from precision applied at the exact moment the target can't respond to it.",
    },
    'Extra Attack': {
      definition: 'When you take the Attack action, you can make two weapon attacks instead of one.',
      flavor: "He doesn't hit twice because he's angry. He hits twice because the first hit set the conditions for the second.",
    },
    'Slow Fall': {
      definition: 'As a reaction when you fall, reduce falling damage by 5 × your Monk level (30 at level 6).',
      flavor: "The monk who lands standing is the monk whose next move costs an opponent their turn.",
    },
    'Drow Magic — Faerie Fire / Darkness (1/LR)': {
      definition: 'Cast Faerie Fire and Darkness once each per long rest, using CHA as the spellcasting ability.',
      flavor: "Faerie Fire reveals. Darkness conceals. He uses them both exactly once per rest because he doesn't waste anything.",
    },
    'Focus Points: 6 / Short Rest': {
      definition: 'Your pool of ki for Stunning Strike, Flurry of Blows, and other monk abilities. Fully recharges on a short rest.',
      flavor: "He treats every Focus Point like it cost him something. Six points, short rest recovery. He has never gone into a fight thinking he has enough.",
    },
  },

  'pc-morrighan-bustlewing': {
    'Form of Dread (3/LR — temp HP, frighten on hit, immune to frightened)': {
      definition: 'Bonus action: transform for 1 minute. Gain 1d10+5 temp HP, frighten a creature you hit on a failed WIS save, and become immune to the frightened condition.',
      flavor: "Morrighan puts on Form of Dread the way others put on authority. It is less a transformation than a revelation.",
    },
    'Innate Sorcery (2/Long Rest)': {
      definition: 'Bonus action: your innate magic flares for 1 minute, granting advantage on spell attack rolls and disadvantage on enemy CON saves against your concentration spells.',
      flavor: "Her sorcery doesn't feel like reaching for power. It feels like power noticing that she has her hand out.",
    },
    'Pact of the Chain — Find Familiar': {
      definition: 'Your Find Familiar spell can summon unusual familiars. You may forgo your attack to have your familiar make an attack in your place.',
      flavor: "The familiar is an extension of intent. Morrighan's intentions are always interesting.",
    },
    'Agonizing Blast': {
      definition: 'Add your CHA modifier (+5) to the damage of each beam of Eldritch Blast.',
      flavor: "She does not raise her voice. Each beam does +5 damage. The two facts are related.",
    },
    "Devil's Sight": {
      definition: 'You can see normally in magical and nonmagical darkness out to 120 feet.',
      flavor: "Darkness, literal and otherwise, offers her no resistance. This is probably a feature, not a consequence.",
    },
    'Eldritch Mind': {
      definition: 'You have advantage on CON saving throws to maintain concentration on a spell.',
      flavor: "Her concentration does not break. Her attention is glacial in its patience and permanence.",
    },
    'Fiendish Vigor': {
      definition: 'Cast False Life at 1st level on yourself at will, gaining 1d4+4 temporary HP.',
      flavor: "She maintains a quiet inventory of herself. Temporary HP is just the accounting.",
    },
    'Fairy Magic — Faerie Fire / Enlarge·Reduce': {
      definition: 'Cast Faerie Fire and Enlarge/Reduce once each per long rest.',
      flavor: "The Court's oldest tricks. She uses them with the authority of someone who was never just her fairy magic.",
    },
    'Flight (30 ft.)': {
      definition: 'You have a 30 ft. flying speed.',
      flavor: "Not a shortcut. A perspective.",
    },
  },
};

// ─── Gear Tooltips ────────────────────────────────────────────────────────────

export const GEAR_TOOLTIPS: Record<string, CharacterTooltips> = {

  'pc-cannonball-kar-thul': {
    'Bloodrage Greataxe (+9, 1d12+8)': {
      definition: '+9 to hit, 1d12+8 slashing damage. Attuned to his rage state, growing in potency as fury builds.',
      flavor: "He didn't name it. He didn't need to. The axe knows what it is.",
      homebrew: true,
    },
    'Glaive': {
      definition: 'Martial polearm. 1d10 slashing damage. Reach 10 ft. Two-handed.',
      flavor: "He carries it as backup. It has been relevant more than once.",
    },
    'Handaxes': {
      definition: 'Light thrown martial weapons. 1d6 slashing, thrown range 20/60 ft.',
      flavor: "He throws them like punctuation at the end of a sentence he's already making with his body.",
    },
    'Intact Control Necklace (Command 1/LR)': {
      definition: 'Cast Command (1st level) once per long rest. The target must succeed on a WIS save or obey a one-word command on its next turn.',
      flavor: "Cannonball doesn't overthink this. He says the word and something happens. That's how most things work for him.",
      homebrew: true,
    },
    'Bear Clan Cloak': {
      definition: 'A fur cloak from the Bear Clan peaks bearing protective enchantments, including cold resistance.',
      flavor: "He wears his origins on his back, literally. The mountains follow him.",
      homebrew: true,
    },
    "Cat's Eye Agate Necklace": {
      definition: 'A polished agate necklace with minor divination properties, providing resistance to surprise and certain detection effects.',
      flavor: "He found it. He kept it. It hasn't gotten him killed yet.",
      homebrew: true,
    },
    'Muggy (the Cursed Mug)': {
      definition: 'A dwarven mug with a carved face carrying an unknown enchantment and a persistent, opinionated grudge.',
      flavor: "He found it, named it, and strapped it to his chest within the same hour. When asked about the curse, Cannonball shrugs. In his experience, most relationships have some curse attached.",
      homebrew: true,
    },
  },

  'pc-bpop': {
    'Fire Sword — Flame Tongue Greatsword': {
      definition: 'Command word activates a flaming blade, adding 2d6 fire damage on hit. Functions as a greatsword (2d6 slashing) when unlit.',
      flavor: "Bpop didn't choose it for the dramatics. He chose it because fire closes arguments efficiently.",
      homebrew: true,
    },
    'Returning Boomerang': {
      definition: 'A magical thrown weapon that returns to the thrower\'s hand after each attack.',
      flavor: "Range and efficiency. He appreciates both.",
    },
    'Heavy Crossbow': {
      definition: 'Martial ranged weapon. 1d10 piercing, range 100/400 ft. Two-handed.',
      flavor: "The crossbow is for when distance is the right answer. Bpop knows when distance is the right answer.",
    },
    'Stone Whisper Axe': {
      definition: 'A battleaxe infused with stone giant magic that whispers structural weaknesses in targets, dealing bonus damage against constructs and objects.',
      flavor: "From the giants who raised him, though 'raised' is doing some work in that sentence.",
      homebrew: true,
    },
    'Polished Amulet (Attuned)': {
      definition: 'An attuned amulet providing a passive AC bonus and minor protective enchantments.',
      flavor: "Bpop catalogued its properties within the first day. He wears it for the numbers, not the aesthetics.",
      homebrew: true,
    },
  },

  'pc-iblith-gorch': {
    'Hat of Disguise (Attuned — gift from Jarlaxle)': {
      definition: 'Cast Disguise Self at will while wearing and attuned to this hat.',
      flavor: "The only item in his possession that represents someone else's decision about his value. He uses it constantly. He doesn't like that he needs it.",
    },
    'Whispercoil Mk II: Silencium Crownset (+8, 1d6+5)': {
      definition: '+8 to hit, 1d6+5 damage. On a hit, the target must make a CON save or lose the ability to cast spells with verbal components until the start of its next turn.',
      flavor: "He removed the target's voice so it couldn't name what was happening. This is very Iblith.",
      homebrew: true,
    },
    'Hand Wraps of Sapping Strikes': {
      definition: 'Magical hand wraps whose strikes reduce the target\'s next attack roll by 1d4.',
      flavor: "He doesn't just hit you. He takes something from you when he does.",
      homebrew: true,
    },
    'Amulet of Perfect Focus (Attuned)': {
      definition: '+1 to Focus Point save DCs and recovery of 1 additional Focus Point per short rest.',
      flavor: "DC 18 Stunning Strike. The amulet is why you don't make that save.",
      homebrew: true,
    },
    "Sash of Wind's Grace (Attuned)": {
      definition: 'Grants +5 ft. speed and reduces Stealth penalties from moving at full speed.',
      flavor: "55 ft. speed. The sash is why the math adds up to that.",
      homebrew: true,
    },
    'Robe of Central Security': {
      definition: '+1 AC and advantage on saving throws against effects that would move you against your will.',
      flavor: "He doesn't like being grabbed. The robe agrees.",
      homebrew: true,
    },
    'Bag of Holding': {
      definition: 'Extradimensional space holding up to 500 lbs. and 64 cubic ft. of material.',
      flavor: "He knows what's in it. He always knows what's in it.",
    },
  },

  'pc-morrighan-bustlewing': {
    'Morthar (thrown weapon, +8, 1d8 piercing)': {
      definition: '+8 to hit, 1d8 piercing damage. Returns after each attack. Deals bonus necrotic damage on hit.',
      flavor: "She named it. The weapon feels considered. So does everything about how she fights.",
      homebrew: true,
    },
    'Ring of Dual Arcana (Attuned)': {
      definition: 'Treats Warlock and Sorcerer as a single class for multiclass spell slot calculation, preventing energy bleed between the two power sources.',
      flavor: "Two power systems in the same body, drawn from two incompatible sources. The ring is what keeps the channels from crossing. It is very important.",
      homebrew: true,
    },
    'Brooch of Winged Fey Grace (Attuned)': {
      definition: 'Increases flying speed by 10 ft. and grants advantage on DEX saving throws while airborne.',
      flavor: "She flies the way she does everything — precisely, and slightly above where anyone expected her to be.",
      homebrew: true,
    },
    'Insight Charm': {
      definition: 'Grants advantage on Insight checks once per short rest.',
      flavor: "She asks the charm for confirmation. She already knows.",
      homebrew: true,
    },
    'Glimmershade Seedling': {
      definition: 'A cutting from a Feywild plant of the Shadowglade with latent magical properties not yet fully manifested.',
      flavor: "It hasn't bloomed yet. She is patient.",
      homebrew: true,
    },
    'Medium Crystal Shard ×2': {
      definition: 'A medium-grade arcane focus for Sorcerer spellcasting.',
      flavor: "Standard issue for someone running two arcane systems simultaneously on what amounts to borrowed time.",
    },
  },
};
