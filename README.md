# Custom AI Bots

Static site for Custom AI Bots: custom AI agents, MCP integrations, and a free daily US stock volume alerts screen. Hosted on GitHub Pages.

Live at https://www.customsuperbots.com, served by GitHub Pages (see `CNAME`).

DNS: `www` is a CNAME to `brendan1551-pixel.github.io`. The apex `customsuperbots.com` should use GitHub Pages A records (185.199.108.153, .109.153, .110.153, .111.153) so it redirects to `www`.

## Files

- `index.html`, `styles.css`: home page and its styles
- `alerts.html`: standalone daily volume alerts page (self-contained CSS and scripts)
- `favicon.svg`: site icon
- `robots.txt`, `sitemap.xml`: crawler hints
- `CNAME`: custom domain for GitHub Pages
- `docs/`, `mcp/`: Robinhood trading agent (MCP) docs and config

## To do

- [ ] Create a Buttondown account, then set `BUTTONDOWN_USER` near the bottom of `index.html` to turn on the signup form
- [ ] Add a YouTube handle once one is set
