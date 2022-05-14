//variables
const state = { continent: null, dataType: "confirmed" };
const continentsList = ["asia", "europe", "africa", "america"];
const countriesMap = {};
const covidPerContinentMap = {};
const covidPerCountryMap = {};
const cors = "https://intense-mesa-62220.herokuapp.com/";
const colors = { 1: "#6C4A4A", 2: "#C89595", 3: "#DDBEBE", 4: "#EDEDED" };

//DOM Elements
const continentsEL = document.querySelectorAll("[data-continent]");
const dataTypeEL = document.querySelectorAll("[data-type]");
const countriesContainerEl = document.querySelector(".countries-container");
const chartContainerEl = document.querySelector(".chart-container");
const openingAreaEl = document.querySelector(".main__opening");
const spinnerEl = document.querySelector(".loading-spinner");

//classes
function Country(name, code) {
  this.name = name;
  this.code = code;
}

class CovidData {
  constructor(continent, confirmed, deaths, recovered, critical) {
    this.continent = continent;
    this.confirmed = confirmed;
    this.deaths = deaths;
    this.recovered = recovered;
    this.critical = critical;
  }
}

//functions

//event listeners
continentsEL.forEach((continent) => {
  continent.addEventListener("click", (e) => {
    getData(e.target.dataset.continent); //when 'click', recognize the continent in html file
    createChart(e.target.dataset.continent);
    state.continent = e.target.dataset.continent;
  });
  //   console.log(continentsEL);
});

dataTypeEL.forEach((dataType) => {
  dataType.addEventListener("click", (e) => {
    state.dataType = e.target.dataset.type; //state.dataType = data-type ('string')
    // console.log(state.dataType);
    createChart(state.continent);
  });
});

//functions
//check if data exists. if not, get it from api
function getData(continent) {
  if (countriesMap[continent]) {
    return;
  } else {
    spinnerEl.classList.toggle("display-none");
    getApi(continent);
  }
}

//get data from api, store in variables
async function getApi(continent) {
  const countries = []; //arr that includes obj elements. inside the obj has name and code
  try {
    const countriesApi = await axios.get(
      `${cors}https://restcountries.herokuapp.com/api/v1/region/${continent}?fields=name;alpha2Code`
    );
    // console.log(countriesApi);
    countriesApi.data.forEach((country) => {
      countries.push(new Country(country.name.common, country.cca2));
    });
    countriesMap[continent] = countries; //create key 'continent' in countriesMap obj. the value is arr of all countries by name and code in specific continent
    getCovidData(countries, continent);
    console.log(countries);
  } catch (error) {
    console.log(error);
  }
}

//get covid data by countries and store in variables
async function getCovidData(countries, continent) {
  try {
    fetchAll(countries, continent);
  } catch (error) {
    console.log(error);
  }
}

//fetch multiple simultaneously
async function fetchAll(countries, continent) {
  amendData(continent);
  const countriesCodes = countries.map((country) => {
    return axios.get(`${cors}https://corona-api.com/countries/${country.code}`);
  });
  let data = await Promise.all(countriesCodes); //data = arr of countries includes all the data per country. include also details from cors
  //   console.log(data);
  data = data.forEach((country) => {
    const latestData = country.data.data.latest_data;
    covidPerCountryMap[country.data.data.name] = new CovidData(
      continent,
      latestData.confirmed,
      latestData.deaths,
      latestData.recovered,
      latestData.critical
    );
  });
  //   console.log(covidPerCountryMap);

  amendData(continent);
  displayContent(continent);
}

//countries and covid API's are somewhat inconsistent. fix it:
function amendData(continent) {
  for (let i = 0; i < countriesMap[continent].length; i++) {
    if (covidPerCountryMap[countriesMap[continent][i].name] === undefined) {
      covidPerCountryMap[countriesMap[continent][i].name] = new CovidData(
        continent,
        0,
        0,
        0,
        0
      );
    }
    if (countriesMap[continent][i].code === "XK")
      countriesMap[continent].splice(i, 1);
  }
}

function displayContent(continent) {
  if (!spinnerEl.classList.contains("display-none")) {
    spinnerEl.classList.add("display-none");
  }
  if (!openingAreaEl.classList.contains("display-none")) {
    openingAreaEl.classList.add("display-none");
  }
  displayCountries(continent);
  createChart(continent);
}

function displayCountries(continent) {
  countriesMap[continent].forEach((country) => {
    const countryEl = document.createElement("button");
    countryEl.classList.add("btn", "btn-country");
    countryEl.dataset.country = country.name;
    countryEl.innerText = country.name;
    countriesContainerEl.appendChild(countryEl);
    countryEl.addEventListener("click", (e) => {
      createCountryChart(e.target.dataset.country);
    });
  });
}

function createChart(continent) {
  if (countriesMap[continent]) {
    const chartEl = document.createElement("canvas");
    chartContainerEl.innerHTML = "";
    chartContainerEl.appendChild(chartEl);
    chartEl.setAttribute("class", "");
    chartEl.setAttribute("height", "300");
    chartEl.setAttribute("width", "900");
    Chart.defaults.global.defaultFontColor = colors[1];
    const chart = new Chart(chartEl, {
      type: "line",
      data: {
        labels: countriesMap[continent].map((country) => country.name),
        datasets: [
          {
            label: state.dataType,
            data: getCovidDataPerContinent(continent, state.dataType),
            backgroundColor: "rgba(200, 149, 149, 0.2)",
            borderColor: colors[2],
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: `Covid-19 in ${continent}`,
          fontSize: 20,
        },
      },
    });
  }
}

function createCountryChart(country) {
  const chartEl = document.createElement("canvas");
  chartContainerEl.innerHTML = "";
  chartContainerEl.appendChild(chartEl);
  chartEl.setAttribute("class", "");
  chartEl.setAttribute("height", "300");
  chartEl.setAttribute("width", "900");
  const chart = new Chart(chartEl, {
    type: "doughnut",
    data: {
      labels: ["confirmed", "deaths", "recovered", "critical"],
      datasets: [
        {
          label: "Covid-19",
          data: [
            covidPerCountryMap[country].confirmed,
            covidPerCountryMap[country].deaths,
            covidPerCountryMap[country].recovered,
            covidPerCountryMap[country].critical,
          ],
          backgroundColor: [colors[1], colors[3], colors[2], colors[4]],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `Covid-19 in ${country}`,
        fontSize: 20,
      },
    },
  });
};

function getCovidDataPerContinent(continent, type) {
  const covidData = countriesMap[continent].map((country) => {
    return covidPerCountryMap[country.name][type]; // covidPerCountryMap[country.name] = all countries per continent: CovidData {continent: 'asia', confirmed: 155019, deaths: 7198, recovered: 123527, critical: 24294}
  });
  // console.log(covidData);
  return covidData;
};
