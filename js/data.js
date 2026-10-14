
Hi saul,
Excited to get started on Get a job. Here are a few ways to begin.

can you tailor my resume to fit the requirements. Look at professional resumes and decide on the best template, if you need to add more to the resume ask me questions and i can provide more projects i have worked on. You can reference past chats to look for impressive projects that you can include.

On it, starting your resume now.



Sure, filling in your portfolio now.






Starting by finding your DJ turntable portfolio repo on GitHub and reading your updated resume.

Added supremey17/java to this thread
Read resume and earlier thread

Reviewed the turntable site (supremey17.github.io)

Rewrote window.PORTFOLIO from the resume and repos

Rendered the site with the new file, no placeholders left

I rewrote the file in the same format, and I loaded it into your site to test it: 
data.js. Everything rendered with no placeholders left. To use it, replace js/data.js in your supremey17.github.io repo with it.

What I filled in from your resume: your title, Rochester NY, a bio, your iCloud email, LinkedIn, SUNY Brockport (Dean’s List, expected May 2027), Wegmans, and skills that match the resume.

Weather App 2.0: I changed “63 tests” to “130+”. The repo has 132 tests, so 63 was out of date.

Sky Traffic: it now says what your commits show you did: data cleaning, the seasonal chart, the correlation matrix and the log-scale boxplots. It also says your teammates did the modeling.

Two problems I found in your repos:

Weather-app has none of your app’s code. Anyone who opens that repo will see someone else’s npm package called yocto-queue, plus a few Expo config files. Its MIT license also belongs to that package. I rewrote that track to describe the React Native/Expo app from your original resume, so it stopped claiming “plain JavaScript, MIT”. Push your real source to that repo, or tell me and I’ll remove the track.
Your Java repo only has a README, so I removed the Java Projects track. It would have shown up as a locked, empty record.
I left out Wire Tech because you asked me to swap it out of the resume. Tell me if you want it on the site. If you’d like, I can also open a PR to your site repo that adds this file and your resume PDF as a download button.




data.js
JS

data.js
8m ago
/*
 * Portfolio content. This is the only file you need to edit to change what the site shows.
 * Anything wrapped in [brackets] is a placeholder: replace it with your real details.
 * Each project is a "track" on the deck. Order here = order of the pads (A1, A2, ...).
 */
