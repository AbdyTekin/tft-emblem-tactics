import { Champion } from '@/types/tft';

/**
 * TFT Team Planner Code mapping.
 * Maps champion apiName → team_planner_code (from Community Dragon tftchampions-teamplanner.json)
 * These codes are used by the TFT client to import team compositions.
 */
const TEAM_PLANNER_CODES: Record<string, number> = {
    "TFT17_MissFortune": 1,
    "TFT17_Akali": 13,
    "TFT17_Briar": 14,
    "TFT17_Belveth": 15,
    "TFT17_Aurora": 16,
    "TFT17_Illaoi": 17,
    "TFT17_Jinx": 18,
    "TFT17_Fiora": 19,
    "TFT17_IvernMinion": 20,
    "TFT17_Fizz": 21,
    "TFT17_Veigar": 22,
    "TFT17_Gnar": 23,
    "TFT17_Rammus": 24,
    "TFT17_Corki": 25,
    "TFT17_Poppy": 26,
    "TFT17_Caitlyn": 27,
    "TFT17_Bard": 28,
    "TFT17_Aatrox": 29,
    "TFT17_Maokai": 30,
    "TFT17_Kindred": 31,
    "TFT17_Kaisa": 32,
    "TFT17_Rhaast": 33,
    "TFT17_Karma": 34,
    "TFT17_Jhin": 35,
    "TFT17_Urgot": 36,
    "TFT17_Pantheon": 37,
    "TFT17_AurelionSol": 38,
    "TFT17_Galio": 39,
    "TFT17_Sona": 41,
    "TFT17_Talon": 42,
    "TFT17_TwistedFate": 43,
    "TFT17_Jax": 44,
    "TFT17_Pyke": 45,
    "TFT17_Viktor": 46,
    "TFT17_MasterYi": 47,
    "TFT17_Lulu": 48,
    "TFT17_Gragas": 49,
    "TFT17_Samira": 50,
    "TFT17_Teemo": 51,
    "TFT17_Nasus": 52,
    "TFT17_Gwen": 53,
    "TFT17_Ornn": 54,
    "TFT17_Nami": 55,
    "TFT17_Blitzcrank": 56,
    "TFT17_Nunu": 57,
    "TFT17_Vex": 58,
    "TFT17_Shen": 59,
    "TFT17_Riven": 60,
    "TFT17_Milio": 61,
    "TFT17_Ezreal": 62,
    "TFT17_Xayah": 63,
    "TFT17_Zoe": 65,
    "TFT17_Leona": 66,
    "TFT17_Diana": 67,
    "TFT17_Leblanc": 68,
    "TFT17_Chogath": 69,
    "TFT17_Lissandra": 70,
    "TFT17_Zed": 71,
    "TFT17_Mordekaiser": 78,
    "TFT17_TahmKench": 79,
    "TFT17_Graves": 80,
    "TFT17_Morgana": 88,
    "TFT17_RekSai": 104,
};

const TFT_SET_IDENTIFIER = "TFTSet17";
const MAX_TEAM_SLOTS = 10;

/**
 * Generates a TFT Team Planner code from a list of champions.
 * 
 * Format: "02" + (champion codes as 3-digit hex, padded to fill 10 slots) + "TFTSet17"
 * 
 * Based on: https://gist.github.com/bangingheads/243e396f78be1a4d49dc0577abf57a0b
 * Champion data from: https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftchampions-teamplanner.json
 */
export function generateTeamCode(champions: Champion[]): string {
    const prefix = "02";
    const hexCodes: string[] = [];

    for (const champ of champions) {
        const code = TEAM_PLANNER_CODES[champ.apiName];
        if (code !== undefined) {
            // Encode each champion code as 3-digit hex
            hexCodes.push(code.toString(16).padStart(3, '0'));
        }
    }

    // Pad remaining slots with "000" (empty)
    while (hexCodes.length < MAX_TEAM_SLOTS) {
        hexCodes.push("000");
    }

    return prefix + hexCodes.join('') + TFT_SET_IDENTIFIER;
}
