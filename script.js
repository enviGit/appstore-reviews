let allFetchedReviews = [];
let currentAppName = 'app_reviews'; // Default filename part

// --- Theme Logic ---
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
})();

// --- Dropdown Logic ---
const countryOptions = [
    { code: 'auto', name: 'Auto (URL)', flag: null },
    { code: 'au', name: 'Australia', flag: 'au' },
    { code: 'br', name: 'Brazil', flag: 'br' },
    { code: 'ca', name: 'Canada', flag: 'ca' },
    { code: 'cn', name: 'China', flag: 'cn' },
    { code: 'fr', name: 'France', flag: 'fr' },
    { code: 'de', name: 'Germany', flag: 'de' },
    { code: 'it', name: 'Italy', flag: 'it' },
    { code: 'jp', name: 'Japan', flag: 'jp' },
    { code: 'pl', name: 'Poland', flag: 'pl' },
    { code: 'es', name: 'Spain', flag: 'es' },
    { code: 'gb', name: 'United Kingdom', flag: 'gb' },
    { code: 'us', name: 'United States', flag: 'us' },
];

function initCustomSelect() {
    const optionsContainer = document.getElementById('customSelectOptions');
    countryOptions.forEach(opt => {
        const div = document.createElement('div');
        div.className = "px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0";
        let iconHtml = opt.code === 'auto'
            ? `<span class="text-lg">🌍</span>`
            : `<img src="https://flagcdn.com/w40/${opt.flag}.png" alt="${opt.code}" class="w-6 h-auto rounded-sm shadow-sm">`;
        div.innerHTML = `${iconHtml}<span class="text-sm font-medium text-slate-700 dark:text-slate-200">${opt.name}</span>`;
        div.onclick = () => selectCountry(opt);
        optionsContainer.appendChild(div);
    });
    document.addEventListener('click', (e) => {
        const trigger = document.getElementById('customSelectTrigger');
        const options = document.getElementById('customSelectOptions');
        if (!trigger.contains(e.target) && !options.contains(e.target)) {
            options.classList.add('hidden');
            document.getElementById('selectArrow').classList.remove('rotate-180');
        }
    });
}

function toggleCustomSelect() {
    document.getElementById('customSelectOptions').classList.toggle('hidden');
    document.getElementById('selectArrow').classList.toggle('rotate-180');
}

function selectCountry(opt) {
    document.getElementById('countrySelect').value = opt.code;
    const flagSpan = document.getElementById('selectedFlag');
    const textSpan = document.getElementById('selectedText');
    if (opt.code === 'auto') {
        flagSpan.innerHTML = '🌍';
    } else {
        flagSpan.innerHTML = `<img src="https://flagcdn.com/w40/${opt.flag}.png" alt="${opt.code}" class="w-6 h-auto rounded-sm shadow-sm">`;
    }
    textSpan.textContent = opt.name;
    document.getElementById('customSelectOptions').classList.add('hidden');
    document.getElementById('selectArrow').classList.remove('rotate-180');
}

// --- Extractor Logic ---
function updateLimitDisplay(val) {
    document.getElementById('limitValueDisplay').innerText = val;
    if (allFetchedReviews.length > 0) renderTable();
}

async function fetchAppInfo(appId, country) {
    try {
        const lookupCountry = country === 'auto' ? 'us' : country;
        const url = `https://itunes.apple.com/${lookupCountry}/lookup?id=${appId}`;
        const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

        const res = await fetch(proxy);
        if (!res.ok) return null;
        const json = await res.json();

        if (json.results && json.results.length > 0) {
            return json.results[0];
        }
    } catch (e) {
        console.warn("Could not fetch app metadata", e);
    }
    return null;
}

