// ─────────────────────────────────────────────
// UrbanNest — Typography Tokens
// ─────────────────────────────────────────────

export const F = {
  headline: "'Noto Serif', serif",
  body:     "'Nunito Sans', sans-serif",
};

// Font import — paste in index.html <head>
// <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

export const TEXT = {
  // Headings
  pageHeading:   { fontFamily: F.headline, fontSize: 28, fontWeight: 700 },
  sectionTitle:  { fontFamily: F.headline, fontSize: 16, fontWeight: 600 },
  panelLabel:    { fontFamily: F.headline, fontSize: 14, fontWeight: 600 },
  logoName:      { fontFamily: F.headline, fontSize: 14, fontWeight: 600 },

  // Body / UI
  heroSubtitle:  { fontFamily: F.body, fontSize: 13, fontWeight: 400 },
  tabLabel:      { fontFamily: F.body, fontSize: 13, fontWeight: 600 },
  fieldLabel:    { fontFamily: F.body, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  inputText:     { fontFamily: F.body, fontSize: 11, fontWeight: 400 },
  buttonText:    { fontFamily: F.body, fontSize: 13, fontWeight: 700 },
  navItem:       { fontFamily: F.body, fontSize: 12, fontWeight: 500 },
  navSubItem:    { fontFamily: F.body, fontSize: 11, fontWeight: 400 },
  navSection:    { fontFamily: F.body, fontSize: 9,  fontWeight: 700, textTransform: 'uppercase' },
  logoSubtitle:  { fontFamily: F.body, fontSize: 9,  fontWeight: 600, textTransform: 'uppercase' },
  caption:       { fontFamily: F.body, fontSize: 11, fontWeight: 400 },
  footerText:    { fontFamily: F.body, fontSize: 11, fontWeight: 400 },
};
