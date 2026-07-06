// Define base static structure first
const transitData = {
    locations: [],
    buses: [],
    // Metro Blue Line Stations (North-South Corridor)
    metroBlue: [
        "Shyambazar",
        "Girish Park",
        "MG Road",
        "Esplanade",
        "Park Street",
        "Rabindra Sadan",
        "Kalighat",
        "Tollygunge",
        "Garia"
    ],
    // Metro Green Line Stations (East-West Corridor)
    metroGreen: [
        "Howrah Station",
        "Esplanade",
        "Sealdah Station",
        "Salt Lake Karunamoyee",
        "Salt Lake Sector V"
    ],
    // Suburban Rail sections
    suburbanRail: [
        {
            name: "Sealdah Suburban (South Line)",
            stations: ["Sealdah Station", "Park Circus", "Gariahat", "Jadavpur", "Garia"]
        },
        {
            name: "Howrah-Sealdah Link (Circular/Chord)",
            stations: ["Howrah Station", "Sealdah Station"]
        }
    ],
    // Auto routes
    autos: [
        { route: ["Gariahat", "Kalighat"], fare: 15, durationMin: 10 },
        { route: ["Jadavpur", "Gariahat"], fare: 15, durationMin: 12 },
        { route: ["Tollygunge", "Jadavpur"], fare: 20, durationMin: 15 },
        { route: ["Girish Park", "Shobhabazar"], fare: 12, durationMin: 8 }
    ]
};

// Dynamic dataset parser
function loadDynamicDataset() {
    transitData.busLocations = new Set();
    const rawRoutes = [];
    if (typeof routes1 !== 'undefined') rawRoutes.push(...routes1);
    if (typeof routes2 !== 'undefined') rawRoutes.push(...routes2);
    if (typeof routes3 !== 'undefined') rawRoutes.push(...routes3);
    if (typeof routes4 !== 'undefined') rawRoutes.push(...routes4);

    const locationsSet = new Set([
        ...transitData.metroBlue,
        ...transitData.metroGreen,
        ...transitData.suburbanRail.flatMap(line => line.stations),
        ...transitData.autos.flatMap(a => a.route)
    ]);

    const parsedBuses = [];

    rawRoutes.forEach((routeStr, index) => {
        if (!routeStr || typeof routeStr !== 'string') return;
        
        // Example: "18C:Kestor More to Anandapur [via:Kestor More,Sarsuna, ...] : Timings : ImagePath"
        // Some might not have standard prefix, e.g., "Kolkata to Siliguri Rocket :(NBSTC)..."
        // Let's parse components
        const parts = routeStr.split(":");
        if (parts.length < 2) return;

        let busNumber = "";
        let routeInfo = "";
        let timings = "Coming Soon";
        let image = "";

        // Check for via bracket
        const viaMatch = routeStr.match(/\[via\s*:\s*([^\]]+)\]/i);
        if (!viaMatch) return; // ignore routes without via list

        const viaStopsText = viaMatch[1];
        const stops = viaStopsText.split(",").map(s => s.trim()).filter(Boolean);

        // Find bus number/prefix before via
        const beforeVia = routeStr.split(/\[via/i)[0];
        
        // Find if there is a colon before the route endpoints
        const firstColonIdx = beforeVia.indexOf(":");
        if (firstColonIdx !== -1) {
            busNumber = beforeVia.substring(0, firstColonIdx).trim();
            routeInfo = beforeVia.substring(firstColonIdx + 1).trim();
        } else {
            // No prefix colon: use the whole beforeVia as the label/name
            routeInfo = beforeVia.trim();
            busNumber = routeInfo.split("to")[0].trim() || `Bus-${index}`;
        }

        // Clean up timing info
        const afterViaBracket = routeStr.substring(routeStr.indexOf(viaMatch[0]) + viaMatch[0].length);
        const remainingParts = afterViaBracket.split(":").map(p => p.trim()).filter(Boolean);
        if (remainingParts.length > 0) {
            timings = remainingParts[0];
        }
        if (remainingParts.length > 1) {
            image = remainingParts[1];
        }

        // Add stops to locations set
        stops.forEach(s => {
            locationsSet.add(s);
            transitData.busLocations.add(s);
        });

        // Determine a fleet color based on the bus number or index for UI variety
        const colors = ["yellow-brown", "blue-yellow", "white-yellow", "red-white", "green-white"];
        const colorIndex = Math.abs(busNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
        const color = colors[colorIndex];
        const colorLabel = color.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-') + " Fleet";

        parsedBuses.push({
            number: busNumber,
            color: color,
            colorLabel: colorLabel,
            route: stops,
            costPerStop: 1.5,
            baseFare: 10,
            avgSpeedKmh: 16,
            timings: timings,
            image: image
        });
    });

    transitData.locations = Array.from(locationsSet).sort();
    transitData.buses = parsedBuses;
}

// Initialize dynamic load
loadDynamicDataset();


// UI Element References
const fromInput = document.getElementById("from-input");
const toInput = document.getElementById("to-input");
const fromList = document.getElementById("from-list");
const toList = document.getElementById("to-list");
const clearFromBtn = document.getElementById("clear-from");
const clearToBtn = document.getElementById("clear-to");
const swapBtn = document.getElementById("swap-btn");
const routeForm = document.getElementById("route-form");
const welcomeState = document.getElementById("welcome-state");
const resultsState = document.getElementById("results-state");
const routeSummaryTitle = document.getElementById("route-summary-title");
const itinerariesList = document.getElementById("itineraries-list");
const logStepsContainer = document.getElementById("log-steps-container");
const mapContainer = document.getElementById("map-container");
const journeyMapEl = document.getElementById("journey-map");
const themeToggle = document.getElementById("theme-toggle");

// ─── Theme Toggle ───────────────────────────────────────────────────────────
(function initTheme() {
    const saved = localStorage.getItem("ktp-theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    updateToggleIcon(saved);
})();

function updateToggleIcon(theme) {
    const icon = themeToggle.querySelector("i");
    if (theme === "dark") {
        icon.className = "fa-solid fa-sun";
        themeToggle.title = "Switch to Light Mode";
    } else {
        icon.className = "fa-solid fa-moon";
        themeToggle.title = "Switch to Dark Mode";
    }
}

themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("ktp-theme", next);
    updateToggleIcon(next);
    // Re-render map if visible so it picks up new theme colours
    if (mapContainer && mapContainer.style.display !== "none" && window._lastMapOptions) {
        renderInteractiveMap(window._lastMapOptions);
    }
});