async function fetchReviews() {
    const urlInput = document.getElementById('urlInput').value.trim();
    const countrySelect = document.getElementById('countrySelect').value;
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const fetchBtn = document.getElementById('fetchBtn');
    const errorContainer = document.getElementById('errorContainer');
    const errorMsg = document.getElementById('errorMsg');
    const resultsContainer = document.getElementById('resultsContainer');
    const appInfoContainer = document.getElementById('appInfoContainer');
    const defaultTitle = document.getElementById('defaultTitle');

    errorContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    appInfoContainer.classList.add('hidden');
    defaultTitle.classList.remove('hidden');
    allFetchedReviews = [];
    currentAppName = 'app_reviews';

    if (!urlInput) {
        showError("Please enter a valid App Store URL.");
        return;
    }

    const idMatch = urlInput.match(/id(\d+)/);
    if (!idMatch) {
        showError("Could not find App ID. Ensure link contains 'id' followed by numbers.");
        return;
    }
    const appId = idMatch[1];

    let country = 'us';
    if (countrySelect !== 'auto') {
        country = countrySelect;
    } else {
        const countryMatch = urlInput.match(/apps\.apple\.com\/([a-z]{2})\//);
        if (countryMatch) country = countryMatch[1];
    }

    fetchBtn.disabled = true;
    btnText.textContent = "Fetching...";
    btnLoader.classList.remove('hidden');

    try {
        const appMetadata = await fetchAppInfo(appId, country);

        if (appMetadata) {
            currentAppName = appMetadata.trackName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\u00C0-\uFFFF]/g, '');
            document.getElementById('appNameDisplay').textContent = appMetadata.trackName;
            document.getElementById('appIcon').src = appMetadata.artworkUrl60 || '';

            appInfoContainer.classList.remove('hidden');
            appInfoContainer.classList.add('flex');
            defaultTitle.classList.add('hidden');
        }

        const rssUrl = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`;

        let response;
        try {
            const p1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
            response = await fetch(p1);
            if (!response.ok) throw new Error('P1');
        } catch (e) {
            console.warn("Proxy 1 fail, trying backup");
            try {
                const p2 = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;
                response = await fetch(p2);
                if (!response.ok) throw new Error('P2');
            } catch (e2) {
                throw new Error(`Failed to connect. Check internet or try again later.`);
            }
        }

        const textData = await response.text();
        let data;
        try { data = JSON.parse(textData); } catch (e) { throw new Error("Invalid data from Apple."); }

        if (!data.feed || !data.feed.entry) {
            showError(`No reviews found for country: ${country.toUpperCase()}. Try switching region.`);
            resetBtn();
            return;
        }

        allFetchedReviews = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];
        renderTable();

        setTimeout(initDirectionalButtons, 100);

    } catch (err) {
        console.error(err);
        showError(err.message);
    } finally {
        resetBtn();
    }
}

function renderTable() {
    const tbody = document.querySelector('#reviewsTable tbody');
    const resultsContainer = document.getElementById('resultsContainer');
    const limit = parseInt(document.getElementById('limitRange').value);

    const countStr = `(${Math.min(limit, allFetchedReviews.length)}/${allFetchedReviews.length})`;
    document.getElementById('resultsCount').textContent = countStr + " reviews";
    document.getElementById('resultsCountFallback').textContent = allFetchedReviews.length;

    tbody.innerHTML = '';
    const entries = allFetchedReviews.slice(0, limit);

    entries.forEach(entry => {
        const dateObj = entry.updated ? new Date(entry.updated.label) : new Date();
        const dateStr = dateObj.toLocaleDateString();
        const rating = entry['im:rating'] ? parseInt(entry['im:rating'].label) : 0;
        const version = entry['im:version'] ? entry['im:version'].label : '-';
        const author = entry.author ? entry.author.name.label : 'Anon';
        const title = entry.title ? entry.title.label : '';
        const content = entry.content ? entry.content.label : '';

        let stars = '';
        for (let i = 1; i <= 5; i++) stars += (i <= rating) ? '<span class="text-yellow-400">★</span>' : '<span class="text-slate-300 dark:text-slate-600">★</span>';

        const row = `
            <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td class="p-5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono" data-val="${dateObj.getTime()}">${dateStr}</td>
                <td class="p-5 text-xs text-slate-400 dark:text-slate-500 font-mono">${version}</td>
                <td class="p-5 whitespace-nowrap text-lg leading-none" data-val="${rating}">${stars}</td>
                <td class="p-5 text-sm font-medium text-slate-700 dark:text-slate-200">${author}</td>
                <td class="p-5 max-w-xl">
                    <div class="font-bold text-slate-800 dark:text-white mb-1 text-sm">${title}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${content}</div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    resultsContainer.classList.remove('hidden');
    document.querySelectorAll('.sort-icon').forEach(i => i.textContent = '↕');
}

