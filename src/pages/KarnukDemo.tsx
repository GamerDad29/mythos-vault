import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronRight, X, Hammer, Anchor, Gem, Mountain, Cpu, Eye } from 'lucide-react';

// ─── PALETTE ───────────────────────────────────────────────────────────────────
const C = {
  ironHammer:    '#d4af37',
  deepstone:     '#a0a0a0',
  brotherForge:  '#9370DB',
  ironMine:      '#708090',
  steelSyndicate:'#00CED1',
  bregan:        '#7B68EE',
  ironOrder:     '#888888',
  viceroy:       '#C9A84C',
};

// ─── FACTION DATA ──────────────────────────────────────────────────────────────
const FACTIONS = [
  {
    id: 'iron-hammer',
    name: 'Iron Hammer Clan',
    label: 'THE OLD GUARD',
    race: 'Dwarves',
    leader: 'Don Thorgar Ironhammer',
    territory: 'The Anvil Quarter',
    color: C.ironHammer,
    motto: '"The Family that built this town."',
    tagline: 'Old money. Honorable to a fault. Fading, but not fallen.',
    icon: Hammer,
    overview: `Three hundred years ago, Thorgar Ironhammer's grandfather drove the first foundation stone into the cavern floor and declared it a city. Every contract signed in Karnuk since that day has Ironhammer ink on the original. Their word is the only currency that hasn't been debased. That's both their greatest strength and the reason they're losing.`,
    leadership: [
      { name: 'Don Thorgar Ironhammer', role: 'Patriarch', age: '487 years', note: 'White-bearded, forge-scarred, missing three fingers from the Thousand Year War. Wears a simple leather apron over mithral chain. His hammer Oathkeeper has not been drawn since the war ended — he swore it. He keeps his oaths.' },
      { name: 'Borin "The Ledger"', role: 'Underboss', age: '112 years', note: 'Thorgar\'s grandson. Calculating, pragmatic, quietly resentful. Handles day-to-day accounts and contract enforcement. Has been taking private meetings with Steel Syndicate representatives for six weeks.' },
      { name: 'Merra Ashforge', role: 'Production Capo', age: '340 years', note: 'Stern perfectionist who personally inspects every piece bearing the clan mark. Absolute loyalty to Thorgar and the old ways.' },
      { name: 'Kragath "Hammerfall"', role: 'Enforcer', age: '290 years', note: 'Polite, almost apologetic. Breaks kneecaps with surgical precision. "Nothing personal, just business." Never kills unless Thorgar orders it in writing.' },
    ],
    culture: 'New members swear oaths over Thorgar\'s anvil with a hand on hot iron. Monthly Remembrance Forges craft weapons for the fallen. Removing gloves to show scarred palms is the sign of respect. Breaking your word is not a business dispute. It is a death sentence.',
    currentThreat: 'Steel Syndicate is systematically buying Ironhammer properties at below-value. Three warehouses already gone. Borin is considering a deal — or worse, a coup. Thorgar refuses to see it.',
    relationships: [
      { name: 'Steel Syndicate', status: 'Active conflict', note: 'Syndicate buying their properties. Thorgar calls Kethar "a child playing with fire."' },
      { name: 'Bregan D\'aerthe', status: 'Respectful distance', note: 'Thorgar distrusts them but acknowledges their usefulness. Borin is secretly courting them.' },
      { name: 'Iron Order', status: 'Deep respect', note: 'One of only two families that genuinely honors the Order rather than simply fearing them.' },
    ],
  },
  {
    id: 'deepstone',
    name: 'Deepstone Miners',
    label: 'THE MUSCLE',
    race: 'Hobgoblins',
    leader: 'Don Grommash Stonefist',
    territory: 'Dockside / The Kettle',
    color: C.deepstone,
    motto: '"You don\'t move a crate in Karnuk without our say-so."',
    tagline: 'They run the docks, control all labor, and know the city stops breathing without them.',
    icon: Anchor,
    overview: `Twenty-three piers. Forty-three warehouses. Every barge, every ferry, every skiff of cargo that touches Karnuk passes through Grommash Stonefist's hands. He didn't build this city. He built what makes it run. The other families can argue about prestige and politics all they want — the Miners decide whether those arguments get fed.`,
    leadership: [
      { name: 'Don Grommash Stonefist', role: 'Boss', age: '52 years', note: 'Massive hobgoblin with iron-gray skin and a jaw like an anvil. Steel gauntlets reportedly fused to his fists. Missing his right ear from a tavern fight he won anyway. Direct, loud, and surprisingly fair.' },
      { name: '"Mother" Vrekka Stonefist', role: 'Logistics Chief', age: '48 years', note: 'The real brains of the operation. Oil-stained leathers, always smoking a pipe. Runs a competing information network that makes Bregan D\'aerthe quietly uncomfortable. Her methodology: "We don\'t threaten. We just stop loading your shipments. Permanently."' },
      { name: 'Throk "The Hook"', role: 'Dockside Capo', age: '35 years', note: 'Jovial giant who laughs while cracking skulls. Carries a longshoreman\'s cargo hook as his primary weapon. Coordinates all smuggling through the lower docks.' },
      { name: 'The Breakers', role: 'Enforcer Squad', age: 'Various', note: 'Six-man squad: Skarn, Drokka, Vesh, Morgul, Thrax, Rekka. Dock-brawl veterans who specialize in workplace accidents. Each keeps a tally of problems solved tattooed on their forearms.' },
    ],
    culture: 'The Stonefist Salute — fist to heart, then forehead — is used among all dock workers regardless of family affiliation. Monthly union meetings at Grinder\'s Rest are mandatory and treated as sacred. Grommash pays the guild dues of orphaned miners\' children personally.',
    currentThreat: 'Steel Syndicate mechs are encroaching on dock operations. Warehouse 7 is actively contested — both families have operatives inside. Mother Vrekka is planning counter-operations. Grommash doesn\'t know his nephew Krev is on the Syndicate payroll.',
    relationships: [
      { name: 'Steel Syndicate', status: 'Escalating conflict', note: 'Warehouse 7 is the flashpoint. Syndicate mechs threatening dock workers.' },
      { name: 'Bregan D\'aerthe', status: 'Business arrangement', note: 'Uneasy truce between Mother Vrekka\'s intel network and Jevan\'s. Dock access granted in exchange for information.' },
      { name: 'Iron Hammer Clan', status: 'Grudging respect', note: 'Both old-guard. Different methods. Grommash respects Thorgar\'s code even if he thinks it\'s obsolete.' },
    ],
  },
  {
    id: 'brotherhood-forge',
    name: 'Brotherhood of the Forge',
    label: 'THE ARTISTS',
    race: 'Drow',
    leader: 'Don Azrael, "The Spider"',
    territory: 'Artisan\'s Row',
    color: C.brotherForge,
    motto: '"Perfection has a price. Beauty has a higher one."',
    tagline: 'Brilliant, aloof, and quietly devastating. They make the finest things in Karnuk and the most dangerous enemies.',
    icon: Gem,
    overview: `Their Cathedral-Workshop is equal parts masterwork atelier and fortress. Azrael's Brotherhood controls Karnuk's high-end market with a grip so elegant most clients don't realize they're in a chokehold until they try to leave. Three Bregan D'aerthe agents have been found dead in the past year. No arrests. No witnesses. No discernible pattern. Jevan Alderleaf considers this both personally offensive and professionally impressive.`,
    leadership: [
      { name: 'Don Azrael, "The Spider"', role: 'Patriarch', age: 'Unknown (ancient)', note: 'Ancient drow of indeterminate age. Moves through the Cathedral-Workshop like a shadow through expensive silk. Has never raised his voice. Has never needed to. Clients leave with either exactly what they came for — or an understanding of why they should not have come at all.' },
      { name: 'Velith "The Needle"', role: 'Master Artisan', age: '~300 years', note: 'Azrael\'s right hand and the Brotherhood\'s most technically gifted smith. Specializes in weapons with enchantments so refined they\'re invisible until activated.' },
    ],
    culture: 'Every piece bearing the Brotherhood mark is a contract — the quality of the work is Azrael\'s personal guarantee. Clients who complain about Brotherhood craftsmanship are invited to demonstrate what, specifically, they find lacking. They rarely accept the invitation.',
    currentThreat: 'Systematically eliminating rival master artisans across all five families. Three confirmed, more suspected. The escalation is deliberate. Azrael is consolidating the high-end market.',
    relationships: [
      { name: 'Bregan D\'aerthe', status: 'Dangerous dance', note: 'Azrael and Jevan play chess with other people\'s lives. Mutual professional respect. Active hostility beneath the surface.' },
      { name: 'Steel Syndicate', status: 'Targeted tension', note: 'Syndicate recruiting Brotherhood artisans with resource promises. Two have defected. Azrael hasn\'t responded yet.' },
      { name: 'All Families', status: 'Arms dealer', note: 'The Brotherhood takes commissions from everyone. This is not loyalty. This is leverage.' },
    ],
  },
  {
    id: 'iron-mine',
    name: 'Brotherhood of Iron Mine',
    label: 'THE DEEP OPERATORS',
    race: 'Duergar',
    leader: '"The Iron Lord" — identity unknown',
    territory: 'The Deep Tunnels',
    color: C.ironMine,
    motto: '"We don\'t need to be seen to win."',
    tagline: 'The city\'s silent bankers. They own the debts. They own the future.',
    icon: Mountain,
    overview: `Nobody has seen the Iron Lord. Bregan D'aerthe — the city's most comprehensive intelligence operation — has no confirmed identity, no photograph, no reliable description. What they have is a growing file of financial transactions showing that the Brotherhood of Iron Mine quietly owns the outstanding obligations of every other family in Karnuk. They didn't win the power game. They just bought it on installment.`,
    leadership: [
      { name: '"The Iron Lord"', role: 'Unknown', age: 'Unknown', note: 'Possibly not a single individual. Bregan\'s analysts suspect a council structure with rotating spokespeople. The name may be a title. Nobody who has pressed this question has filed a subsequent report.' },
    ],
    culture: 'Communication arrives through intermediaries. Agreements are formalized in documents with no signatures — only seals. Payment is always exact, always on time. The Brotherhood of Iron Mine has never defaulted on an obligation. They\'ve also never forgiven one.',
    currentThreat: 'Acquiring the debt portfolios of all five families simultaneously. When all debts come due, the Iron Lord calls the question. No timeline is known. No contingency is adequate.',
    relationships: [
      { name: 'All Families', status: 'Silent creditor', note: 'Each family believes their relationship with the Iron Mine is unique and private. None of them know the others are equally exposed.' },
      { name: 'Bregan D\'aerthe', status: 'Intelligence gap', note: 'The one organization that genuinely frustrates Jevan Alderleaf. Complete information blackout.' },
    ],
  },
  {
    id: 'steel-syndicate',
    name: 'Steel Syndicate',
    label: 'THE NEW BLOOD',
    race: 'Bugbears',
    leader: 'Don Kethar Steelheart',
    territory: 'The Syndicate Spire',
    color: C.steelSyndicate,
    motto: '"The future belongs to those who build it."',
    tagline: '34 years old. Already winning. Making enemies faster than allies. Doesn\'t care.',
    icon: Cpu,
    overview: `Kethar Steelheart killed the previous Steel Syndicate boss in a coup at age 28. He lost his right tusk in the fight. He replaced his left arm with a mechanical prosthetic he designed himself. The missing tusk and the mechanical arm are not accidents — they are statements. This is a man who will discard any part of himself that isn't useful and replace it with something better. The old families call him dangerous. They're right, but they're missing the more important point: he's also right.`,
    leadership: [
      { name: 'Don Kethar Steelheart', role: 'Boss', age: '34 years', note: 'Missing right tusk from the coup that elevated him. Left arm is a mechanical prosthetic, custom-built. Wears armor with riveted plates and visible gears — not for function, for message. Obsessed with war-mechs. Ruthless, innovative, impatient.' },
      { name: 'Veysha "Geargrind"', role: 'R&D Chief', age: '41 years', note: 'Bugbear female covered in burn scars. Missing several fingers, replaced with tools. Genuine mad scientist energy — giggles when experiments fail, takes notes, tries again. Loyal to innovation before Kethar.' },
      { name: 'Thrak "Ironjaw"', role: 'Muscle Capo', age: '28 years', note: 'Lost his original jaw to acid in a territorial dispute. The replacement is solid iron. Loves violence with the uncomplicated enthusiasm of someone who is very, very good at it.' },
      { name: 'Shadow Advisor', role: 'Planted Agent', age: 'Unknown', note: 'Shadowed Parliament asset feeding resources and intelligence to Kethar. Neither Kethar nor the Parliament fully grasps the other\'s complete game. This will matter.' },
    ],
    culture: 'The Spark headquarters runs all hours, music playing, arc-lights blazing. No reverence for tradition. No patience for process. If it works, keep it. If it doesn\'t, burn it and try the next version.',
    currentThreat: 'Aggressive buyouts of Ironhammer properties. Warehouse 7 standoff with Deepstone. Recruiting Brotherhood artisans. Has unknown Parliament backing that is not a gift — it is a leash he doesn\'t know he\'s wearing.',
    relationships: [
      { name: 'Iron Hammer Clan', status: 'Systematic acquisition', note: 'Buying their properties below value. Patience is the weapon.' },
      { name: 'Deepstone Miners', status: 'Escalating conflict', note: 'Warehouse 7 is the current flashpoint. Syndicate mechs directly threatening Deepstone dock operations.' },
      { name: 'Bregan D\'aerthe', status: 'Kethar thinks he\'s using them', note: 'Jevan is feeding him rope. Kethar thinks it\'s a gift.' },
    ],
  },
  {
    id: 'bregan',
    name: "Bregan D'aerthe",
    label: 'THE SHADOW BROKERS',
    race: "Drow — Jarlaxle's Company",
    leader: 'Captain Jevan Alderleaf',
    territory: 'The Neutral Quarter',
    color: C.bregan,
    motto: '"We don\'t pick sides. We make sure there are always sides to pick."',
    tagline: 'Officially neutral. Practically indispensable. Chaos is their product.',
    icon: Eye,
    overview: `Bregan D'aerthe doesn't control Karnuk. They just make sure nobody else can either. Jevan Alderleaf sells intelligence to all five families — never enough to end any conflict, always enough to keep everyone at the table and spending. The Jarlaxle Doctrine is simple: a city at war with itself makes them rich. A city destroyed makes them homeless. When Bregan is in the room, everybody's winning except the people who think they're winning.`,
    leadership: [
      { name: 'Captain Jevan Alderleaf', role: 'Karnuk Commander', age: '187 years', note: 'Slim drow in clothing that shifts between guild colors depending on who he\'s meeting. Silver hair in complex braids. Wears rings from all five families — gifts or trophies, he won\'t say. Has never drawn his rapier in public. Speaks in riddles. Treats violence as vulgar but necessary. "I prefer words to daggers, but I\'m fluent in both."' },
      { name: 'Lieutenant Veyran Veyth', role: 'Field Operations / Iblith\'s Handler', age: '201 years', note: 'Nondescript drow, master of disguise, face you forget immediately. Unusually kind to operatives. Believes in developing long-term assets rather than burning disposable ones. Recruited Iblith. Sees potential beyond simple work.' },
      { name: 'Master Scout Talvrae Darkwhisper', role: 'Intelligence Chief', age: '245 years', note: 'Paranoid, brilliant, never leaves the Bregan safehouse. Runs an informant network inside all five families simultaneously. Knows Karnuk\'s secrets before their own leadership does.' },
      { name: 'Kethris "The Diplomat"', role: 'Enforcer', age: '134 years', note: 'Massive drow, 6\'4", heavily scarred, missing one eye. Wears diplomat\'s robes over armor. Polite, apologetic, brutally efficient. "I\'m very sorry about this. But you\'ve left me no choice."' },
    ],
    culture: 'The Bregan Obsidian Coin is proof of membership. Code phrases change weekly. The Accounting — monthly intelligence reports — is mandatory. Blood Debt is absolute: if a Bregan member is killed, the organization takes vengeance. Always. The Unmarking erases failed agents from Bregan\'s records and memory entirely.',
    currentThreat: 'Jevan\'s delicate balance is being undermined by Garruk Bloodaxe feeding resources to Steel Syndicate. Jevan doesn\'t know Bloodaxe is the source. His balancing act is working on false information.',
    relationships: [
      { name: 'All Five Families', status: 'Controlled tension', note: 'Sells information to everyone. Ensures no one achieves total dominance. Profitable instability is the product.' },
      { name: 'Brotherhood of the Forge', status: 'Dangerous respect', note: 'Three Bregan agents dead. Azrael\'s doing. Jevan hasn\'t responded because he hasn\'t figured out how to respond to elegance with elegance yet.' },
      { name: 'Steel Syndicate', status: 'Feeding rope', note: 'Kethar thinks Bregan is working for him. Jevan finds this charming.' },
    ],
  },
];