// ─── Interactive Vis.js Journey Map ─────────────────────────────────────────
let visNetwork = null;

function renderInteractiveMap(options) {
    if (!mapContainer || !journeyMapEl || typeof vis === "undefined") return;
    window._lastMapOptions = options;

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    // Colour palette matching TfL/transit identity
    const modeColors = {
        bus:    { bg: "#DC241F", border: "#9B1A15", font: "#FFFFFF" },
        metro:  { bg: "#0019A8", border: "#00127A", font: "#FFFFFF" },
        rail:   { bg: "#00A0E2", border: "#0077AB", font: "#FFFFFF" },
        auto:   { bg: "#F59E0B", border: "#B45309", font: "#1a1a1a" },
        walk:   { bg: isDark ? "#4B5563" : "#9CA3AF", border: isDark ? "#374151" : "#6B7280", font: "#FFFFFF" },
        origin: { bg: "#007D32", border: "#005825", font: "#FFFFFF" },
        dest:   { bg: "#DC241F", border: "#9B1A15", font: "#FFFFFF" }
    };

    const nodesBg   = isDark ? "#1E2A3B" : "#FFFFFF";
    const edgeColor = isDark ? "#4B6080" : "#CBD5E1";
    const fontColor = isDark ? "#E2E8F0" : "#111827";

    const nodes = [];
    const edges = [];
    const nodeIdMap = {};
    let nodeId = 1;

    function getOrCreateNode(label, type) {
        const key = `${label}__${type}`;
        if (nodeIdMap[key] !== undefined) return nodeIdMap[key];
        const id = nodeId++;
        const col = modeColors[type] || modeColors.walk;
        nodes.push({
            id,
            label: label.length > 18 ? label.slice(0, 16) + "…" : label,
            title: label, // tooltip on hover
            color: { background: col.bg, border: col.border, highlight: { background: col.bg, border: "#FFFFFF" } },
            font: { color: col.font, size: 13, face: "Outfit, sans-serif", bold: true },
            shape: "box",
            margin: 10,
            shadow: { enabled: true, size: 8, x: 2, y: 2, color: "rgba(0,0,0,0.25)" },
            borderWidth: 2,
        });
        nodeIdMap[key] = id;
        return id;
    }

    // Parse all options and build graph
    options.forEach(opt => {
        let prevNodeId = null;
        opt.steps.forEach((step, idx) => {
            // Only build nodes for board/alight steps (not generic walk)
            let nodeType = step.mode || "walk";
            if (idx === 0) nodeType = "origin";
            if (idx === opt.steps.length - 1) nodeType = "dest";

            const thisNodeId = getOrCreateNode(step.title, nodeType);

            if (prevNodeId !== null) {
                const prevStep = opt.steps[idx - 1];
                const edgeMode = prevStep.mode || "walk";
                const col = modeColors[edgeMode] || modeColors.walk;
                let edgeLabel = "";
                if (edgeMode === "bus") edgeLabel = `🚌 Bus`;
                else if (edgeMode === "metro") edgeLabel = `🚇 Metro`;
                else if (edgeMode === "rail") edgeLabel = `🚆 Rail`;
                else if (edgeMode === "auto") edgeLabel = `🛺 Auto`;
                else edgeLabel = `🚶 Walk`;

                edges.push({
                    from: prevNodeId,
                    to: thisNodeId,
                    label: edgeLabel,
                    color: { color: col.bg, highlight: col.border, opacity: 0.9 },
                    font: { color: fontColor, size: 11, face: "Space Grotesk, sans-serif", align: "middle" },
                    width: 3,
                    smooth: { type: "cubicBezier", forceDirection: "horizontal", roundness: 0.4 },
                    arrows: { to: { enabled: true, scaleFactor: 0.8, type: "arrow" } },
                    shadow: { enabled: true }
                });
            }
            prevNodeId = thisNodeId;
        });
    });

    if (nodes.length === 0) { mapContainer.style.display = "none"; return; }

    mapContainer.style.display = "block";

    // Destroy previous network instance
    if (visNetwork) { visNetwork.destroy(); visNetwork = null; }

    const visNodes = new vis.DataSet(nodes);
    const visEdges = new vis.DataSet(edges);

    const visOptions = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: "LR",
                sortMethod: "directed",
                levelSeparation: 200,
                nodeSpacing: 140,
                treeSpacing: 160,
            }
        },
        physics: false,
        interaction: {
            hover: true,
            tooltipDelay: 100,
            zoomView: true,
            dragView: true,
            dragNodes: false,
            navigationButtons: false,
        },
        nodes: {
            shapeProperties: { borderRadius: 6 },
        },
        edges: { scaling: { min: 2, max: 4 } }
    };

    visNetwork = new vis.Network(journeyMapEl, { nodes: visNodes, edges: visEdges }, visOptions);

    // Apply canvas background based on theme
    journeyMapEl.style.background = isDark
        ? "linear-gradient(135deg, hsl(222,47%,8%) 0%, hsl(220,40%,10%) 100%)"
        : "linear-gradient(135deg, #F0F4FF 0%, #EFF6FF 100%)";
}


