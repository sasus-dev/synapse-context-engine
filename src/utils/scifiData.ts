import { Node, KnowledgeGraph } from '../../types';
import { INITIAL_SECURITY_RULES, INITIAL_EXTRACTION_RULES, INITIAL_SYSTEM_PROMPTS } from '../../constants';

const MOVIES = [
    ["Blade Runner", "Tech-noir cyberpunk film directing by Ridley Scott."],
    ["The Matrix", "Simulation theory action film by the Wachowskis."],
    ["2001: A Space Odyssey", "Epic sci-fi regarding human evolution and AI."],
    ["Alien", "Sci-fi horror featuring the Xenomorph."],
    ["Interstellar", "Space exploration film involving relativistic time dilation."],
    ["Inception", "Heist film set within shared dreams."],
    ["Arrival", "First contact movie focusing on linguistic relativity."],
    ["Dune: Part One", "Adaptation of Herbert's epic set on Arrakis."],
    ["Ex Machina", "psychological thriller about the Turing test."],
    ["Minority Report", "Pre-crime cyberpunk mystery."],
    ["Star Wars: A New Hope", "Space opera introducing the Force."],
    ["The Terminator", "Time travel action regarding Skynet's rise."],
    ["District 9", "Found footage film about alien segregation."],
    ["Children of Men", "Dystopian film about global infertility."],
    ["Eternal Sunshine of the Spotless Mind", "Sci-fi romance about memory erasure."],
    ["Her", "Romance between a man and an AI OS."],
    ["Gattaca", "Biopunk film about genetic discrimination."],
    ["Avatar", "Planetary romance set on Pandora."],
    ["RoboCop", "Satirical cyberpunk action film."],
    ["Total Recall", "Memory implant thriller set on Mars."]
];

const BOOKS = [
    ["Neuromancer", "Seminal cyberpunk novel by William Gibson."],
    ["Dune", "Epic set in a feudal interstellar society."],
    ["Foundation", "Asimov's saga about Psychohistory."],
    ["Hyperion", "Cantebury Tales in space with the Shrike."],
    ["Snow Crash", "Post-cyberpunk novel introducing the Metaverse."],
    ["The Left Hand of Darkness", "Exploration of ambisexual society."],
    ["Do Androids Dream of Electric Sheep?", "Source material for Blade Runner."],
    ["Fahrenheit 451", "Dystopia where books are outlawed."],
    ["1984", "Totalitarian surveillance state novel."],
    ["Brave New World", "Dystopia based on genetic castes and soma."],
    ["The Three-Body Problem", "First contact with the Trisolarans."],
    ["Ender's Game", "Military sci-fi about child soldiers."],
    ["The Hitchhiker's Guide to the Galaxy", "Comedy sci-fi series."],
    ["Frankenstein", "Early sci-fi about creating life."],
    ["Slaughterhouse-Five", "Anti-war novel with time travel."],
    ["Ubik", "Dick's novel about crumbling realities."],
    ["Solaris", "Psychological encounter with a living ocean."],
    ["Altered Carbon", "Hardboiled cyberpunk with sleeve technology."],
    ["The Expanse", "System-wide political space opera."],
    ["Red Mars", "Hard sci-fi about terraforming Mars."]
];

const GAMES = [
    ["Mass Effect", "Space opera RPG with the Reapers."],
    ["Halo", "Military sci-fi shooter involving the Covenant."],
    ["Portal", "Puzzle game with spatial wormholes."],
    ["Half-Life 2", "Dystopian shooter set in City 17."],
    ["Deus Ex", "Immersive sim about transhumanism conspiracies."],
    ["Cyberpunk 2077", "Open world RPG in Night City."],
    ["System Shock 2", "Survival horror with SHODAN AI."],
    ["BioShock", "Objectivist underwater dystopia."],
    ["Fallout", "Post-apocalyptic retro-futuristic RPG."],
    ["StarClaft", "RTS with Terran, Zerg, and Protoss."],
    ["Metroid", "Space adventure with Samus Aran."],
    ["Horizon Zero Dawn", "Post-post-apocalyptic robot dinosaurs."],
    ["Outer Wilds", "Space exploration in a time loop."],
    ["Prey", "Immersive sim on Talos I station."],
    ["Dead Space", "Sci-fi horror on the USG Ishimura."],
    ["XCOM 2", "Tactical strategy against alien occupation."],
    ["Destiny 2", "Mythic science-fiction shooter."],
    ["Control", "New Weird sci-fi about the FBC."],
    ["Nier: Automata", "Android philosophy action RPG."],
    ["Elite Dangerous", "Space flight simulation."]
];

