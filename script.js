
const CSV_URL = "./applications.csv";

d3.csv(CSV_URL, drawCharts);

function drawCharts(data){
    console.log(data);
}