window.PORTFOLIO = {
  owner: {
    name: "Saul Villa",
    title: "Computer Science Student · Software Developer",
    location: "Rochester, NY",
    bio: "I'm a Computer Science student at SUNY Brockport (graduating May 2027) who likes to build, test and document software that actually works, then explain it clearly to technical and non-technical people. Lately that means a weather app I took from a Java desktop app to a native iPhone app, plus data analysis in R. I'm looking for a Summer 2027 internship in IT, software development or data.",
    email: "Saulvilla0527@icloud.com",
    github: "https://github.com/supremey17",
    githubHandle: "supremey17",
    linkedin: "https://www.linkedin.com/in/saulvilla27",
    resumePdf: "", // optional: put resume.pdf next to index.html and set this to "resume.pdf"
    skills: [
      { group: "Languages", items: ["Java", "Swift", "Python", "R", "SQL", "JavaScript", "TypeScript", "HTML & CSS"] },
      { group: "Frameworks & tools", items: ["SwiftUI", "JavaFX", "React", "Maven", "Xcode", "IntelliJ IDEA", "VS Code", "Git & GitHub"] },
      { group: "Data", items: ["dplyr / tidyverse", "ggplot2", "Quarto", "MySQL", "Data cleaning", "Exploratory analysis"] },
      { group: "Practices", items: ["REST API integration", "Unit testing", "Rate limiting & caching", "On-device privacy", "Technical documentation", "Microsoft Office"] }
    ],
    education: [
      { school: "State University of New York at Brockport", degree: "B.S. in Computer Science · Dean's List", years: "Expected May 2027" }
    ],
    experience: [
      { role: "Customer Service Representative", org: "Wegmans · Rochester, NY", years: "Dec 2024 – Present", summary: "Resolve customer issues in a high-volume store, coordinate with staff across departments during peak hours, and handle transactions while protecting customer information." }
    ]
  },
 
  tracks: [
    {
      id: "weather-2",
      title: "Weather App 2.0",
      artist: "supremey17",
      side: "A",
      bpm: 128,
      year: "2026",
      duration: "Sep 2026 – Present",
      tagline: "A rebuilt weather app for desktop (JavaFX) and iPhone (SwiftUI).",
      description:
        "A ground-up revamp of my first weather app. It started as a Java 21 desktop app with JavaFX, and I ported it to iOS as a native SwiftUI app (45 source files, about 7,900 lines). Both pull live data from the OpenWeatherMap REST API and turn it into clothing and sunscreen advice for a pixel-art avatar.",
      highlights: [
        "RequestGate: caches results for 10 minutes, merges duplicate requests and caps each phone at 20 calls a minute, keeping a shared API key within its limits, with a clear \"slow down\" message on HTTP 429.",
        "City search autocomplete from Apple MapKit, debounced at 250 ms, with saved cities shown first, so typing never spends the shared API key.",
        "Full forecast view: feels-like, wind, UV, air quality, next 24 hours and 5-day outlook, shown in the searched city's own time zone.",
        "Your photo as the avatar: background removed on-device with Vision person segmentation, then pixelated. No server, no accounts, no cloud backup, and nothing leaves the phone.",
        "SPF recommendations matched to the UV index, and a metric/imperial toggle that re-fetches real values instead of just relabeling them.",
        "130+ automated tests with Swift Testing, plus plain-language notes on every design decision and trade-off."
      ],
      tech: ["Java 21", "JavaFX", "Maven", "Swift", "SwiftUI", "Vision", "MapKit", "OpenWeatherMap API", "Swift Testing"],
      repo: "https://github.com/supremey17/weather-app2.0",
      private: false,
      color: "#e8a33d"
    },
    {
      id: "sky-traffic",
      title: "Sky Traffic Analytics",
      artist: "Group 5 · Data Analysis",
      side: "A",
      bpm: 110,
      year: "2026",
      duration: "Mar – May 2026 · 3-person team",
      tagline: "Exploring 1.6M+ U.S. international flight records in R.",
      description:
        "A three-person data-analysis project on international air traffic crossing U.S. borders. We worked through 1.6 million+ rows of departure and passenger data in R and coordinated through GitHub. My part was cleaning the data and building the exploratory charts; the final Quarto report also compared regression baselines against a Random Forest model for predicting high-traffic routes.",
      highlights: [
        "Cleaned and filtered the departures and passengers datasets down to the 2000–2011 study window.",
        "Built a reusable seasonal-trend chart showing that July and August are the peak travel months.",
        "Built a correlation matrix across the traffic variables to guide which features the team modeled.",
        "Fixed skewed outlier boxplots with a log-scale axis, which made the busiest hubs (JFK, MIA, LAX) readable.",
        "Wrote plain-language insights for the final report so non-technical readers could follow the findings.",
        "Teammates owned the modeling: linear and logistic baselines, decision trees and a Random Forest."
      ],
      tech: ["R", "Quarto", "dplyr", "tidyverse", "ggplot2", "Git & GitHub"],
      repo: "https://github.com/DarylDjelou/SkyTrafficAnalytics",
      private: false,
      color: "#5fa8c9"
    },
    {
      id: "weather-1",
      title: "Weather App",
      artist: "supremey17",
      side: "B",
      bpm: 96,
      year: "2026",
      duration: "Apr – Aug 2026",
      tagline: "The original mobile weather and outfit app that started it all.",
      description:
        "My first weather app: a cross-platform mobile app built with React Native, Expo and TypeScript. It gets real-time weather for wherever you are and suggests what to wear. Weather App 2.0 grew out of this project.",
      highlights: [
        "Real-time weather based on the phone's location (expo-location), fetched with axios.",
        "Decision logic that turns temperature and conditions into personalized clothing recommendations.",
        "Data-driven UI components with conditional styling (NativeWind / Tailwind) and state managed with React Hooks.",
        "Runs on iOS, Android and web from one TypeScript codebase with Expo Router."
      ],
      tech: ["React Native", "Expo", "TypeScript", "NativeWind", "axios", "Weather API"],
      repo: "https://github.com/supremey17/Weather-app",
      private: false,
      color: "#c95f7a"
    }
  ]
};
 

1
1 artifact
Today


10m ago
Starting by finding your DJ turntable portfolio repo on GitHub and reading your updated resume.

10m ago
New
Added supremey17/java to this thread
9m ago
Read resume and earlier thread

Reviewed the turntable site (supremey17.github.io)

Rewrote window.PORTFOLIO from the resume and repos

Rendered the site with the new file, no placeholders left

I rewrote the file in the same format, and I loaded it into your site to test it: 
data.js. Everything rendered with no placeholders left. To use it, replace js/data.js in your supremey17.github.io repo with it.

What I filled in from your resume: your title, Rochester NY, a bio, your iCloud email, LinkedIn, SUNY Brockport (Dean’s List, expected May 2027), Wegmans, and skills that match the resume.

Weather App 2.0: I changed “63 tests” to “130+”. The repo has 132 tests, so 63 was out of date.

Sky Traffic: it now says what your commits show you did: data cleaning, the seasonal chart, the correlation matrix and the log-scale boxplots. It also says your teammates did the modeling.

Two problems I found in your repos:

Weather-app has none of your app’s code. Anyone who opens that repo will see someone else’s npm package called yocto-queue, plus a few Expo config files. Its MIT license also belongs to that package. I rewrote that track to describe the React Native/Expo app from your original resume, so it stopped claiming “plain JavaScript, MIT”. Push your real source to that repo, or tell me and I’ll remove the track.
Your Java repo only has a README, so I removed the Java Projects track. It would have shown up as a locked, empty record.
I left out Wire Tech because you asked me to swap it out of the resume. Tell me if you want it on the site. If you’d like, I can also open a PR to your site repo that adds this file and your resume PDF as a download button.


js
data.js

8m ago



Fast mode off
