import { Champion } from '@/types/tft';

/**
 * TFT Team Planner Code mapping.
 * Maps champion apiName → team_planner_code (from Community Dragon tftchampions-teamplanner.json)
 * These codes are used by the TFT client to import team compositions.
 */
const TEAM_PLANNER_CODES: Record<string, number> = {
    "TFT16_Tristana": 735,
    "TFT16_Lulu": 736,
    "TFT16_Teemo": 800,
    "TFT16_Rumble": 801,
    "TFT16_Nautilus": 802,
    "TFT16_TwistedFate": 803,
    "TFT16_Gangplank": 804,
    "TFT16_Illaoi": 812,
    "TFT16_MissFortune": 813,
    "TFT16_Sion": 814,
    "TFT16_Briar": 815,
    "TFT16_Draven": 817,
    "TFT16_Ambessa": 818,
    "TFT16_Zoe": 819,
    "TFT16_Leona": 820,
    "TFT16_Aphelios": 821,
    "TFT16_Taric": 822,
    "TFT16_JarvanIV": 824,
    "TFT16_Sona": 826,
    "TFT16_Garen": 828,
    "TFT16_Lux": 829,
    "TFT16_Anivia": 830,
    "TFT16_Ashe": 831,
    "TFT16_Braum": 832,
    "TFT16_Lissandra": 833,
    "TFT16_Milio": 834,
    "TFT16_Neeko": 835,
    "TFT16_Jinx": 840,
    "TFT16_Caitlyn": 841,
    "TFT16_Vi": 843,
    "TFT16_Seraphine": 844,
    "TFT16_Yasuo": 845,
    "TFT16_Ahri": 847,
    "TFT16_Wukong": 848,
    "TFT16_Shen": 849,
    "TFT16_Malzahar": 850,
    "TFT16_RekSai": 851,
    "TFT16_ChoGath": 852,
    "TFT16_KogMaw": 853,
    "TFT16_Annie": 854,
    "TFT16_Ornn": 855,
    "TFT16_Kindred": 856,
    "TFT16_Azir": 857,
    "TFT16_Zilean": 858,
    "TFT16_Fiddlesticks": 859,
    "TFT16_Shyvana": 861,
    "TFT16_Galio": 863,
    "TFT16_TahmKench": 864,
    "TFT16_Sejuani": 865,
    "TFT16_Sett": 866,
    "TFT16_Brock": 867,
    "TFT16_THex": 869,
    "TFT16_BelVeth": 870,
    "TFT16_Singed": 871,
    "TFT16_AurelionSol": 872,
    "TFT16_Veigar": 873,
    "TFT16_BaronNashor": 874,
    "TFT16_Darius": 875,
    "TFT16_Yone": 876,
    "TFT16_Warwick": 877,
    "TFT16_Fizz": 878,
    "TFT16_Poppy": 879,
    "TFT16_Kennen": 880,
    "TFT16_Ziggs": 881,
    "TFT16_Aatrox": 882,
    "TFT16_Volibear": 883,
    "TFT16_Jhin": 884,
    "TFT16_Sylas": 18,
    "TFT16_Ryze": 19,
    "TFT16_Nidalee": 20,
    "TFT16_Tryndamere": 17,
    "TFT16_RiftHerald": 22,
    "TFT16_Mel": 25,
    "TFT16_Graves": 39,
    "TFT16_Skarner": 26,
    "TFT16_Diana": 35,
    "TFT16_Kaisa": 27,
    "TFT16_Renekton": 28,
    "TFT16_Nasus": 34,
    "TFT16_Xerath": 31,
    "TFT16_Thresh": 33,
    "TFT16_Gwen": 29,
    "TFT16_Kalista": 30,
    "TFT16_Leblanc": 23,
    "TFT16_Viego": 36,
    "TFT16_Ekko": 21,
    "TFT16_Bard": 24,
    "TFT16_Vayne": 4,
    "TFT16_Yunara": 42,
    "TFT16_Swain": 37,
    "TFT16_XinZhao": 16,
    "TFT16_Yorick": 15,
    "TFT16_Orianna": 43,
    "TFT16_Qiyana": 44,
    "TFT16_Loris": 32,
    "TFT16_Blitzcrank": 842,
    "TFT16_DrMundo": 47,
    "TFT16_Zaahen": 48,
    "TFT16_Lucian": 52,
    "TFT16_Kobuko": 53,
};

const TFT_SET_IDENTIFIER = "TFTSet16";
const MAX_TEAM_SLOTS = 10;

/**
 * Generates a TFT Team Planner code from a list of champions.
 * 
 * Format: "02" + (champion codes as 3-digit hex, padded to fill 10 slots) + "TFTSet16"
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
