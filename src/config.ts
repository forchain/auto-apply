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
            loginDialog: string;
            headerWrapper: string;
            loginButton: string;
            userProfile: string;
            greetDialog: string;
            greetDialogCancelBtn: string;
            chatMessage: string;
        };
    };
    keywords: string[];
    userDataDir: string;
    interval: number;
    contactedJobsFile: string;
}

export interface ContactedJobs {
    [jobId: string]: string;  // jobId -> job title
}

export function loadConfig(): Config {
    return require('../config.json');
}
    