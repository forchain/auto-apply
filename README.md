# auto-apply

An automated job application tool for Boss Direct (boss.zhipin.com) that helps you:
- Automatically log in with QR code scanning
- Search for jobs using predefined keywords
- Automatically send connection requests to HRs
- Track contacted positions
- Handle pagination automatically
- Configure operation intervals

## Features
- [x] Automatic login with QR code scanning
- [x] Session persistence
- [x] Configurable search keywords
- [x] Automatic connection requests
- [x] Pagination support
- [x] Operation interval control
- [x] Contact history tracking
- [x] Configurable web element selectors

## Configuration
Create a `config.json` file:
```json
{
"website": {
"url": "https://www.zhipin.com/web/geek/job?query={keyword}",
"selectors": {
"resultList": ".job-card-wrapper",
"nextPageButton": ".ui-icon-arrow-right",
"chatButton": ":scope .job-info .start-chat-btn",
"loginDialog": "div.boss-login-dialog",
"loginButton": ".go-login-btn",
"userProfile": "#header .nav-figure",
"greetDialog": "div.greet-boss-dialog",
"greetDialogCancelBtn": ".cancel-btn"
}
},
"keywords": ["Software Engineer", "Frontend", "Backend"],
"userDataDir": "./user-data",
"interval": 5000,
"contactedJobsFile": "./contacted.json"
}
```

### Configuration Options
- `website.url`: Job search URL template
- `website.selectors`: DOM element selectors
- `keywords`: Array of search keywords
- `userDataDir`: Browser session storage location
- `interval`: Delay between operations (ms)
- `contactedJobsFile`: File to store contacted job records

## Usage
```bash
npm install
npm start
``` 

## Tech Stack
- TypeScript
- Playwright
- Node.js

## Prerequisites
- Node.js >= 14
- npm >= 6

## Notes
- First-time login requires QR code scanning
- Browser session is persisted between runs
- Previously contacted positions are skipped automatically
- Operation intervals help avoid rate limiting