const CONCEPTS = [
    ["Singularity", "Point where AI growth becomes uncontrollable."],
    ["Fermi Paradox", "Contradiction between probability and lack of evidence for aliens."],
    ["Dyson Sphere", "Structure seeking to encompass a star for energy."],
    ["Von Neumann Probe", "Self-replicating spacecraft."],
    ["Ansible", "Device for FTL communication."],
    ["Cyberpsace", "Virtual reality environment."],
    ["Terraforming", "Modifying a planet's atmosphere to differ."],
    ["Uplift", "Generic modification of animals to sentience."],
    ["Grey Goo", "Ecophagy by self-replicating nanobots."],
    ["Multiverse", "Hypothetical set of all possible universes."],
    ["Time Dilation", "Difference in elapsed time due to gravity/velocity."],
    ["Cybernetics", "Integration of biology and machines."],
    ["Post-Scarcity", "Economy where goods are free."],
    ["Transhumanism", "Enhancing human condition via tech."],
    ["Kardashev Scale", "Ranking civilizations by energy use."],
    ["Simulation Hypothesis", "Reality is a computer simulation."],
    ["Uncanny Valley", "Discomfort with near-human robots."],
    ["Grandfather Paradox", "Time travel logical inconsistency."],
    ["Roko's Basilisk", "Thought experiment about a vengeful AI."],
    ["Boltzmann Brain", "Consciousness arising from entropy fluctuations."]
];

const TECH = [
    ["Warp Drive", "FTL propulsion distorting space-time."],
    ["Lightsaber", "Plasma sword from Star Wars."],
    ["Teleporter", "Matter transmission device."],
    ["Holodeck", "Simulated reality room."],
    ["Replicator", "Matter rearranger for food/objects."],
    ["Power Armor", "Exoskeleton for combat."],
    ["Cryostasis", "Preserving life at low temps."],
    ["Neural Lace", "Brain-computer interface mesh."],
    ["Arc Reactor", "Clean energy source (Iron Man)."],
    ["Tardis", "Time and Relative Dimension in Space."],
    ["Stargate", "Wormhole portal device."],
    ["Cyberdeck", "Portable computer for hacking."],
    ["Smart Gun", "Auto-aiming firearm."],
    ["Invisibility Cloak", "Meta-material light bending."],
    ["Nanites", "Microscopic robots."],
    ["Positronic Brain", "Asimov's AI brain structure."],
    ["Flux Capacitor", "Time travel enabling device."],
    ["Proton Pack", "Particle accelerator for ghosts."],
    ["Sonic Screwdriver", "Multipurpose tool (Doctor Who)."],
    ["Gravity Gun", "Zero Point Energy Field Manipulator."]
];

export const getScifiSession = (): any => {
    const nodes: Record<string, Node> = {};
    let timestamp = Date.now();

    const addCategory = (items: string[][], type: 'concept' | 'fact', categoryName: string) => {
        items.forEach(([label, content], idx) => {
            const id = crypto.randomUUID();
            nodes[id] = {
                id,
                type: 'concept',
                label,
                content,
                heat: 0,
                created: timestamp - (idx * 1000), // Staggered creation times
                isNew: false,
                // @ts-ignore
                category: categoryName // Direct injection
            };
        });
    };

    addCategory(MOVIES, 'concept', 'Movies');
    addCategory(BOOKS, 'concept', 'Books');
    addCategory(GAMES, 'concept', 'Games');
    addCategory(CONCEPTS, 'concept', 'Scientific Theories');
    addCategory(TECH, 'concept', 'Technology');

    const graph: KnowledgeGraph = {
        nodes,
        synapses: [], // 0 Synapses as requested
        hyperedges: []
    };

    return {
        id: 'scifi_iso_100',
        name: 'Sci-Fi Knowledge Base (+100)',
        created: Date.now(),
        lastActive: Date.now(),
        graph,
        chatHistory: [],
        auditLogs: [],
        debugLogs: [],
        telemetry: []
    };
};
