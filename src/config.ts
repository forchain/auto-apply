export interface Config {
    website: {
        url: string;
        selectors: {
            searchInput: string;
            searchButton: string;
            resultList: string;
            nextPageButton: string;
            chatButton: string;
            backButton: string;
        };
    };
    keywords: string[];
    userDataDir: string;
}

export function loadConfig(): Config {
    return require('../config.json');
}
    