// ─── NPC DATA ──────────────────────────────────────────────────────────────────
const KEY_NPCS = [
  {
    name: 'Vorgoth the Ironclad',
    title: 'Viceroy of Karnuk',
    color: C.viceroy,
    quote: '"He doesn\'t need to be loved. He just needs forty-three war-mechs and the families\' shared arithmetic of self-preservation."',
    hook: 'Holds the balance between five criminal dynasties through mechanical force. Not through wisdom, not through charm — through the cold math of what happens if you move against him.',
    appearance: 'A half-orc in his late fifties with a body that still looks built for war. Wears ceremonial armor that hasn\'t been ceremonial in years — the dents are real. Eyes like forge coals, jaw like a portcullis.',
    personality: 'Pragmatic, unhurried, and more intelligent than people expect from the man who just happens to control all forty-three war-mechs. Doesn\'t raise his voice. Doesn\'t need to.',
    motivation: 'Keep the city functional. Keep the families in check. Retire before one of them figures out how to take the mechs.',
    background: 'Former Ironhammer Clan mercenary who proved so capable at enforcement that Ironhammer sponsored his appointment as Viceroy twenty years ago. They still think that makes him theirs. It doesn\'t.',
    plotHooks: ['The party needs Vorgoth\'s authorization for something no family will grant.', 'He privately approaches the party — he needs a problem solved that he can\'t let the families see him solve.', 'One of the war-mechs has started behaving erratically. Vorgoth doesn\'t know why. He needs people who can investigate without the families finding out there\'s a vulnerability.'],
    connections: ['Iron Order — direct command', 'All Five Families — grudging acceptance', 'Garruk Bloodaxe — unknown threat'],
  },
  {
    name: 'Jevan Alderleaf',
    title: "Captain, Bregan D'aerthe",
    color: C.bregan,
    quote: '"Killing you would be wasteful. Employing you is profitable. I\'d encourage you to notice the difference."',
    hook: 'Wears rings from all five families. Has never drawn his rapier in public. Speaks in riddles and leaves rooms knowing more than he arrived with.',
    appearance: 'Slim drow with silver hair in complex braids. Clothing that shifts between guild colors depending on who he\'s meeting — never by accident. Carries an ornate rapier at his hip. The rings: five, one from each family, worn openly because the families each think their ring is a private symbol of alliance.',
    personality: 'Charming, witty, and operating three conversations at once. Treats directness as a sign of limited vocabulary. Finds violence vulgar but employs it with surgical precision when words have reached their limit.',
    motivation: 'Maintain profitable instability in Karnuk. Prove himself worthy of a meeting with Jarlaxle himself, which he has never had. Build something Jarlaxle can\'t afford to lose.',
    background: 'Assigned to Karnuk forty years ago as a junior operative. Worked his way to captain through a combination of excellent tradecraft and the subtle elimination of everyone who stood between him and the position.',
    plotHooks: ['Jevan approaches Iblith with a mission that tests loyalty against morality.', 'He offers the party something they need — at a price they don\'t understand yet.', 'Something has disrupted the city\'s balance in ways Jevan can\'t trace. He needs outside eyes.'],
    connections: ['All Five Families — informant networks inside each', 'Veyran Veyth — lieutenant and field handler', 'Jarlaxle Baenre — reports to, has never met'],
  },
  {
    name: 'Don Thorgar Ironhammer',
    title: 'Iron Hammer Patriarch',
    color: C.ironHammer,
    quote: '"My word is iron. My patience is not."',
    hook: '487 years old. Missing three fingers on his left hand from the Thousand Year War. His hammer Oathkeeper hasn\'t been drawn since the war ended — he swore it. He keeps his oaths.',
    appearance: 'White-bearded dwarf with forge-scarred arms and the kind of stillness that comes from having been the most dangerous person in every room for four centuries. Wears a simple leather apron over mithral chain. The missing fingers are visible. He doesn\'t hide them.',
    personality: 'Gruff, honorable to a fault, deeply traditional. Believes contracts written in blood are the only contracts worth making. Despises shortcuts. Calls Steel Syndicate "children playing with fire" — not as an insult, as a diagnosis.',
    motivation: 'Preserve dwarven codes. Ensure the family legacy outlives him. Prevent Karnuk from becoming "just another pit of greed."',
    background: 'Fought in the Thousand Year War as a young dwarf. Returned to help rebuild Karnuk when his grandfather\'s company still held controlling interest in the city. Has watched the city change around him without changing himself, which he considers a virtue.',
    plotHooks: ['He needs someone to investigate rumors of Borin\'s meetings — he won\'t believe it from anyone he trusts.', 'Thorgar wants to hire outside muscle for something he can\'t trust to family.', 'He holds information the party needs, but will only give it in exchange for something that tests their honor.'],
    connections: ['Borin Ironhammer — grandson, underboss, potential betrayer', 'Steel Syndicate — existential threat', 'Iron Order — deep mutual respect'],
  },
  {
    name: 'Don Grommash Stonefist',
    title: 'Deepstone Boss',
    color: C.deepstone,
    quote: '"I don\'t lie, I don\'t cheat, and I WILL break your arms if you cross me. I consider that fair."',
    hook: 'Steel gauntlets rumored fused to his fists. Missing his right ear. Fiercely loyal to his people — and his nephew Krev is incompetent, which he refuses to see.',
    appearance: 'Massive hobgoblin with iron-gray skin. The jaw looks like it was carved from the same stone as the docks he controls. Both fists permanently encased in spiked steel gauntlets. Wears dock-worker overalls over armor, which is either an affectation or a statement. Both.',
    personality: 'Direct, loud, and surprisingly fair. Rules by fear and respect equally. The kind of man who will tell you exactly what he\'s going to do to you before he does it, because lying about it would be dishonorable.',
    motivation: 'Protect his workers. Control Karnuk\'s commercial lifeblood. Eventually overthrow Vorgoth and install something closer to a workers\' council — which he knows is idealistic and does not particularly care.',
    background: 'Fought his way up through the dock ranks over twenty years. Was never given anything. Respects the same in others. Became Boss when the previous Deepstone leader died of natural causes — which Grommash will confirm, without elaboration, was the natural consequence of trying to betray the union.',
    plotHooks: ['Nephew Krev has done something stupid that Grommash can\'t fix himself without losing face.', 'He needs the party to handle the Warehouse 7 situation quietly.', 'A legitimate threat to dock workers needs outside help he won\'t accept from other families.'],
    connections: ['Mother Vrekka — logistics chief, true operational brain', 'Steel Syndicate — active conflict', 'Deepstone workers — fiercely protective'],
  },
  {
    name: 'Azrael, "The Spider"',
    title: 'Brotherhood of the Forge Don',
    color: C.brotherForge,
    quote: '"Every beautiful thing is also a weapon. I simply prefer mine to be ornamental first."',
    hook: 'Has killed three Bregan D\'aerthe agents. No arrests. No witnesses. Jevan Alderleaf considers this personally offensive and professionally impressive.',
    appearance: 'An ancient drow whose age shows only in the depth of his eyes and the absolute economy of his movements. Dressed in clothes that are worth more than most people make in a year. Never wears weapons visibly. Moves through the Cathedral-Workshop like it is an extension of his body.',
    personality: 'Refined, precise, lethal in the way that a perfectly made blade is lethal — not despite its elegance but because of it. Speaks rarely and always with complete sentences. Has no small talk.',
    motivation: 'Achieve monopoly over Karnuk\'s high-end artisan market. Prove the Brotherhood\'s supremacy is permanent, not contingent. Leave something in this city that will outlast every family currently occupying it.',
    background: 'Arrived in Karnuk two centuries ago as a young smith with exceptional talent and extraordinary patience. Built the Brotherhood piece by piece, commission by commission, until the alternative to buying from him became clear enough that no one needed to be told what it was.',
    plotHooks: ['He approaches the party — he wants a commission of unusual nature.', 'Something Brotherhood-made has been used in a crime. Azrael wants to know who, before Vorgoth does.', 'The party discovers one of the three dead Bregan agents had information about Azrael that didn\'t die with them.'],
    connections: ['All families — arms dealer neutrality', 'Bregan D\'aerthe — three dead agents, active cold war', 'Velith "The Needle" — most gifted artisan in the Brotherhood'],
  },
  {
    name: 'Don Kethar Steelheart',
    title: 'Steel Syndicate Boss',
    color: C.steelSyndicate,
    quote: '"The old families are corpses that don\'t know they\'re dead. I\'m not being cruel. I\'m being accurate."',
    hook: '34 years old with a mechanical prosthetic arm he designed and built himself. Missing his right tusk. Already winning.',
    appearance: 'Young bugbear with the coiled energy of someone who never stops thinking about the next move. Missing right tusk — took it in the coup that elevated him. Left arm is a fully mechanical prosthetic with visible articulation and a faint hum. His armor is modern: precision-riveted plates with integrated gear mechanisms. The look is not an accident.',
    personality: 'Ruthless, innovative, and genuinely impatient with things that can\'t keep up with him. Despises tradition with the specific contempt of someone who studied the old ways carefully before deciding they were obstacles. Makes enemies faster than allies. Doesn\'t appear to have noticed.',
    motivation: 'Control Karnuk\'s future through technological dominance. Build a mech army loyal only to him. Prove that the old guard\'s time is over — and that he\'s the one who ended it.',
    background: 'Grew up in the Steel Syndicate under a boss who thought ambition was manageable. He was wrong. Kethar spent four years building loyal relationships, documenting weaknesses, and waiting for exactly the right moment. The coup took eleven minutes.',
    plotHooks: ['He wants to hire the party as independent contractors for something he can\'t use Syndicate personnel for.', 'The Shadowed Parliament plant approaches the party directly — they want the party to undermine Kethar\'s operation before he\'s too powerful to contain.', 'Something in the Mechworks Plaza has gone wrong in a way that threatens the whole city.'],
    connections: ['Veysha "Geargrind" — R&D chief, more loyal to innovation than Kethar', 'Shadowed Parliament — unknown patron/handler', 'Iron Hammer Clan — acquisition target'],
  },
  {
    name: 'Mother Vrekka',
    title: 'Deepstone Logistics Chief',
    color: C.deepstone,
    quote: '"We don\'t threaten. We just... stop loading your shipments. Permanently."',
    hook: 'The actual operational brain of Deepstone. Runs a competing intelligence network that makes Bregan D\'aerthe quietly uncomfortable.',
    appearance: 'Scarred hobgoblin woman in oil-stained leathers. Always smoking a pipe — not for the nicotine, for the thinking time between sentences. Hair kept short for practical reasons. Eyes that have seen everything and filed it.',
    personality: 'Cold, methodical, and terrifyingly competent. Where Grommash rules by presence, Vrekka rules by information. Knows what every shipment contains, who it belongs to, and what leverage it represents.',
    motivation: 'Keep Deepstone operationally dominant regardless of what the other families do. Protect the dock workers. Ensure that when the inevitable major conflict comes, Deepstone is the last family standing.',
    background: 'Started as a dock scheduler thirty years ago. Has held effectively every logistics position in the Miners before becoming Grommash\'s second. Built the intelligence network herself, from nothing, while Grommash believed she was just very good at her official job.',
    plotHooks: ['She has information the party needs and will trade it for operational assistance.', 'Vrekka has identified the Krev problem and needs outside help fixing it before Grommash finds out.', 'Her intelligence network has picked up something about one of the party members she wants to discuss — privately.'],
    connections: ['Grommash Stonefist — Boss, loyal to, protects from himself when necessary', 'Throk "The Hook" — field operations', 'Bregan D\'aerthe — uneasy informational standoff'],
  },
  {
    name: 'Borin "The Ledger"',
    title: 'Iron Hammer Underboss',
    color: C.ironHammer,
    quote: '"Grandfather built Karnuk\'s past. I intend to build its future."',
    hook: 'Thorgar\'s grandson. Has been taking private meetings with Steel Syndicate for six weeks. Considering a coup he hasn\'t yet committed to.',
    appearance: 'Stocky dwarf of 112 who could pass for a human accountant if not for the forge calluses. Keeps meticulous ledgers — not just of finances, but of everything. Favors neutral clothing that doesn\'t advertise family affiliation more than necessary.',
    personality: 'Calculating and pragmatic in ways that his grandfather\'s generation would recognize as dangerous. Genuinely loves the Iron Hammer Clan but has come to believe that Thorgar\'s stubbornness is the clan\'s terminal condition.',
    motivation: 'Save the family from Thorgar\'s inability to modernize — even if saving it requires removing Thorgar from the equation.',
    background: 'Has spent forty years watching Ironhammer territory shrink while Thorgar refuses every compromise, every adaptation, every acknowledgment that the world has changed. He has spent the last six weeks trying to decide if he\'s a pragmatist or a traitor. He hasn\'t decided yet.',
    plotHooks: ['He approaches the party to help him approach Steel Syndicate without Thorgar finding out.', 'He discovers the party knows about his meetings and needs to ensure their silence.', 'Thorgar asks the party to find out who his grandson has been meeting with.'],
    connections: ['Don Thorgar Ironhammer — grandfather, Boss, potential target', 'Steel Syndicate — secret negotiations', 'Merra Ashforge — loyal to Thorgar, doesn\'t trust Borin'],
  },
];