// Autocomplete Logic Setup
function setupAutocomplete(input, list, clearBtn) {
    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        list.innerHTML = "";
        
        if (!query) {
            list.style.display = "none";
            clearBtn.style.display = "none";
            return;
        }
        
        clearBtn.style.display = "block";
        
        const matches = transitData.locations.filter(loc => 
            loc.toLowerCase().includes(query)
        );
        
        if (matches.length > 0) {
            matches.forEach(match => {
                const div = document.createElement("div");
                div.className = "autocomplete-item";
                
                // Identify transit types for the location
                let types = [];
                if (transitData.metroBlue.includes(match) || transitData.metroGreen.includes(match)) types.push("Metro");
                if (transitData.busLocations && transitData.busLocations.has(match)) types.push("Bus");
                if (transitData.suburbanRail.some(line => line.stations.includes(match))) types.push("Rail");
                if (transitData.autos.some(a => a.route.includes(match))) types.push("Auto");
                
                div.innerHTML = `
                    <span>${match}</span>
                    <span class="type-tag">${types.join(' / ')}</span>
                `;
                
                div.addEventListener("click", () => {
                    input.value = match;
                    list.style.display = "none";
                });
                list.appendChild(div);
            });
            list.style.display = "block";
        } else {
            list.style.display = "none";
        }
    });

    // Close autocomplete on click outside
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !list.contains(e.target)) {
            list.style.display = "none";
        }
    });

    clearBtn.addEventListener("click", () => {
        input.value = "";
        list.innerHTML = "";
        list.style.display = "none";
        clearBtn.style.display = "none";
        input.focus();
    });
}

setupAutocomplete(fromInput, fromList, clearFromBtn);
setupAutocomplete(toInput, toList, clearToBtn);

// Swap from and to
swapBtn.addEventListener("click", () => {
    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
    
    // Toggle clear buttons state
    clearFromBtn.style.display = fromInput.value ? "block" : "none";
    clearToBtn.style.display = toInput.value ? "block" : "none";
});

// Clickable Popular Chips
document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
        fromInput.value = chip.dataset.from;
        toInput.value = chip.dataset.to;
        clearFromBtn.style.display = "block";
        clearToBtn.style.display = "block";
        searchRoutes(fromInput.value, toInput.value);
    });
});

// Form Submission
routeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fromVal = fromInput.value.trim();
    const toVal = toInput.value.trim();
    
    // Validate locations exist in dataset
    if (!transitData.locations.includes(fromVal)) {
        alert(`Location "${fromVal}" is not in our demo dataset. Please select from the autocomplete dropdown.`);
        return;
    }
    if (!transitData.locations.includes(toVal)) {
        alert(`Location "${toVal}" is not in our demo dataset. Please select from the autocomplete dropdown.`);
        return;
    }
    if (fromVal === toVal) {
        alert("Origin and destination cannot be the same!");
        return;
    }
    
    searchRoutes(fromVal, toVal);
});

