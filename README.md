# auto-apply

An automated job application tool that helps you:
- Automatically log in to job websites (with session persistence)
- Search for jobs using predefined keywords
- Automatically send connection requests to HRs
- Support multiple job platforms
- Configurable web element selectors

## Features
- [x] Automatic login with QR code scanning
- [x] Session persistence
- [x] Configurable search keywords
- [x] Automatic connection requests
- [x] Pagination support
- [x] Configurable web element selectors

## Configuration
Create a `config.json` file:
```json
{
"website": {
"url": "https://example.com",
"selectors": {
"searchInput": "#search-box",
"searchButton": "#search-btn",
"resultList": ".job-list-item",
"nextPageButton": ".pagination-next",
"chatButton": "#chat-btn",
"backButton": "#back-btn"
}
},
"keywords": ["Software Engineer", "Frontend", "Backend"],
"userDataDir": "./user-data"
}
```

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

## Installation
