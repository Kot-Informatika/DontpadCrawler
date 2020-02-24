const fs = require('fs');
const { JSDOM } = require('jsdom');
const axios = require('axios');

const softMkdir = (dir) => {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);
}

const instrospect = async (url) => {
    const { data: mainPageData } = await axios.get(url);
    const { data: menuData } = await axios.get(`${url}.menu.json`);
    const mainPageDocument = new JSDOM(mainPageData).window.document;
    const content = mainPageDocument.getElementById('text').innerHTML;
    const menu = menuData
    return { menu, content };
}

const crawl = async (url, baseFolder) => {
    const queue = [{ url, folder: baseFolder }];
    const visited = new Set();

    while (queue.length > 0) {
        const { url: curUrl, folder } = queue.pop();

        if (visited.has(curUrl)) {
            log(`The url ${curUrl} has already been visited, skipping.`);
            continue;
        }

        softMkdir(folder);

        console.log(`Crawling from ${curUrl}...`);
        const response = await instrospect(curUrl);

        if (response.content.length > 0) {
            fs.writeFileSync(`${folder}/content.txt`, response.content, 'UTF-8');
        }
        visited.add(curUrl);

        if (Array.isArray(response.menu) && response.menu.length > 0) {
            console.log(`Children: ${response.menu.join(',')}`);
            const children = response.menu;
            children.forEach(child => queue.push({ url: `${curUrl}/${child}`, folder: `${folder}/${child}` }));
        }
    }
}

if (!process.argv[2])
    throw new Error('You have to pass the due URL to crawl (argv[2])');
if (!process.argv[3])
    throw new Error('You have to pass the due folder to save the stuff (argv[3])');
crawl(process.argv[2], process.argv[3]);