// ─── LEGEND DATA ───────────────────────────────────────────────────────────────
const LEGEND_GROUPS = [
  {
    theme: 'The Masks',
    note: 'What the Iron Order\'s masks are — and what they do to the men inside them.',
    legends: [
      '"Those masks aren\'t armor — they\'re their faces. Once you put it on, it fuses. No one\'s ever seen an Iron Order man unmasked. Not even when they die."',
      '"The masks don\'t hide faces. They hide nothing. Inside there\'s only smoke and echo."',
      '"If you look too long into the mask\'s runes, you\'ll see your own crimes written back at you. Every one of them."',
      '"The masks glow brighter when danger comes. That\'s when you run. Before you can think about it. Before your legs catch up with what your eyes have seen."',
    ],
  },
  {
    theme: 'Their Loyalty',
    note: 'On the Iron Order\'s incorruptibility — and what that cost means in a city built on transaction.',
    legends: [
      '"No one has bribed them in over five centuries. They\'ve executed their own cousins for trying. Not the cousin who offered the bribe. The cousin who stood there and watched it happen."',
      '"They say Vorgoth doesn\'t command them. He asks. And if he asks for the wrong thing, they\'ll tell him. Once."',
      '"Each Phalanx is four different bloodlines — hobgoblin, duergar, drow, bugbear — so no one family can claim them as kin. That was by design. That was always by design."',
      '"The Iron Order were the first militia, back when Karnuk was a camp of exiles. They never left. Every other power structure in this city came after them. They\'re still here."',
    ],
  },
  {
    theme: 'Their Power',
    note: 'On what the Iron Order can do — and what the war-mechs do when the Order walks past.',
    legends: [
      '"When they walk, the mechs stand taller. It\'s like the machines bow to them. I don\'t know what that means. I don\'t want to know what that means."',
      '"Their weapons aren\'t forged. They\'re grown from the city\'s embersteel veins. That\'s why they hum like living things. Because they are."',
      '"Don\'t fight them in alleys. The shadows belong to them. Don\'t fight them in the squares. The light belongs to them. Don\'t fight them at all. There is no location where your odds improve."',
      '"Once, a Steel Syndicate boss tried to buy an Iron Order patrol. The next morning, his forge was found filled with ash — still burning. Still warm. Nobody went in. Nobody came out."',
    ],
  },
  {
    theme: 'Becoming',
    note: 'What happens to those who join the Order — or try to take what\'s theirs.',
    legends: [
      '"If you kill one and put on the mask, you become the Order. The city erases who you were. Your name disappears from ledgers. Your family forgets your face. You just... start patrolling."',
      '"The masks are cursed. Take one and the city drags you back. Even if you flee to the surface, you wake up on patrol again. Nobody knows how. Nobody stays gone."',
      '"Each Phalanx is four souls but one mind. Kill one and the others know who swung the blade before the body hits the floor. Before. They\'re already coming."',
      '"When Karnuk falls — and everything falls eventually — the Iron Order won\'t die. They\'ll walk into the dark until a new city rises. And they\'ll be there when it does, already on patrol, already watching."',
    ],
  },
];

