# 🍏 App Store Reviews Extractor

A simple, modern web tool for quickly viewing and downloading App Store reviews. Runs 100% in the browser—no backend, no server configuration, and no fees.

## How it works

Paste a link to any App Store app (e.g., Instagram, Uber, or your local banking app), and the tool will:

1. **Fetch** the latest user reviews using a secure proxy.
2. **Display** them in a sortable, clean table.
3. **Export** data to `.csv` (Excel compatible) or copy the table to the clipboard.

## ✨ Key Features

* **Safe Proxy:** Bypasses Apple's CORS restrictions using public proxies (`AllOrigins` / `CorsProxy`), allowing it to run on static hosting (like GitHub Pages).
* **CSV Export:** Generates files with proper encoding (supports emojis and special characters) ready for Excel or Google Sheets. Filenames are automatically generated from the app name.
* **Modern Design:** Default Dark Mode, Glassmorphism effects, and smooth animations.
* **Directional Hover:** Buttons feature a unique highlight effect based on the cursor's entry direction.
* **Region Selection:** View reviews from the US, UK, Germany, Poland, and many other countries.

## ⚠️ Important Note on Limits

You might notice a slider limiting results to a maximum of **50 items**.
This tool uses Apple's public RSS feed, which strictly returns only the **50 most recent reviews** per country. This is an Apple-side limitation that cannot be bypassed without a paid developer account and a dedicated backend server. However, it is perfectly sufficient for quick trend analysis and spotting recent issues.

## 🛠️ Tech Stack

* **HTML5 & Tailwind CSS** (via CDN) - Structure and styling.
* **Vanilla JavaScript** - Logic, data fetching, and DOM manipulation.
* **Apple RSS Feed** - Data source.

## License

MIT. Feel free to use, modify, and improve!