// Routing Engine
function searchRoutes(from, to) {
    const logs = [];
    const options = [];

    // Helper to log steps
    function logTrace(stepName, message, type = 'checking') {
        logs.push({ stepName, message, type });
    }

    logTrace("Step 1: Direct Bus Search", `Checking direct bus lines between "${from}" and "${to}"...`);
    
    // Step 1: Direct Bus
    let directBusesFound = [];
    transitData.buses.forEach(bus => {
        const fromIdx = bus.route.indexOf(from);
        const toIdx = bus.route.indexOf(to);
        
        if (fromIdx !== -1 && toIdx !== -1) {
            // Bus covers both. Determine order/direction.
            const stopsCount = Math.abs(toIdx - fromIdx);
            const pathStops = fromIdx < toIdx 
                ? bus.route.slice(fromIdx + 1, toIdx)
                : bus.route.slice(toIdx + 1, fromIdx).reverse();
            
            const cost = bus.baseFare + (stopsCount * bus.costPerStop);
            const time = Math.round(10 + (stopsCount * (60 / bus.avgSpeedKmh)));
            
            const option = {
                type: "Direct Bus",
                badge: "badge-direct",
                badgeText: "Direct Bus",
                score: 2,
                time: time,
                cost: cost,
                reason: `Simplest bus journey. Bus ${bus.number} goes directly.`,
                steps: [
                    {
                        title: `Board Bus ${bus.number}`,
                        detail: `Board the ${bus.colorLabel} at ${from}. Travel past ${stopsCount} stops.`,
                        mode: "bus",
                        modeClass: "bus",
                        icon: "fa-bus",
                        fleetColor: bus.color
                    },
                    {
                        title: `Alight at ${to}`,
                        detail: `Destination reached. Expected travel time ~${time} mins.`,
                        mode: "walk",
                        modeClass: "walk",
                        icon: "fa-person-walking"
                    }
                ]
            };
            options.push(option);
            directBusesFound.push(bus.number);
        }
    });

    if (directBusesFound.length > 0) {
        logTrace("Step 1: Direct Bus Search", `SUCCESS! Found direct bus route(s): Bus ${directBusesFound.join(", ")}.`, 'matched');
    } else {
        logTrace("Step 1: Direct Bus Search", `No direct bus route matches your origin and destination.`, 'checking');
    }

    // Step 2: Connecting Bus (Break Journey)
    logTrace("Step 2: Connecting Bus Search", `Checking for break journeys via a shared bus interchange stop...`);
    let breakJourneys = [];
    
    if (directBusesFound.length === 0) {
        // Optimization: only consider buses that actually pass through 'from' or 'to'
        const busesFrom = transitData.buses.filter(b => b.route.includes(from));
        const busesTo = transitData.buses.filter(b => b.route.includes(to));

        busesFrom.forEach(busA => {
            busesTo.forEach(busB => {
                if (busA.number === busB.number) return;
                
                // Find a shared stop 'X'
                const routeBSet = new Set(busB.route);
                const sharedStops = busA.route.filter(stop => routeBSet.has(stop) && stop !== from && stop !== to);
                
                sharedStops.forEach(interchange => {
                    const fromIdxA = busA.route.indexOf(from);
                    const intIdxA = busA.route.indexOf(interchange);
                    const intIdxB = busB.route.indexOf(interchange);
                    const toIdxB = busB.route.indexOf(to);
                    
                    if (fromIdxA !== -1 && intIdxA !== -1 && intIdxB !== -1 && toIdxB !== -1) {
                        const stopsA = Math.abs(intIdxA - fromIdxA);
                        const stopsB = Math.abs(toIdxB - intIdxB);
                        
                        const costA = busA.baseFare + (stopsA * busA.costPerStop);
                        const costB = busB.baseFare + (stopsB * busB.costPerStop);
                        const timeA = Math.round(10 + (stopsA * (60 / busA.avgSpeedKmh)));
                        const timeB = Math.round(10 + (stopsB * (60 / busB.avgSpeedKmh)));
                        
                        const totalCost = costA + costB;
                        const totalTime = timeA + timeB + 10; // add 10 mins transfer buffer
                        
                        breakJourneys.push({
                            busA: busA.number,
                            colorA: busA.color,
                            colorLabelA: busA.colorLabel,
                            busB: busB.number,
                            colorB: busB.color,
                            colorLabelB: busB.colorLabel,
                            interchange: interchange,
                            cost: totalCost,
                            time: totalTime
                        });
                    }
                });
            });
        });
        
        // Remove duplicates and keep only best combinations
        breakJourneys = breakJourneys.filter((val, idx, self) => 
            self.findIndex(t => t.busA === val.busA && t.busB === val.busB && t.interchange === val.interchange) === idx
        );
        
        if (breakJourneys.length > 0) {
            // Take top 2 quickest connecting journeys
            breakJourneys.sort((a,b) => a.time - b.time);
            breakJourneys.slice(0, 2).forEach(bj => {
                options.push({
                    type: "Connecting Bus",
                    badge: "badge-break",
                    badgeText: "Break Journey",
                    score: 5,
                    time: bj.time,
                    cost: bj.cost,
                    reason: `Transfer connection at ${bj.interchange}.`,
                    steps: [
                        {
                            title: `Take Bus ${bj.busA}`,
                            detail: `Board ${bj.colorLabelA} at ${from} and travel to ${bj.interchange}.`,
                            mode: "bus",
                            modeClass: "bus",
                            icon: "fa-bus",
                            fleetColor: bj.colorA
                        },
                        {
                            title: `Transfer at ${bj.interchange}`,
                            detail: `Change fleet to Bus ${bj.busB} (${bj.colorLabelB}). Allow ~10 mins for transfer.`,
                            mode: "transfer",
                            modeClass: "transfer",
                            icon: "fa-arrow-right-arrow-left"
                        },
                        {
                            title: `Take Bus ${bj.busB}`,
                            detail: `Travel on Bus ${bj.busB} to ${to}.`,
                            mode: "bus",
                            modeClass: "bus",
                            icon: "fa-bus",
                            fleetColor: bj.colorB
                        }
                    ]
                });
                logTrace("Step 2: Connecting Bus Search", `Found connecting route: Bus ${bj.busA} ➔ ${bj.interchange} ➔ Bus ${bj.busB} (~${bj.time} mins).`, 'matched');
            });
        } else {
            logTrace("Step 2: Connecting Bus Search", `No viable break-journey bus route found.`, 'checking');
        }
    } else {
        logTrace("Step 2: Connecting Bus Search", `Skipped. Direct bus route is already available.`, 'checking');
    }

    // Step 3: Alternatives (Metro, Rail, Auto, Hybrid)
    logTrace("Step 3: Alternative Modes Evaluation", `Evaluating Metro, Suburban Rail, Auto routes, and hybrid connections...`);

    // 3.1 Metro Direct check
    const fromBlueIdx = transitData.metroBlue.indexOf(from);
    const toBlueIdx = transitData.metroBlue.indexOf(to);
    const fromGreenIdx = transitData.metroGreen.indexOf(from);
    const toGreenIdx = transitData.metroGreen.indexOf(to);

    if (fromBlueIdx !== -1 && toBlueIdx !== -1) {
        const stops = Math.abs(toBlueIdx - fromBlueIdx);
        const time = stops * 3 + 4; // 3 mins per stop + 4 mins buffer
        const cost = 5 + Math.ceil(stops / 2) * 5; // simplified Kolkata Metro fare structure
        
        options.push({
            type: "Metro (Blue Line)",
            badge: "badge-fastest",
            badgeText: "Fastest / Direct Metro",
            score: 1,
            time: time,
            cost: cost,
            reason: "Highly recommended: Traffic-free, fast transit along the main North-South axis.",
            steps: [
                {
                    title: "Enter Metro (Blue Line)",
                    detail: `Board Blue Line train at ${from} towards destination. Travel ${stops} stops.`,
                    mode: "metro",
                    modeClass: "metro",
                    icon: "fa-train-subway"
                },
                {
                    title: `Alight at ${to}`,
                    detail: "Expected travel is traffic-free and comfortable.",
                    mode: "walk",
                    modeClass: "walk",
                    icon: "fa-person-walking"
                }
            ]
        });
        logTrace("Step 3: Metro Direct", `SUCCESS: Direct Metro (Blue Line) matches both stations: ${from} ↔ ${to}.`, 'matched');
    } else if (fromGreenIdx !== -1 && toGreenIdx !== -1) {
        const stops = Math.abs(toGreenIdx - fromGreenIdx);
        const time = stops * 3 + 4;
        const cost = 5 + Math.ceil(stops / 2) * 5;
        
        options.push({
            type: "Metro (Green Line)",
            badge: "badge-fastest",
            badgeText: "Fastest / Direct Metro",
            score: 1,
            time: time,
            cost: cost,
            reason: "Highly recommended: Rapid connection along the East-West corridor.",
            steps: [
                {
                    title: "Enter Metro (Green Line)",
                    detail: `Board Green Line train at ${from}. Travel ${stops} stops.`,
                    mode: "metro",
                    modeClass: "metro",
                    icon: "fa-train-subway"
                },
                {
                    title: `Alight at ${to}`,
                    detail: "Expected travel is traffic-free.",
                    mode: "walk",
                    modeClass: "walk",
                    icon: "fa-person-walking"
                }
            ]
        });
        logTrace("Step 3: Metro Direct", `SUCCESS: Direct Metro (Green Line) matches both stations: ${from} ↔ ${to}.`, 'matched');
    } else {
        logTrace("Step 3: Metro Direct", `No direct Metro line covers this full trip.`, 'alternative');
        
        // 3.2 Metro Transfer Check (Blue Line ↔ Green Line via Esplanade interchange)
        const hasBlueLink = fromBlueIdx !== -1 || toBlueIdx !== -1;
        const hasGreenLink = fromGreenIdx !== -1 || toGreenIdx !== -1;
        
        if (hasBlueLink && hasGreenLink) {
            // Find which belongs to which
            const startLine = fromBlueIdx !== -1 ? "Blue" : "Green";
            const endLine = toBlueIdx !== -1 ? "Blue" : "Green";
            
            const startStops = startLine === "Blue" 
                ? Math.abs(fromBlueIdx - transitData.metroBlue.indexOf("Esplanade"))
                : Math.abs(fromGreenIdx - transitData.metroGreen.indexOf("Esplanade"));
                
            const endStops = endLine === "Blue"
                ? Math.abs(toBlueIdx - transitData.metroBlue.indexOf("Esplanade"))
                : Math.abs(toGreenIdx - transitData.metroGreen.indexOf("Esplanade"));
                
            const totalStops = startStops + endStops;
            const time = totalStops * 3 + 12; // 3 mins per stop + 12 mins interchange/waiting time
            const cost = 15; // standard interchange transit fare estimate
            
            options.push({
                type: "Metro Interchange",
                badge: "badge-hybrid",
                badgeText: "Metro Corridor Link",
                score: 3,
                time: time,
                cost: cost,
                reason: "Fastest alternative to beat city traffic: Swap lines at Esplanade Interchange.",
                steps: [
                    {
                        title: `Board Metro (${startLine} Line)`,
                        detail: `Enter metro at ${from} and proceed to Esplanade.`,
                        mode: "metro",
                        modeClass: "metro",
                        icon: "fa-train-subway"
                    },
                    {
                        title: "Interchange at Esplanade",
                        detail: `Follow overhead signs to transfer to the ${endLine} Line platforms.`,
                        mode: "transfer",
                        modeClass: "transfer",
                        icon: "fa-arrows-left-right"
                    },
                    {
                        title: `Board Metro (${endLine} Line)`,
                        detail: `Take the train from Esplanade to ${to}.`,
                        mode: "metro",
                        modeClass: "metro",
                        icon: "fa-train-subway"
                    }
                ]
            });
            logTrace("Step 3: Metro Transfer", `SUCCESS: Metro Corridor Connection found via Esplanade Interchange.`, 'matched');
        } else {
            logTrace("Step 3: Metro Transfer", `Metro interchange is not viable (one or both nodes are disconnected from the metro grid).`, 'alternative');
        }
    }

    // 3.3 Suburban Rail Direct Check
    let railFound = false;
    transitData.suburbanRail.forEach(line => {
        const fromIdx = line.stations.indexOf(from);
        const toIdx = line.stations.indexOf(to);
        
        if (fromIdx !== -1 && toIdx !== -1) {
            const stops = Math.abs(toIdx - fromIdx);
            const time = stops * 4 + 10; 
            const cost = 10; // Flat cheap suburban rail rate
            
            options.push({
                type: "Suburban Rail",
                badge: "badge-cheapest",
                badgeText: "Cheapest Option",
                score: 2.5,
                time: time,
                cost: cost,
                reason: `Extremely economical rail transit via ${line.name}.`,
                steps: [
                    {
                        title: `Board Local Train`,
                        detail: `Board at ${from} Station. Travel along ${line.name}.`,
                        mode: "rail",
                        modeClass: "rail",
                        icon: "fa-train"
                    },
                    {
                        title: `Exit at ${to} Station`,
                        detail: "Cheapest commuter connection reached.",
                        mode: "walk",
                        modeClass: "walk",
                        icon: "fa-person-walking"
                    }
                ]
            });
            railFound = true;
            logTrace("Step 3: Suburban Rail", `SUCCESS: Found direct suburban local train connection via "${line.name}".`, 'matched');
        }
    });
    if (!railFound) {
        logTrace("Step 3: Suburban Rail", `No direct local suburban rail matches between start/end points.`, 'alternative');
    }

    // 3.4 Direct Auto check
    let autoFound = false;
    transitData.autos.forEach(auto => {
        const fromIdx = auto.route.indexOf(from);
        const toIdx = auto.route.indexOf(to);
        
        if (fromIdx !== -1 && toIdx !== -1) {
            options.push({
                type: "Auto-Rickshaw",
                badge: "badge-direct",
                badgeText: "Short Direct Auto",
                score: 1.5,
                time: auto.durationMin,
                cost: auto.fare,
                reason: "Perfect for short commutes: bypasses transit wait times.",
                steps: [
                    {
                        title: "Board Auto-Rickshaw",
                        detail: `Take the local shared auto from ${from} to ${to}.`,
                        mode: "auto",
                        modeClass: "auto",
                        icon: "fa-taxi"
                    }
                ]
            });
            autoFound = true;
            logTrace("Step 3: Auto-Rickshaw", `SUCCESS: Direct shared-auto route connects these neighborhoods.`, 'matched');
        }
    });
    if (!autoFound) {
        logTrace("Step 3: Auto-Rickshaw", `No direct auto routes exist between these points.`, 'alternative');
    }

    // 3.5 Hybrid Combo (e.g. Jadavpur to Girish Park)
    // Jadavpur (not on Metro) -> Bus/Auto -> Kalighat (Metro) -> Metro to Girish Park
    let hybridFound = false;
    
    // Check if one node is NOT on metro, but can be linked to a metro station
    const fromInMetro = transitData.metroBlue.includes(from) || transitData.metroGreen.includes(from);
    const toInMetro = transitData.metroBlue.includes(to) || transitData.metroGreen.includes(to);
    
    if (!fromInMetro || !toInMetro) {
        // Let's check Jadavpur & Gariahat as classic non-metro starting hubs
        const nonMetroHub = !fromInMetro ? from : to;
        const metroHub = !fromInMetro ? to : from;
        
        // Find if there is a bus connecting the nonMetroHub to a metro station
        let connectBus = null;
        let connectStop = null;
        
        // Look for connection to Kalighat or Rabindra Sadan or Esplanade
        const candidateHubs = ["Kalighat", "Rabindra Sadan", "Esplanade", "Sealdah Station", "Howrah Station"];
        
        for (let hub of candidateHubs) {
            // Find a bus between nonMetroHub and this hub
            const bus = transitData.buses.find(b => b.route.includes(nonMetroHub) && b.route.includes(hub));
            if (bus) {
                connectBus = bus;
                connectStop = hub;
                break;
            }
        }
        
        if (connectBus && connectStop) {
            // Now calculate metro leg from connectStop to metroHub
            const isBlueA = transitData.metroBlue.includes(connectStop);
            const isBlueB = transitData.metroBlue.includes(metroHub);
            const isGreenA = transitData.metroGreen.includes(connectStop);
            const isGreenB = transitData.metroGreen.includes(metroHub);
            
            let metroStops = 0;
            let metroLineName = "";
            let validMetroLeg = false;
            
            if (isBlueA && isBlueB) {
                metroStops = Math.abs(transitData.metroBlue.indexOf(connectStop) - transitData.metroBlue.indexOf(metroHub));
                metroLineName = "Blue Line";
                validMetroLeg = true;
            } else if (isGreenA && isGreenB) {
                metroStops = Math.abs(transitData.metroGreen.indexOf(connectStop) - transitData.metroGreen.indexOf(metroHub));
                metroLineName = "Green Line";
                validMetroLeg = true;
            } else if ((isBlueA && isGreenB) || (isGreenA && isBlueB)) {
                // Requires double metro transfer: e.g. Sealdah (Green) -> Esplanade (Transfer) -> Kalighat (Blue)
                metroStops = 5; // generic estimate
                metroLineName = "Blue & Green Line (via Esplanade)";
                validMetroLeg = true;
            }
            
            if (validMetroLeg) {
                const busStops = Math.abs(connectBus.route.indexOf(nonMetroHub) - connectBus.route.indexOf(connectStop));
                const busCost = connectBus.baseFare + (busStops * connectBus.costPerStop);
                const busTime = Math.round(10 + (busStops * (60 / connectBus.avgSpeedKmh)));
                
                const metroCost = 10 + Math.ceil(metroStops / 3) * 5;
                const metroTime = metroStops * 3 + 5;
                
                const totalCost = busCost + metroCost;
                const totalTime = busTime + metroTime + 8; // 8 mins interchange delay
                
                const hybridOption = {
                    type: "Hybrid Route",
                    badge: "badge-hybrid",
                    badgeText: "Hybrid Multi-Modal",
                    score: 4,
                    time: totalTime,
                    cost: totalCost,
                    reason: `Avoid traffic: Bus to Metro Link (${connectStop}).`,
                    steps: []
                };
                
                if (!fromInMetro) {
                    // Start is Bus, then Metro
                    hybridOption.steps.push(
                        {
                            title: `Board Bus ${connectBus.number}`,
                            detail: `Take bus from ${from} to ${connectStop} Metro station (~${busTime} mins).`,
                            mode: "bus",
                            modeClass: "bus",
                            icon: "fa-bus",
                            fleetColor: connectBus.color
                        },
                        {
                            title: `Transfer to Metro at ${connectStop}`,
                            detail: `Swap to the Metro platform (${metroLineName}).`,
                            mode: "transfer",
                            modeClass: "transfer",
                            icon: "fa-arrow-right-arrow-left"
                        },
                        {
                            title: `Take Metro`,
                            detail: `Travel by train to your destination ${to}.`,
                            mode: "metro",
                            modeClass: "metro",
                            icon: "fa-train-subway"
                        }
                    );
                } else {
                    // Start is Metro, then Bus
                    hybridOption.steps.push(
                        {
                            title: `Board Metro`,
                            detail: `Travel on the Metro (${metroLineName}) from ${from} to ${connectStop} (~${metroTime} mins).`,
                            mode: "metro",
                            modeClass: "metro",
                            icon: "fa-train-subway"
                        },
                        {
                            title: `Transfer to Bus at ${connectStop}`,
                            detail: `Exit Metro and find Bus stop for Bus ${connectBus.number}.`,
                            mode: "transfer",
                            modeClass: "transfer",
                            icon: "fa-arrow-right-arrow-left"
                        },
                        {
                            title: `Board Bus ${connectBus.number}`,
                            detail: `Travel from ${connectStop} to destination ${to}.`,
                            mode: "bus",
                            modeClass: "bus",
                            icon: "fa-bus",
                            fleetColor: connectBus.color
                        }
                    );
                }
                options.push(hybridOption);
                hybridFound = true;
                logTrace("Step 3: Hybrid Connect", `SUCCESS: Evaluated Hybrid transit path: Bus ${connectBus.number} combined with Metro via ${connectStop}.`, 'matched');
            }
        }
    }
    
    if (!hybridFound) {
        logTrace("Step 3: Hybrid Connect", `No advantage found for hybrid (Bus + Metro) routing for this trip.`, 'alternative');
    }

    // Step 4: Rank and Present
    logTrace("Step 4: Scoring and Ranking", `Sorting choices: prioritizing total travel speed, cost, and minimum transfers...`);
    
    // Sort logic: Sort by score (which ranks direct/metro higher) and then by time.
    options.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.time - b.time;
    });

    renderResults(from, to, options, logs);
}