const TABS = ['Overview', 'Districts', 'Factions', 'NPCs', 'Legends'] as const;
type Tab = (typeof TABS)[number];

// ─── DISTRICTS ─────────────────────────────────────────────────────────────────
const DISTRICTS = [
  {
    id: 'gateway', number: '00', name: 'The Gateway', control: 'Iron Order · Neutral', controlColor: C.ironOrder,
    desc: 'Twenty feet of ironwood and steel banding — doors so massive they shouldn\'t move silently. They do. War-mechs stand in recessed alcoves on either side, furnace-cores glowing faint orange through narrow view-slits. Not statues. Not decorations. Guardians. Above the gate, carved in three languages: FORGE YOUR WORTH OR BURN AWAY.',
    locations: ['Karnuk\'s Gate', 'Family Crest Columns', 'War-Mech Alcoves', 'Entry Registry'],
    vibe: 'Threshold. Judgement. Arrival.',
  },
  {
    id: 'anvil', number: '01', name: 'The Anvil Quarter', control: 'Iron Hammer Clan', controlColor: C.ironHammer,
    desc: 'Ancient dwarven stonework, hand-carved and engraved with twelve generations of master smiths. Every block remembers every siege. Every block is still standing. The Anvilarum\'s doors haven\'t been breached in three hundred years. This is where the hammer-song was born. The new families think that makes it old. They\'re right, of course. They\'re also wrong about what that means.',
    locations: ['The Anvilarum', 'Founder\'s Plaza', 'The Old Mint', 'Ironheart Tavern'],
    vibe: 'Legacy. Tradition. Slow decline.',
  },
  {
    id: 'foundry', number: '02', name: 'The Foundry Heart', control: 'Viceroy Vorgoth', controlColor: C.viceroy,
    desc: 'The axis around which all six districts spin. The Hall of Chains dominates — not a palace but a fortified command post, all iron angles and war-mech maintenance bays visible through floor-to-ceiling viewport slits. Vorgoth doesn\'t govern from behind closed doors. He governs from where everyone can watch him watching them.',
    locations: ['Hall of Chains', 'The Grand Exchange', 'Iron Order Command', 'War-Mech Yards'],
    vibe: 'Power. Calculation. Enforced peace.',
  },
  {
    id: 'dockside', number: '03', name: 'Dockside / The Kettle', control: 'Deepstone Miners', controlColor: C.deepstone,
    desc: 'Twenty-three piers. Forty-three warehouses. The commercial jugular of the Underdark\'s most industrialized city. If goods move in Karnuk, Deepstone moves them. The Kettle — the cramped working-class district against the waterfront — smells like brine and charcoal and honest exhaustion. This is where the actual work gets done.',
    locations: ['Deepstone Docks', 'The Kettle', 'Grinder\'s Rest', 'Warehouse Row'],
    vibe: 'Labor. Muscle. Controlled chaos.',
  },
  {
    id: 'spire', number: '04', name: 'The Syndicate Spire', control: 'Steel Syndicate', controlColor: C.steelSyndicate,
    desc: 'Aggressively, offensively new. Arc-flame lanterns in harsh white light. Moving blueprints cover the walls. Mechworks Plaza runs at all hours. Kethar Steelheart built this district to send one message to every old family watching from their ancestral halls: you\'re already losing.',
    locations: ['Mechworks Plaza', 'The Spark', 'Innovation District', 'Syndicate Foundries'],
    vibe: 'Ambition. Disruption. Future shock.',
  },
  {
    id: 'neutral', number: '05', name: 'The Neutral Quarter', control: "Bregan D'aerthe (shadow)", controlColor: C.bregan,
    desc: 'The Shadowed Leaf Tea House doesn\'t look like a command center. That\'s the point. Elegant curtains, private rooms, sophisticated silence. Bregan D\'aerthe runs the city\'s information trade from within, and the Neutral Quarter is where every family comes when they need something they can\'t officially want.',
    locations: ['The Shadowed Leaf', 'The Velvet Spire', 'The Pit', 'Broker Row'],
    vibe: 'Intrigue. Shadow currency. Everyone owes someone.',
  },
];

