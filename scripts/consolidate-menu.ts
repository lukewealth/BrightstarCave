import * as fs from 'fs';
import * as path from 'path';

const dataPath = path.join(process.cwd(), 'src/data/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const stringItems = data.menu.filter(item => typeof item.id === 'string');
const numericItems = data.menu.filter(item => typeof item.id === 'number');

const consolidatedMenu = [...stringItems];

const getCategoryType = (category) => {
    category = category.toLowerCase();
    if (category.includes('kitchen') || category.includes('exotic')) return 'kitchen';
    if (category.includes('apartment')) return 'hotel';
    if (category.includes('leisure') && !category.includes('bar')) return 'hotel';
    return 'bar';
};

const idCounters = {
    'kt': 18,
    'mk': 13,
    'ck': 19,
    'hw': 11,
    'ws': 15,
    'tq': 0, // Will be calculated
    'wn': 10,
    'dr': 9,
    'ap': 4,
    'pl': 3,
    'sn': 2
};

// Calculate starting IDs for Tequila and others if needed
const tequilaItems = stringItems.filter(i => i.id.startsWith('tq-'));
idCounters['tq'] = tequilaItems.length + 1;

numericItems.forEach(numItem => {
    // Check if item already exists by name (case insensitive)
    const exists = consolidatedMenu.find(item => item.name.toLowerCase() === numItem.name.toLowerCase());
    if (!exists) {
        let prefix = 'dr';
        if (numItem.category.toLowerCase().includes('tequila')) prefix = 'tq';
        if (numItem.category.toLowerCase().includes('whiskey')) prefix = 'ws';
        if (numItem.category.toLowerCase().includes('cognac')) prefix = 'hw';
        if (numItem.category.toLowerCase().includes('wine')) prefix = 'wn';
        if (numItem.category.toLowerCase().includes('bitters')) prefix = 'dr';

        const newId = `${prefix}-${String(idCounters[prefix] || 1).padStart(2, '0')}`;
        idCounters[prefix]++;

        consolidatedMenu.push({
            id: newId,
            name: numItem.name,
            price: numItem.price,
            category: numItem.category,
            type: getCategoryType(numItem.category),
            stock: 100,
            description: numItem.description
        });
    }
});

fs.writeFileSync(dataPath, JSON.stringify({ menu: consolidatedMenu }, null, 2));
console.log('Menu consolidated successfully!');
