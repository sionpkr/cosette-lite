import type { ITournamentConfig } from "./config.interface";
import { DateTime } from "luxon";

export const config: ITournamentConfig = {
    "host": "Garalulu",
    "name": "Korea Regional Cup 2026",
    "discord": {
        "guildId": "1569229007046578256",
        "welcomeChannelId": "931251476297297930",
        "ownerId": "1569229103318564955",
        "roles": [
            {
                "id": "1569235275140304926",
                "name": "Verified"
            },
            {
                "id": "1569235935676211250",
                "name": "강원특별자치도"
            },
            {
                "id": "1569235998636904488",
                "name": "경기 북부"
            },
            {
                "id": "1569236283966890015",
                "name": "경기 서남부"
            },
            {
                "id": "1569236340846100550",
                "name": "경기 동남부"
            },
            {
                "id": "1569236369384017991",
                "name": "경상남도"
            },
            {
                "id": "1569236525466521640",
                "name": "경상북도"
            },
            {
                "id": "1569236556189798480",
                "name": "대구광역시"
            },
            {
                "id": "1569236580600914010",
                "name": "대전광역시"
            },
            {
                "id": "1569236607519826061",
                "name": "부산광역시"
            },
            {
                "id": "1569236629984641104",
                "name": "서울 서북부"
            },
            {
                "id": "1569236779142221935",
                "name": "서울 동북부"
            },
            {
                "id": "1569236806124441670",
                "name": "서울 동남부"
            },
            {
                "id": "1569236835241168998",
                "name": "세종특별자치시"
            },
            {
                "id": "1569236901641064550",
                "name": "울산광역시"
            },
            {
                "id": "1569236930544140368",
                "name": "인천광역시"
            },
            {
                "id": "1569236955210973184",
                "name": "전남광주통합특별시"
            },
            {
                "id": "1569236994335440966",
                "name": "전북특별자치도"
            },
            {
                "id": "1569237019949932556",
                "name": "제주특별자치도"
            },
            {
                "id": "1569237051709202432",
                "name": "충청남도"
            },
            {
                "id": "1569237076426104883",
                "name": "충청북도"
            }
        ]
    }
}

/**
    * @description This function is used to check if the user is eligible for the verified role(s) specified in your config.
    * The default is to check if the user is older than 6 months.
    * You can modify the function to check for other things, such as if the user has a certain amount of playtime, rank or pp.
    * @param userData The osu! profile of the user.
    * @returns A boolean indicating if the user is eligible for the linked role.
    * 
*/
export function isUserEligible(userData: { join_date: string }): boolean {
    const joinDate = DateTime.fromISO(userData.join_date);
    const nowMinus6Months = DateTime.now().minus({ months: 6 });

    return nowMinus6Months > joinDate;
}