// ─── MODAL COMPONENTS ──────────────────────────────────────────────────────────
function ModalBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,2,0.82)', backdropFilter: 'blur(10px)', zIndex: 50 }}
      onClick={onClose}
    />
  );
}

function FactionModal({ faction, onClose }: { faction: typeof FACTIONS[0]; onClose: () => void }) {
  const Icon = faction.icon;
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0,
          width: 'min(640px, 100vw)',
          background: 'hsl(15 8% 7%)',
          borderLeft: `1px solid ${faction.color}33`,
          overflowY: 'auto', zIndex: 51,
          boxShadow: `-20px 0 80px -20px ${faction.color}20`,
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-8 pt-8 pb-6"
          style={{ background: 'hsl(15 8% 7%)', borderBottom: `1px solid ${faction.color}22` }}
        >
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(15 4% 40%)' }}
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="mb-4"
            style={{
              width: '56px', height: '56px',
              background: `${faction.color}14`,
              border: `1px solid ${faction.color}33`,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon size={26} style={{ color: faction.color }} strokeWidth={1.5} />
          </motion.div>

          <p className="font-serif text-xs uppercase tracking-[0.25em] mb-1" style={{ color: faction.color }}>
            {faction.label}
          </p>
          <h2 className="font-serif font-bold uppercase tracking-wide mb-1" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'hsl(15 4% 94%)' }}>
            {faction.name}
          </h2>
          <p className="font-sans text-sm" style={{ color: 'hsl(15 4% 48%)', fontSize: '14px' }}>
            {faction.race} · {faction.territory}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="px-8 py-6 space-y-7">
          {/* Motto */}
          <div style={{ borderLeft: `3px solid ${faction.color}55`, paddingLeft: '16px' }}>
            <p className="font-display italic text-base" style={{ color: faction.color, fontSize: '16px' }}>
              {faction.motto}
            </p>
          </div>

          {/* Overview */}
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(15 4% 38%)' }}>Overview</p>
            <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 72%)', fontSize: '15px' }}>
              {faction.overview}
            </p>
          </div>

          {/* Leadership */}
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(15 4% 38%)' }}>Leadership</p>
            <div className="space-y-4">
              {faction.leadership.map((person) => (
                <div key={person.name} style={{ background: `${faction.color}0A`, border: `1px solid ${faction.color}1A`, borderRadius: '4px', padding: '14px 16px' }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-serif font-bold text-sm uppercase tracking-wider" style={{ color: 'hsl(15 4% 85%)' }}>{person.name}</p>
                    <span className="font-serif text-xs uppercase tracking-wider flex-shrink-0" style={{ color: faction.color, fontSize: '11px' }}>{person.role}</span>
                  </div>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: 'hsl(15 4% 60%)', fontSize: '13px' }}>{person.note}</p>
                  {person.age !== 'Unknown' && person.age !== 'Various' && (
                    <p className="font-serif text-xs mt-2" style={{ color: 'hsl(15 4% 35%)', letterSpacing: '0.05em' }}>Age: {person.age}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Culture */}
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(15 4% 38%)' }}>Culture & Code</p>
            <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 65%)', fontSize: '15px' }}>
              {faction.culture}
            </p>
          </div>

          {/* Relationships */}
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(15 4% 38%)' }}>Relationships</p>
            <div className="space-y-2">
              {faction.relationships.map((rel) => (
                <div key={rel.name} className="flex gap-3" style={{ borderBottom: '1px solid hsl(15 8% 13%)', paddingBottom: '10px' }}>
                  <div style={{ flexShrink: 0, width: '3px', borderRadius: '2px', background: faction.color, opacity: 0.5, alignSelf: 'stretch' }} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-serif text-xs uppercase tracking-wider" style={{ color: 'hsl(15 4% 72%)' }}>{rel.name}</p>
                      <span className="font-sans text-xs" style={{ color: 'hsl(15 4% 38%)', fontSize: '11px' }}>· {rel.status}</span>
                    </div>
                    <p className="font-sans text-xs leading-relaxed" style={{ color: 'hsl(15 4% 52%)', fontSize: '13px' }}>{rel.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Threat */}
          <div style={{ background: 'hsl(0 20% 8%)', border: '1px solid hsl(0 30% 18%)', borderRadius: '4px', padding: '16px' }}>
            <p className="font-serif text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'hsl(0 60% 50%)' }}>Active Threat</p>
            <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 62%)', fontSize: '14px' }}>
              {faction.currentThreat}
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function NPCModal({ npc, onClose }: { npc: typeof KEY_NPCS[0]; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0,
          width: 'min(600px, 100vw)',
          background: 'hsl(15 8% 7%)',
          borderLeft: `1px solid ${npc.color}33`,
          overflowY: 'auto', zIndex: 51,
          boxShadow: `-20px 0 80px -20px ${npc.color}20`,
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-8 pt-8 pb-6" style={{ background: 'hsl(15 8% 7%)', borderBottom: `1px solid ${npc.color}22` }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(15 4% 40%)' }}>
            <X size={18} />
          </button>
          <p className="font-serif text-xs uppercase tracking-[0.25em] mb-1" style={{ color: npc.color }}>{npc.title}</p>
          <h2 className="font-serif font-bold uppercase tracking-wide" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'hsl(15 4% 94%)' }}>
            {npc.name}
          </h2>
        </div>

        <div className="px-8 py-6 space-y-7">
          {/* Quote */}
          <div style={{ borderLeft: `3px solid ${npc.color}55`, paddingLeft: '16px' }}>
            <p className="font-display italic text-base" style={{ color: npc.color, fontSize: '15px' }}>
              {npc.quote}
            </p>
          </div>

          {[
            { label: 'Appearance', text: npc.appearance },
            { label: 'Personality', text: npc.personality },
            { label: 'Motivation', text: npc.motivation },
            { label: 'Background', text: npc.background },
          ].map(({ label, text }) => (
            <div key={label}>
              <p className="font-serif text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(15 4% 38%)' }}>{label}</p>
              <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 68%)', fontSize: '15px' }}>{text}</p>
            </div>
          ))}

          {/* Connections */}
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(15 4% 38%)' }}>Key Connections</p>
            <div className="space-y-1.5">
              {npc.connections.map((c) => (
                <div key={c} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid hsl(15 8% 13%)' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: npc.color, flexShrink: 0 }} />
                  <p className="font-sans text-sm" style={{ color: 'hsl(15 4% 62%)', fontSize: '14px' }}>{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plot Hooks */}
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(15 4% 38%)' }}>Plot Hooks</p>
            <div className="space-y-3">
              {npc.plotHooks.map((hook, i) => (
                <div key={i} style={{ background: `${npc.color}0A`, border: `1px solid ${npc.color}1A`, borderRadius: '4px', padding: '12px 14px' }}>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: 'hsl(15 4% 65%)', fontSize: '14px' }}>{hook}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── TAB PANELS ───────────────────────────────────────────────────────────────
function OverviewTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 p-8" style={{ background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '4px' }}>
          <p className="font-serif text-xs uppercase tracking-[0.25em] mb-4" style={{ color: C.viceroy }}>The City of Chains</p>
          <p className="font-sans leading-relaxed mb-4" style={{ color: 'hsl(15 4% 75%)', fontSize: '16px' }}>
            The first thing you notice isn't the smell — though it hits you like a fist: forge smoke, weapon oil, and something copper-sweet underneath. The ghost of blood scrubbed clean from stone that never truly forgets.
          </p>
          <p className="font-sans leading-relaxed mb-4" style={{ color: 'hsl(15 4% 68%)', fontSize: '16px' }}>
            The first thing you actually notice is the sound. The hammer-song. A rhythm playing for three hundred years without pause — the heartbeat of a city built by violence, maintained by violence, and one day to be consumed by it.
          </p>
          <p className="font-serif text-sm uppercase tracking-wider" style={{ color: C.viceroy }}>But not today. Today, Karnuk works.</p>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Region', val: 'The Underdark' },
            { label: 'Population', val: '~12,000' },
            { label: 'Districts', val: '6' },
            { label: 'Guild Families', val: '5' },
            { label: 'War-Mechs', val: 'Classified' },
            { label: 'Government', val: 'Viceroyalty' },
            { label: 'Power', val: 'Guild Syndicate' },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5" style={{ background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '4px' }}>
              <span className="font-serif text-xs uppercase tracking-wider" style={{ color: 'hsl(15 4% 38%)' }}>{label}</span>
              <span className="font-sans text-sm" style={{ color: 'hsl(15 4% 78%)', fontSize: '14px' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { label: 'The Ironclad\'s Grip', name: 'Vorgoth the Ironclad', color: C.viceroy, body: 'He doesn\'t hold power through wisdom or charm. He holds it through the cold arithmetic of forty-three war-mechs and five guild families who all do the same math and arrive at the same answer: not yet. No family loves him. They don\'t have to.' },
          { label: 'The City\'s Law', name: 'The Iron Order', color: C.ironOrder, body: 'Four to a Phalanx. Masked, anonymous, loyal to no family — loyal to Karnuk itself. They don\'t take bribes. They\'ve executed their own cousins for trying. When an Iron Order Phalanx enters a room, the bosses stop talking. That\'s not respect. That\'s certainty.' },
        ].map(({ label, name, color, body }) => (
          <motion.div key={name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="p-6" style={{ background: 'hsl(20 6% 10%)', border: `1px solid ${color}33`, borderRadius: '4px', boxShadow: `0 0 40px -12px ${color}18` }}>
            <p className="font-serif text-xs uppercase tracking-[0.25em] mb-2" style={{ color }}>{label}</p>
            <h3 className="font-serif font-bold text-xl uppercase tracking-wide mb-3" style={{ color: 'hsl(15 4% 90%)' }}>{name}</h3>
            <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 62%)', fontSize: '15px' }}>{body}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="p-8" style={{ background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '4px' }}>
        <p className="font-serif text-xs uppercase tracking-[0.25em] mb-2" style={{ color: C.viceroy }}>Karnuk's Teeth</p>
        <h3 className="font-serif font-bold text-xl uppercase tracking-wide mb-5" style={{ color: 'hsl(15 4% 90%)' }}>The War-Mechs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 65%)', fontSize: '15px' }}>
            At first, you think it's an earthquake. The cavern floor trembles beneath your boots. Then — like mountains that have grown legs — you see them. Armor plates the size of houses grinding against one another, runed seams glowing like veins of molten ore. Their steps thunder through the caverns until your bones rattle with each impact.
          </p>
          <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 57%)', fontSize: '15px' }}>
            There's the other kind of silence too. The kind that prickles the back of your neck. Karnuk's soldiers call them ghost machines — war-walkers veiled by sorcery. They don't patrol. They wait. And when they move, it is already too late to do anything useful with that information.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DistrictsTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {DISTRICTS.map((d, i) => (
        <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: i * 0.07, duration: 0.4, type: 'spring', stiffness: 200 }}
          className="p-6" style={{ background: 'hsl(20 6% 10%)', border: `1px solid ${d.controlColor}22`, borderRadius: '4px', transition: 'box-shadow 0.3s, border-color 0.3s' }}
          whileHover={{ y: -3, boxShadow: `0 8px 40px -8px ${d.controlColor}30`, borderColor: `${d.controlColor}50` } as any}>
          <p className="font-serif font-bold mb-2" style={{ fontSize: '3rem', lineHeight: 1, color: `${d.controlColor}14`, letterSpacing: '-0.02em' }}>{d.number}</p>
          <p className="font-serif text-xs uppercase tracking-[0.2em] mb-1" style={{ color: d.controlColor }}>{d.control}</p>
          <h3 className="font-serif font-bold text-lg uppercase tracking-wide mb-3" style={{ color: 'hsl(15 4% 90%)' }}>{d.name}</h3>
          <p className="font-sans leading-relaxed mb-4" style={{ color: 'hsl(15 4% 62%)', fontSize: '14px' }}>{d.desc}</p>
          <div style={{ height: '1px', background: `linear-gradient(90deg, ${d.controlColor}44, transparent)`, marginBottom: '12px' }} />
          <div className="flex flex-wrap gap-1.5 mb-3">
            {d.locations.map(loc => (
              <span key={loc} className="font-serif text-xs uppercase tracking-wider px-2 py-0.5"
                style={{ background: `${d.controlColor}10`, border: `1px solid ${d.controlColor}25`, color: d.controlColor, borderRadius: '2px' }}>{loc}</span>
            ))}
          </div>
          <p className="font-serif text-xs uppercase tracking-[0.15em]" style={{ color: 'hsl(15 4% 35%)' }}>{d.vibe}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

function FactionsTab({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {FACTIONS.map((f, i) => {
        const Icon = f.icon;
        return (
          <motion.div key={f.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}>
            <div
              onClick={() => onSelect(f.id)}
              className="p-6 h-full cursor-pointer"
              style={{ background: 'hsl(20 6% 10%)', border: `1px solid ${f.color}25`, borderRadius: '4px', transition: 'transform 0.08s ease, box-shadow 0.3s, border-color 0.3s' }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                e.currentTarget.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
                e.currentTarget.style.boxShadow = `0 0 40px -8px ${f.color}30`;
                e.currentTarget.style.borderColor = `${f.color}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
                e.currentTarget.style.transition = 'transform 0.5s ease, box-shadow 0.4s, border-color 0.4s';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = `${f.color}25`;
              }}
            >
              {/* Top row: icon + label */}
              <div className="flex items-start gap-4 mb-4">
                <div style={{ width: '44px', height: '44px', flexShrink: 0, background: `${f.color}12`, border: `1px solid ${f.color}28`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} style={{ color: f.color }} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-xs uppercase tracking-[0.22em] mb-0.5" style={{ color: f.color }}>{f.label}</p>
                  <h3 className="font-serif font-bold text-lg uppercase tracking-wide leading-tight" style={{ color: 'hsl(15 4% 92%)' }}>{f.name}</h3>
                  <p className="font-sans text-xs mt-0.5" style={{ color: 'hsl(15 4% 44%)', fontSize: '12px' }}>{f.race} · {f.territory}</p>
                </div>
                <span className="font-serif text-xs uppercase tracking-wider flex-shrink-0 mt-1" style={{ color: `${f.color}80`, fontSize: '10px' }}>
                  View ›
                </span>
              </div>

              {/* Don */}
              <div className="mb-3 px-3 py-2" style={{ background: `${f.color}0C`, borderRadius: '3px', borderLeft: `2px solid ${f.color}44` }}>
                <p className="font-serif text-xs uppercase tracking-wider mb-0.5" style={{ color: 'hsl(15 4% 38%)' }}>Don</p>
                <p className="font-serif text-sm uppercase tracking-wider" style={{ color: 'hsl(15 4% 80%)' }}>{f.leader}</p>
              </div>

              {/* Motto */}
              <p className="font-display italic text-sm mb-3" style={{ color: f.color, fontSize: '13px' }}>{f.motto}</p>

              <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 58%)', fontSize: '13px' }}>{f.tagline}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function NPCsTab({ onSelect }: { onSelect: (name: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {KEY_NPCS.map((npc, i) => (
        <motion.div key={npc.name} initial={{ opacity: 0, x: i % 2 === 0 ? -14 : 14 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}
          onClick={() => onSelect(npc.name)}
          className="p-5 cursor-pointer"
          style={{ background: 'hsl(20 6% 10%)', border: `1px solid ${npc.color}20`, borderRadius: '4px', transition: 'box-shadow 0.25s, border-color 0.25s' }}
          whileHover={{ boxShadow: `0 0 24px -4px ${npc.color}25`, borderColor: `${npc.color}44` } as any}
        >
          <div className="flex items-start gap-3">
            <div style={{ width: '3px', borderRadius: '2px', background: npc.color, alignSelf: 'stretch', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-xs uppercase tracking-wider mb-0.5" style={{ color: npc.color }}>{npc.title}</p>
                  <h4 className="font-serif font-bold text-base uppercase tracking-wide" style={{ color: 'hsl(15 4% 90%)' }}>{npc.name}</h4>
                </div>
                <span className="font-serif text-xs uppercase tracking-wider flex-shrink-0 mt-1" style={{ color: `${npc.color}70`, fontSize: '10px' }}>View ›</span>
              </div>
              <p className="font-sans text-sm leading-relaxed mt-2" style={{ color: 'hsl(15 4% 58%)', fontSize: '13px' }}>{npc.hook}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function LegendsTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
      <div className="mb-7 p-5" style={{ background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '4px' }}>
        <div className="flex items-start gap-3">
          <Eye size={15} style={{ color: C.ironOrder, flexShrink: 0, marginTop: '2px' }} strokeWidth={1.5} />
          <p className="font-sans" style={{ color: 'hsl(15 4% 58%)', fontSize: '15px', lineHeight: '1.65' }}>
            What they say about the Iron Order in Karnuk's taverns, alleys, and forge-floors. Some of these are true. None of them are safe to repeat too loudly.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {LEGEND_GROUPS.map((group, gi) => (
          <motion.div key={group.theme} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: gi * 0.08 }}>
            {/* Theme header */}
            <div className="flex items-center gap-4 mb-5">
              <div>
                <p className="font-serif text-xs uppercase tracking-[0.28em] mb-0.5" style={{ color: C.ironOrder }}>{group.theme}</p>
                <div style={{ height: '1px', width: '100%', background: `linear-gradient(90deg, ${C.ironOrder}44, transparent)` }} />
              </div>
            </div>
            <p className="font-sans text-sm mb-5" style={{ color: 'hsl(15 4% 45%)', fontSize: '14px', fontStyle: 'italic' }}>{group.note}</p>

            <div className="space-y-3">
              {group.legends.map((legend, li) => (
                <motion.div key={li} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: gi * 0.08 + li * 0.05 }}
                  className="p-5"
                  style={{ background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 14%)', borderRadius: '4px', transition: 'border-color 0.2s' }}
                  whileHover={{ borderColor: `${C.ironOrder}40` } as any}>
                  <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 68%)', fontSize: '15px' }}>
                    {legend}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function KarnukDemo() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    const idx = TABS.indexOf(activeTab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  const activeFaction = FACTIONS.find(f => f.id === selectedFaction) ?? null;
  const activeNPC = KEY_NPCS.find(n => n.name === selectedNPC) ?? null;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 7%)' }}>

      {/* HERO */}
      <div ref={heroRef} className="relative overflow-hidden flex flex-col items-center justify-center text-center" style={{ height: '100svh', minHeight: '600px' }}>
        <div className="absolute inset-0" style={{ background: 'hsl(15 8% 5%)' }} />

        <motion.div className="absolute inset-0" style={{ y: heroY, background: 'radial-gradient(ellipse 80% 60% at 50% 45%, hsl(20 28% 7%), hsl(15 8% 4%))' }} />

        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 50% at 30% 60%, ${C.viceroy}09, transparent 60%)` }}
          animate={{ x: [0, 18, -10, 0], y: [0, -12, 6, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 72% 38%, rgba(160,30,8,0.07), transparent 65%)' }}
          animate={{ x: [0, -14, 7, 0], y: [0, 9, -5, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }} />

        {/* Embers */}
        {[...Array(14)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{ width: i % 4 === 0 ? '3px' : '2px', height: i % 4 === 0 ? '3px' : '2px', background: C.viceroy, left: `${8 + (i * 6.5) % 84}%`, bottom: `${8 + (i * 9) % 38}%`, filter: 'blur(0.5px)' }}
            animate={{ y: [0, -(50 + (i * 11) % 90)], opacity: [0, 0.75, 0], x: [(i % 2 === 0 ? 1 : -1) * ((i * 4) % 14)] }}
            transition={{ duration: 3.5 + (i % 5), repeat: Infinity, delay: i * 0.35, ease: 'easeOut' }} />
        ))}

        <motion.div className="relative z-10 px-6" style={{ opacity: heroOpacity }}>
          <motion.p initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-serif text-sm uppercase tracking-[0.4em] mb-8" style={{ color: C.viceroy }}>
            The Underdark · City of Chains
          </motion.p>

          <h1 className="font-serif font-black uppercase mb-6" style={{ fontSize: 'clamp(4rem, 14vw, 10rem)', letterSpacing: '0.08em', lineHeight: 0.9 }}>
            {'KARNUK'.split('').map((letter, i, arr) => (
              <motion.span key={i}
                initial={{ opacity: 0, y: 32, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.7, type: 'spring', stiffness: 120, damping: 12 }}
                style={{ display: 'inline-block', color: i === arr.length - 1 ? C.viceroy : 'hsl(15 4% 94%)', textShadow: i === arr.length - 1 ? `0 0 60px ${C.viceroy}80, 0 0 120px ${C.viceroy}30` : undefined }}>
                {letter}
              </motion.span>
            ))}
          </h1>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.1, duration: 0.8 }}
            className="mx-auto mb-6" style={{ height: '1px', width: '200px', background: `linear-gradient(90deg, transparent, ${C.viceroy}, transparent)`, transformOrigin: 'center' }} />

          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.6 }}
            className="font-sans text-xl mb-3" style={{ color: 'hsl(15 4% 65%)', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)' }}>
            The Iron Syndicate City
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }}
            className="font-serif text-xs uppercase tracking-[0.35em]" style={{ color: 'hsl(15 4% 32%)' }}>
            "Forge Your Worth or Burn Away"
          </motion.p>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '120px', background: 'linear-gradient(to bottom, transparent, hsl(15 6% 7%))' }} />
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.8 }}>
          <p className="font-serif text-xs uppercase tracking-[0.25em]" style={{ color: 'hsl(15 4% 28%)' }}>Enter</p>
          <motion.div style={{ width: '1px', height: '32px', background: `linear-gradient(to bottom, hsl(15 4% 28%), transparent)` }}
            animate={{ scaleY: [0.5, 1, 0.5] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-10 font-serif text-xs uppercase tracking-wider">
          <Link href="/"><span className="cursor-pointer transition-colors" style={{ color: 'hsl(15 4% 35%)' }}>Chronicle</span></Link>
          <span style={{ color: 'hsl(15 8% 22%)' }}>›</span>
          <span style={{ color: 'hsl(15 4% 35%)' }}>Underdark</span>
          <span style={{ color: 'hsl(15 8% 22%)' }}>›</span>
          <span style={{ color: C.viceroy }}>Karnuk</span>
        </motion.nav>

        {/* Tab bar */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative flex items-center mb-10 overflow-x-auto" style={{ borderBottom: '1px solid hsl(15 8% 16%)', scrollbarWidth: 'none' }}>
          {TABS.map((tab, i) => (
            <button key={tab} ref={el => { tabRefs.current[i] = el; }} onClick={() => setActiveTab(tab)}
              className="font-serif text-xs uppercase tracking-[0.18em] px-5 py-3 whitespace-nowrap transition-colors duration-200"
              style={{ color: activeTab === tab ? C.viceroy : 'hsl(15 4% 46%)', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', zIndex: 1 }}>
              {tab}
            </button>
          ))}
          <motion.div animate={{ left: indicator.left, width: indicator.width }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{ position: 'absolute', bottom: '-1px', height: '2px', background: C.viceroy, boxShadow: `0 0 10px ${C.viceroy}70`, borderRadius: '1px' }} />
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <div key={activeTab}>
            {activeTab === 'Overview' && <OverviewTab />}
            {activeTab === 'Districts' && <DistrictsTab />}
            {activeTab === 'Factions' && <FactionsTab onSelect={setSelectedFaction} />}
            {activeTab === 'NPCs' && <NPCsTab onSelect={setSelectedNPC} />}
            {activeTab === 'Legends' && <LegendsTab />}
          </div>
        </AnimatePresence>

        {/* Demo badge */}
        <div className="mt-16 px-5 py-3 flex items-center justify-between"
          style={{ background: 'hsl(20 6% 9%)', border: '1px dashed hsl(15 8% 18%)', borderRadius: '4px' }}>
          <p className="font-sans text-xs" style={{ color: 'hsl(15 4% 30%)', fontSize: '12px' }}>
            POC · Static data · Not connected to Vault index · Images pending
          </p>
          <Link href="/"><span className="font-serif text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer" style={{ color: 'hsl(15 4% 35%)' }}>Back <ChevronRight size={11} /></span></Link>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {activeFaction && <FactionModal key="faction-modal" faction={activeFaction} onClose={() => setSelectedFaction(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {activeNPC && <NPCModal key="npc-modal" npc={activeNPC} onClose={() => setSelectedNPC(null)} />}
      </AnimatePresence>
    </div>
  );
}
