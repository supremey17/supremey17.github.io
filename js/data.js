/*
 * Portfolio content. This is the only file you need to edit to change what the site shows.
 * Anything wrapped in [brackets] is a placeholder: replace it with your real details.
 * Each project is a "track" on the deck. Order here = order of the pads (A1, A2, ...).
 */
window.PORTFOLIO = {
  owner: {
    name: "Saul [Last Name]",
    title: "[Software Developer / Student]",
    location: "[City, State]",
    bio: "[Two or three sentences about you: what you study or work on, what you enjoy building, and the kind of role you're looking for.]",
    email: "[you@example.com]",
    github: "https://github.com/supremey17",
    githubHandle: "supremey17",
    linkedin: "[https://www.linkedin.com/in/your-handle]",
    resumePdf: "", // optional: put resume.pdf next to index.html and set this to "resume.pdf"
    skills: [
      { group: "Languages", items: ["Java", "Swift", "JavaScript", "R", "HTML & CSS"] },
      { group: "Frameworks & tools", items: ["JavaFX", "SwiftUI", "Maven", "Xcode", "Quarto", "Git & GitHub"] },
      { group: "Data & ML", items: ["dplyr / tidyverse", "ggplot2", "caret", "Random Forest", "Logistic regression"] },
      { group: "Practices", items: ["REST API integration", "Unit testing", "Rate limiting & caching", "On-device privacy"] }
    ],
    education: [
      { school: "[School name]", degree: "[Degree, major]", years: "[Start – End]" }
    ],
    experience: [
      { role: "[Role]", org: "[Company or club]", years: "[Start – End]", summary: "[One line on what you did.]" }
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
      duration: "Sep – Oct 2026",
      tagline: "A rebuilt weather app for desktop (JavaFX) and iPhone (SwiftUI).",
      description:
        "A ground-up revamp of my first weather app. The desktop version is Java 21 with JavaFX, and the iOS version is a native SwiftUI app. Both pull live data from OpenWeatherMap and turn it into clothing and sunscreen advice for a pixel-art avatar.",
      highlights: [
        "RequestGate: caches results for 10 minutes, merges duplicate requests and caps each phone at 20 calls a minute, with a clear \"slow down\" message on HTTP 429.",
        "City search autocomplete from Apple MapKit, debounced at 250 ms, so typing never spends the shared API key.",
        "Full forecast view: feels-like, wind, UV, air quality, next 24 hours and 5-day outlook, shown in the searched city's own time zone.",
        "Your photo as the avatar: background removed on-device with Vision person segmentation, then pixelated. Nothing leaves the phone.",
        "SPF recommendations matched to the UV index, and a metric/imperial toggle that re-fetches real values.",
        "63 automated tests with Swift Testing."
      ],
      tech: ["Java 21", "JavaFX", "Maven", "Swift", "SwiftUI", "Vision", "MapKit", "OpenWeatherMap API"],
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
      duration: "7-week team project",
      tagline: "Machine learning on almost a million international flight records.",
      description:
        "A team data-analysis project on international air traffic crossing US borders. We cleaned and explored close to one million rows of departure and passenger data in R, then built models to forecast flight volume and flag high-traffic routes.",
      highlights: [
        "Cleaned and validated two industry-scale datasets (departures and passengers), handling missing values and outliers.",
        "Exploratory analysis with line plots and heatmaps: July and August dominate, and MIA, JFK and LAX carry most international traffic.",
        "Baselines with linear and logistic regression, then decision trees and a Random Forest ensemble.",
        "Random Forest clearly beat the linear baselines on high-traffic route classification (ROC curves, accuracy and Kappa).",
        "Written up as a reproducible Quarto report with real-world recommendations for logistics planning.",
        "[Add your own role on the team here, e.g. which models or charts you owned.]"
      ],
      tech: ["R", "Quarto", "tidyverse", "ggplot2", "caret", "ranger", "rpart", "pROC"],
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
      tagline: "The original web weather app that started it all.",
      description:
        "My first weather app, written in JavaScript for the browser. It searches a city and shows current conditions from a live weather API. Weather App 2.0 grew out of this project.",
      highlights: [
        "City search with live current conditions from a weather API.",
        "Plain JavaScript, HTML and CSS with no framework.",
        "Released under the MIT license.",
        "[Add one or two features you're proud of here.]"
      ],
      tech: ["JavaScript", "HTML", "CSS", "Weather API"],
      repo: "https://github.com/supremey17/Weather-app",
      private: false,
      color: "#c95f7a"
    },
    {
      id: "java-collection",
      title: "Java Projects",
      artist: "supremey17",
      side: "B",
      bpm: 100,
      year: "2026",
      duration: "Coursework collection",
      tagline: "A collection of smaller Java programs.",
      description:
        "A set of Java programs from coursework and practice. [Describe two or three of the programs here.]",
      highlights: [
        "[Program 1: what it does]",
        "[Program 2: what it does]"
      ],
      tech: ["Java"],
      repo: "https://github.com/supremey17/Java",
      private: true, // this repo is private on GitHub, so visitors would get a 404. Make it public, or delete this track.
      color: "#8f7ad1"
    }
  ]
};