function downloadCSV() {
    if (!allFetchedReviews.length) { showError("No data."); return; }
    const limit = parseInt(document.getElementById('limitRange').value);
    const data = allFetchedReviews.slice(0, limit);
    const headers = ['Date', 'Version', 'Rating', 'Author', 'Title', 'Review'];

    const rows = data.map(e => {
        const d = e.updated ? new Date(e.updated.label).toLocaleDateString() : '';
        const v = e['im:version'] ? e['im:version'].label : '';
        const r = e['im:rating'] ? e['im:rating'].label : '';
        const a = e.author ? e.author.name.label : '';
        const t = e.title ? e.title.label : '';
        const c = e.content ? e.content.label : '';
        const esc = txt => `"${(txt || '').toString().replace(/"/g, '""')}"`;
        return [esc(d), esc(v), esc(r), esc(a), esc(t), esc(c)].join(',');
    });

    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentAppName}_reviews.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded', 'CSV file saved');
}

function copyTable() {
    const range = document.createRange();
    range.selectNode(document.getElementById('reviewsTable'));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    showToast('Success', 'Table copied');
}

let sortDir = 'asc'; let lastCol = -1;
function sortTable(idx, type) {
    const table = document.getElementById("reviewsTable");
    let rows = Array.from(table.rows).slice(1);
    let dir = (lastCol === idx && sortDir === 'asc') ? 'desc' : 'asc';
    lastCol = idx; sortDir = dir;

    document.querySelectorAll('.sort-icon').forEach(i => i.textContent = '↕');
    table.rows[0].cells[idx].querySelector('.sort-icon').textContent = dir === 'asc' ? '↑' : '↓';

    rows.sort((a, b) => {
        let x = a.cells[idx].getAttribute('data-val') || a.cells[idx].textContent.toLowerCase();
        let y = b.cells[idx].getAttribute('data-val') || b.cells[idx].textContent.toLowerCase();
        if (type === 'number' || type === 'date') { x = parseFloat(x); y = parseFloat(y); }
        return dir === 'asc' ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
    });
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

function initDirectionalButtons() {
    document.querySelectorAll('.btn-directional').forEach(btn => {
        if (btn.dataset.init) return;
        btn.dataset.init = "true";
        const update = (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const w = rect.width; const h = rect.height;

            const distTop = y;
            const distBottom = h - y;
            const distLeft = x;
            const distRight = w - x;

            const min = Math.min(distTop, distBottom, distLeft, distRight);
            let direction;

            if (min === distTop) direction = 0;
            else if (min === distBottom) direction = 2;
            else if (min === distLeft) direction = 3;
            else direction = 1;

            let origin, transformFrom;
            switch (direction) {
                case 0: origin = 'top center'; transformFrom = 'scale(1, 0)'; break;
                case 1: origin = 'right center'; transformFrom = 'scale(0, 1)'; break;
                case 2: origin = 'bottom center'; transformFrom = 'scale(1, 0)'; break;
                case 3: origin = 'left center'; transformFrom = 'scale(0, 1)'; break;
            }

            btn.style.setProperty('--origin', origin);
            btn.style.setProperty('--transform-from', transformFrom);
        };
        btn.addEventListener('mouseenter', e => update(e));
        btn.addEventListener('mouseleave', e => update(e));
    });
}

function resetBtn() {
    document.getElementById('fetchBtn').disabled = false;
    document.getElementById('btnText').textContent = "Analyze";
    document.getElementById('btnLoader').classList.add('hidden');
}
function showError(msg) {
    document.getElementById('errorContainer').classList.remove('hidden');
    document.getElementById('errorMsg').textContent = msg;
}
function showToast(title, msg) {
    const t = document.getElementById('toast');
    t.querySelector('.font-bold').textContent = title;
    t.querySelector('.opacity-90').textContent = msg;
    t.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-24', 'opacity-0'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    initCustomSelect();
    initDirectionalButtons();

    document.getElementById('customSelectTrigger').addEventListener('click', toggleCustomSelect);
    document.getElementById('fetchBtn').addEventListener('click', fetchReviews);
    document.getElementById('exportBtn').addEventListener('click', downloadCSV);
    document.getElementById('copyBtn').addEventListener('click', copyTable);
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('limitRange').addEventListener('input', e => updateLimitDisplay(e.target.value));

    document.querySelectorAll('th').forEach((th, i) => {
        th.addEventListener('click', () => sortTable(i, th.dataset.sort));
    });
});