
const CSV_URL = "./applications.csv";
const glyphWidth = 130;
const glyphHeight = 130;
const glyphCenter = { x: glyphWidth / 2, y: glyphHeight / 2 };
const glyphRadius = Math.round(glyphHeight / 3);
const programDotRadius = Math.round(glyphRadius / 4);
const programKey = "mstcw";
function programVertex(letter) {
    const i = programKey.indexOf(letter);
    const angle = i / 5 * Math.PI * 2 + 1.1 * Math.PI;
    return {
        x: Math.cos(angle) * glyphRadius + glyphCenter.x,
        y: Math.sin(angle) * glyphRadius + glyphCenter.y
      };
}

// Colors: also repeated as CSS variables. Used in JS so that color transitions work properly.
const backgroundColor = '#fff';
const primaryTextColor = '#000';
const availableColor = '#0D77AC'; // blue from CfA website
const availableColorLighter = '#C1D6E4';
const unavailableColor = '#d8d8d8';
const unavailableColorLighter = '#ddd';

function parseRow(d){
    d["program_count"] = d["programs"].length;
    return d;
}

function drawVisualizations(csvData){
    // exclude rows with no online programs
    const usableRows = csvData.filter(d => d["programs"]);
    // next by jurisdiction codes
    const jurisdictions = d3.group(usableRows, d => d["jurisdiction"]);

    console.log(jurisdictions);

    const jurisdictionDivs = d3.select("#visualization")
        .selectAll("div")
        .data(jurisdictions)
        .enter().append("div")
        .attr("class", "jurisdiction")
        .attr("id", d => d[1][0]["code"]);

    jurisdictionDivs.append("h4").text(d => d[0]);
    const jurisdictionSvgs = jurisdictionDivs.append("svg")
        .attr("class", "glyph")
        .attr("height", glyphHeight)
        .attr("width", glyphWidth);
    const programPositions = jurisdictionSvgs.selectAll("g.program")
        .data(
            d => {
                const onlineProgramKey = d[1].map(a => a["programs"]).reduce((a, b) => a + b, "");
                console.log(onlineProgramKey);
                return programKey.split("").map(p => {
                    return {
                        key: p,
                        online: onlineProgramKey.includes(p)
                    }
                });
            }
        ).enter().append("g")
        .attr("class", d => "program " + (d.online ? "online" : "offline"))
        .attr("transform", d => {
            const v = programVertex(d.key);
            return `translate(${v.x},${v.y})`
        })
    programPositions.append("circle")
        .attr("r", programDotRadius);
    programPositions.append("text")
        .text(d => d.key.toUpperCase())
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle');
    const applicationGroups = jurisdictionSvgs.selectAll("g.application")
        .data(d => d[1])
        .enter().append("g")
        .attr("class", "application")
        .attr("transform", "translate(0,15)");
    applicationGroups.append("text")
        .text(d => d["name"]);
    applicationGroups.append("text")
        .text(d => d["programs"])
        .attr("transform", "translate(0,15)");

}

d3.csv(CSV_URL, parseRow).then(drawVisualizations);