// Render everything dynamically to UI
function renderResults(from, to, options, logs) {
    // Hide Welcome, Show Results
    welcomeState.classList.add("hidden");
    resultsState.classList.remove("hidden");
    
    routeSummaryTitle.innerText = `${from} to ${to}`;
    
    // 1. Render itineraries
    itinerariesList.innerHTML = "";
    if (options.length === 0) {
        itinerariesList.innerHTML = `
            <div class="glass-card text-center" style="padding: 40px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--accent-red); margin-bottom: 10px;"></i>
                <h3>No Route Found</h3>
                <p style="color: var(--text-secondary); margin-top: 5px;">We couldn't determine a route between these two stops. Please try alternative coordinates or verify details.</p>
            </div>
        `;
    } else {
        options.forEach((opt, idx) => {
            const card = document.createElement("div");
            card.className = "itinerary-card animate-slide-down";
            card.style.animationDelay = `${idx * 0.08}s`;
            
            // Generate steps HTML
            let stepsHtml = "";
            opt.steps.forEach((step, sIdx) => {
                let markerClass = "step-marker";
                if (sIdx === 0) markerClass += " start";
                else if (sIdx === opt.steps.length - 1) markerClass += " end";
                else if (step.mode === "transfer") markerClass += " transfer";
                
                let modeBadge = "";
                if (step.mode === "bus") {
                    modeBadge = `<span class="mode-badge-inline bus"><i class="fa-solid fa-bus"></i> Bus</span>`;
                } else if (step.mode === "metro") {
                    modeBadge = `<span class="mode-badge-inline metro"><i class="fa-solid fa-train-subway"></i> Metro</span>`;
                } else if (step.mode === "rail") {
                    modeBadge = `<span class="mode-badge-inline rail"><i class="fa-solid fa-train"></i> Local Rail</span>`;
                } else if (step.mode === "auto") {
                    modeBadge = `<span class="mode-badge-inline auto"><i class="fa-solid fa-taxi"></i> Auto</span>`;
                }
                
                stepsHtml += `
                    <div class="timeline-step">
                        <div class="${markerClass}">
                        </div>
                        <div class="step-content">
                            <div class="step-header">
                                <span class="step-title">${step.title}</span>
                                ${modeBadge}
                            </div>
                            <span class="step-detail">${step.detail}</span>
                        </div>
                    </div>
                `;
            });
            
            card.innerHTML = `
                <div class="card-top">
                    <div class="badge-container">
                        <span class="badge ${opt.badge}">${opt.badgeText}</span>
                    </div>
                    <div class="route-meta">Option #${idx + 1}</div>
                </div>
                <div class="card-body">
                    <div class="timeline-flow">
                        ${stepsHtml}
                    </div>
                </div>
                <div class="card-bottom">
                    <div class="recommendation-reason">
                        <i class="fa-solid fa-circle-check"></i>
                        <span>${opt.reason}</span>
                    </div>
                    <div class="cost-time-estimate">
                        <span><i class="fa-regular fa-clock"></i> <strong>~${opt.time} mins</strong></span>
                        <span><i class="fa-solid fa-indian-rupee-sign"></i> <strong>₹${opt.cost}</strong></span>
                    </div>
                </div>
            `;
            itinerariesList.appendChild(card);
        });
    }

    // 2. Render logic logs
    logStepsContainer.innerHTML = "";
    logs.forEach(log => {
        const li = document.createElement("li");
        li.className = `log-step ${log.type}`;
        li.innerHTML = `
            <span class="step-tag">${log.stepName}</span>
            <span>${log.message}</span>
        `;
        logStepsContainer.appendChild(li);
    });

    // 3. Render interactive journey map (only if we have valid options with steps)
    const mappableOptions = options.filter(o => o.steps && o.steps.length >= 2);
    if (mappableOptions.length > 0) {
        // Small delay to let DOM paint first
        setTimeout(() => renderInteractiveMap(mappableOptions), 80);
    } else if (mapContainer) {
        mapContainer.style.display = "none";
    }
}
