
const CSV_URL = "./applications.csv";
const sectionsJsonUrl = "./screenshots/sections.json";
const glyphWidth = 130;
const glyphHeight = 130;
const glyphCenter = { x: glyphWidth / 2, y: glyphHeight / 2 };
const glyphRadius = Math.round(glyphHeight / 3);
const programDotRadius = Math.round(glyphRadius / 4);
const programKey = "mstcw";

// Colors: also repeated as CSS variables. Used in JS so that color transitions work properly.
const backgroundColor = '#fff';
const primaryTextColor = '#000';
const availableColor = '#0D77AC'; // blue from CfA website
const availableColorLighter = '#C1D6E4';
const unavailableColor = '#d8d8d8';
const unavailableColorLighter = '#ddd';


function programVertex(letter) {
    const i = programKey.indexOf(letter);
    const angle = i / 5 * Math.PI * 2 + 1.1 * Math.PI;
    return {
        x: Math.cos(angle) * glyphRadius + glyphCenter.x,
        y: Math.sin(angle) * glyphRadius + glyphCenter.y
      };
}


function parseRow(d){
    d["program_count"] = d["programs"].length;
    return d;
}

function sortProgramLetters(programsString) {
    return programsString.split("").sort(
        (a, b) => programKey.indexOf(a) - programKey.indexOf(b)
    ).join("");
}

function aggregateApplicationsByJurisdiction(apps) {
    return {
        year: apps[0]["year"],
        jurisdiction: apps[0]["jurisdiction"],
        code: apps[0]["code"],
        applications: apps,
        combined_programs: sortProgramLetters(
            apps.map(a => a["programs"]).reduce((a, b) => a + b, ""))
    }
}

function drawVisualizations(csvData){
    // exclude rows with no online programs
    const usableRows = csvData.filter(d => d["programs"]);
    
    // group by jurisdiction
    const rollup = d3.rollup(
        usableRows,
        aggregateApplicationsByJurisdiction,
        d => d["year"],
        d => d["jurisdiction"]
    );
    const jurisdictions = Array.from(rollup.get("2022").values());
    const jurisdictionDivs = d3.select("#visualization")
        .selectAll("div")
        .data(jurisdictions)
        .enter().append("div")
        .attr("class", "jurisdiction")
        .attr("id", d => d.code);

    jurisdictionDivs.append("h4").text(d => d.jurisdiction);
    const jurisdictionSvgs = jurisdictionDivs.append("svg")
        .attr("class", "glyph")
        .attr("height", glyphHeight)
        .attr("width", glyphWidth);

    // draw application integration shapes
    const applicationGroups = jurisdictionSvgs.selectAll("g.application")
        .data(d => d.applications.filter(a => a["programs"].length > 1))
        .enter().append("g")
        .attr("class", a => {
            return "application " + (a["programs"].length == 2 ? "double-integration" : "multi-integration")
        });
    applicationGroups.append("path")
        .attr("d", a => {
            return "M" + a["programs"].split("").map(p => {
                const point = programVertex(p);
                return [point.x, point.y].join(",")
            }).join("L") + "Z";
        })
        .attr("title", a => a["name"]);

    // draw program dots
    const programPositions = jurisdictionSvgs.selectAll("g.program")
        .data(
            d => {
                return programKey.split("").map(p => {
                    return {
                        key: p,
                        online: d.combined_programs.includes(p)
                    }
                });
            }
        ).enter().append("g")
        .attr("class", d => "program " + (d.online ? "online" : "offline"))
        .attr("transform", d => {
            const v = programVertex(d.key);
            return `translate(${v.x},${v.y})`
        });
    programPositions.append("circle")
        .attr("r", programDotRadius);
    programPositions.append("text")
        .text(d => d.key.toUpperCase())
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle');

}
let swiper;
let sectionData;
const state = "nc";
const application = "epass";
let device = "mobile";
let section = "registration";
let screenshotScope = `screenshots/${state}-${application}-${device}`;
const screenshotJsonUrl = screenshotScope + "-sections.json";

const slideIndexFormat = d3.format("03d");
function screenshotSlideTemplate(screenshotScope, index){
    return `
    <div class="swiper-slide">
        <img src="${screenshotScope}-${slideIndexFormat(index)}.png" alt="">
    </div>`;
}

function initializeCarousel(jsonData){
    sectionData = jsonData;
    swiper = new Swiper(".swiper", {
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        //   renderCustom: (swiper: default, current: number, total: number)
          renderBullet: function (index, className) {
            return '<span class="' + className + '">' + (index + 1) + "</span>";
          },
        },
    });

    $(".swiper-wrapper").addClass(device);
    updateSection(section);
}

// get screenshot json, add screenshots, and then set up swiper
function loadScreenshots(){
    $.getJSON(sectionsJsonUrl, initializeCarousel);
}

function updateSlides(){
    const [start, end] = sectionData[state][application][device][section];
    console.log(sectionData[state][application][device][section]);
    const newSlides = [];
    for (let i = start; i <= end; i++){
        newSlides.push(screenshotSlideTemplate(screenshotScope, i));
    }
    swiper.removeAllSlides();
    swiper.appendSlide(newSlides);
    $(".swiper-wrapper").addClass(device);
    swiper.slideTo(0, 0, false);
}

function updateSection(newSection){
    section = newSection;
    updateSlides();
}

function updateDevice(newDevice){
    $(".swiper-wrapper").removeClass(device);
    console.log(newDevice);
    device = newDevice;
    screenshotScope = `screenshots/${state}-${application}-${device}`;
    updateSlides();
}


const $ = jQuery;
d3.csv(CSV_URL, parseRow).then(drawVisualizations);
loadScreenshots();
document.querySelector(".menu--sections").addEventListener("click", e => updateSection(e.target.name));
document.querySelector(".menu--device").addEventListener("click", e => updateDevice(e.target.name));