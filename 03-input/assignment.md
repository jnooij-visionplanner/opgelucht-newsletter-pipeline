# Association and Communication

Smokeless Generation NL has been the advocacy association for a smoke-free society since 1974 and is also the initiator of the Smokefree Generation. More about us and the results achieved.

To keep our members and supporters informed, we have a website and a monthly newsletter *Opgelucht* with a circulation of approximately 50,000. A few news items are published weekly on the website, and the monthly newsletter is automatically generated from the website’s news items.

---

# Content

**Sources of the news items:**

- **Google Alerts (85%-90%)**: Results from Google searches in daily news reports. The search terms we currently use: smoking, smoker, smoke-free, smoking ban, tobacco, nicotine, cigarette, rolling tobacco, cigar, waterpipe, shisha, vape, e-cigarette, vaping, e-liquid, snus. The results of all searches appear daily around 12:00 in a Gmail inbox, one email per search term with links to all relevant news articles found. Often, multiple media outlets report on the same topic.
- **Professional reports (5%-10%)**: Reports from the network and field, professional journals, seminars, webinars, LinkedIn, websites, newsletters, WhatsApp groups.
- **Projects (0%-5%)**: Articles about the progress and results of our own projects and developments.
- **Reporting point (0%-5%)**: Reports received via the Reporting Point about violations and distressing situations.

The main source of news items is therefore Google Alerts. After selection for relevance, about 10% to 20% is processed for the website and thus also for the monthly newsletter. A distinction is made between:

- **News articles**: An article is created from the news report with title, intro text, summary, and sources.
- **Short news**: Only the title and link are placed on a list. See: https://cleanairnederland.nl/nieuws/kort-nieuws

---

# Working Method

**Current:**
- The website and newsletter run on the Joomla CMS.
- Google Alerts arrive in a dedicated Gmail inbox.
- There is a Plus subscription to ChatGPT.
- We already have a script that generates a news article based on one or more links on a topic.

**Desired:**
Processing the daily Google Alerts takes a lot of time and effort. We want ChatGPT to handle this as much as possible. This means ChatGPT must gain access to the Gmail account. From the average 10 to 15 emails per day, all topics with link, date, and source must be listed. The list must then be organized by topic.  
An alternative could be replacing Google Alerts with ChatGPT search queries. It is unclear which of the two provides a more complete overview of news items.

**Points of attention:**
- Selecting the 10% to 20% suitable news items will most likely remain manual work. Some news items are not neutral and are clearly written from the industry’s perspective. Sometimes these articles need to be edited by an editor.
- Some news items are behind a paywall. In most cases, they can still be read via https://archive.ph, https://1ft.io, https://12ft.io, or https://web.archive.org. In such cases, we include both the link behind the paywall and the link without the paywall.

**Publication:**
When publishing, the news article is supplemented with photos and a category (Domestic, International, Government, Science, Education, Politics, Short News, Opinion, Association). See: https://cleanairnederland.nl/rookvrij/nieuws

The categories determine the structure of the newsletter and the layout of the website. We aim to produce 4 to 5 articles per week for a complete newsletter and an up-to-date website.

**Publicity via social media:** Facebook, X (formerly Twitter), LinkedIn, Instagram, TikTok, Threads

**Assignment:** Automate reading Google Alerts, extracting sources, converting sources into news articles according to a standard pattern, classifying by type of report, reviewing by a person, and publishing to CMS.

---

# Classification

- **Domestic**
- **International**

**Categories:**
- Government
- Politics
- Science
- Education
- Short news
- Opinion
- Smoke screen
- Association
- Press releases

---

# Standard Pattern

1. Read the following articles:  
   https://...

2. Search for all news articles and reports on the same topic published in the past month.  
3. Create a combined list of all articles mentioned in step 1 and all articles found in step 2. This combined list must have the following properties:  
   - 3a. Display the list in an HTML structure as an unordered list.  
   - 3b. The list begins with the heading: `<p><strong>Sources</strong></p>`  
   - 3c. Show per line: the name of the source, an em dash (—) as separator, the title of the article.  
   - 3d. Sort the list by publication date, from most recent to least recent. If the publication date is unknown, place the article at the bottom of the list.  
   - 3e. Make each line an HTML link pointing to the original source. The link must make the entire line clickable and open in a new window (`target="_blank"`).  
4. Create a short, concise title summarizing the main topic of the Sources list. Maximum length: 36 characters.  
5. Write an introduction text briefly summarizing or introducing the content of the Sources list. Maximum length: 175 characters.  
6. Write a detailed summary of all articles in the Sources list. This summary must form a fluent narrative. Present this narrative in HTML format.

---

# Example News Article

**No to Vaping**  
**Details**  
Monday, May 12, 2025  
Government campaign logo *No to Vaping*

On May 12, the Dutch government launched a campaign and action plan to reduce vape use among young people, with stricter regulations and education.

On March 12, 2025, State Secretary Vincent Karremans presented the "Action Plan Against Vaping" to the House of Representatives. The plan focuses on three main points: strengthening enforcement against illegal vapes, preventing young people from starting to vape, and encouraging quitting. The Dutch Food and Consumer Product Safety Authority (NVWA) will receive additional resources and powers to tackle illegal trade. In addition, raising the age limit for nicotine products to 21 is being considered.

On March 21, 2025, Karremans advocated in Europe for stricter legislation on vapes, including a ban on flavors and plain packaging. He received support from 12 EU member states for these proposals.

The campaign *No to Vaping* starts on May 12, 2025, targeting parents of high school students to raise awareness of the dangers of vaping and support them in conversations with their children.

**Sources**
- KNMG — KNMG supports action plan against vaping
- Government of the Netherlands — Karremans advocates in Europe for much stricter vape legislation
- Lung Fund — Action plan against vaping
- Stichting OPEN — A decisive approach against the vape crisis: time for action!
- Government of the Netherlands — Vapes tackled harder
- Government of the Netherlands — Action plan against vaping
- Government of the Netherlands — Parliamentary letter on action plan against vaping
- NRC — Cabinet wants to tackle vaping: "Has wrongly had an innocent image for too long"

---

# Scope

The scope of the solution is automating the processing of Google Alerts. Other sources are out of scope.

---

# Solution Direction

- Convert Google Alerts from email digest to RSS feed in Google Alerts. Alerts are still set up via https://www.google.com/alerts.
- A maintenance screen for RSS feeds will be created. New feeds can be added. The feed URL can be copied from Google Alerts into this screen.
- If a paywall is encountered, attempts will be made to read the articles via https://archive.ph, https://1ft.io, https://12ft.io, or https://web.archive.org. In such cases, both the paywalled and non-paywalled links will be included as sources.
- Found news items are displayed, and the user can select the relevant ones.
- Relevant items are automatically categorized (with a simple maintenance screen for categories).
- Relevant items are automatically classified as Domestic/International (fixed classification, no maintenance screen).
- Relevant items are automatically converted into a news article according to a fixed structure. The current prompt is the starting point, but refinement and evaluation of results will be necessary. A simple screen for updating the prompt will be provided.
- The generated article is placed in draft in Joomla (from here, manual edits and the publication process can continue). The built solution stops at placing the news article in Joomla.

---

# Requirements

- Client’s time for reviewing the news items

---

# Assumptions

- The client provides a hosting environment where the system can run in production.
- The offer covers the system’s development. For maintenance and changes, we can provide an additional proposal.

We offer the system development at a fixed price. We have strongly considered that Smokeless Generation NL is a non-profit organization, and we are also making an investment in building the AI agent. In return for this cost reduction, Smokeless Generation NL will cooperate in providing a client reference that Info Support can use.