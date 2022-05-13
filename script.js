//variables
const state = { currentChart: null };
const continentsList = ["asia", "europe", "africa", "america"];
const countriesMap = {};
const covidPerContinentMap = {};
const covidPerCountryMap = {};
const cors = "https://intense-mesa-62220.herokuapp.com/";

//DOM variables
const continentsEL = document.querySelectorAll("[data-continent]");
// console.log(continentsEL);
const countriesContainerEl = document.querySelectorAll(".countries-container");

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
    // create continent chart
    //update current chart
  });
});

function getData(continent) {
  if (countriesMap.continent) {
    return;
  } else {
    getApi(continent);
  }
}

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

async function getCovidData(countries, continent) {
  try {
    fetchAll(countries, continent);
  } catch (error) {
    console.log(error);
  }
}

async function fetchAll(countries, continent) {
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
  console.log(covidPerCountryMap);
}
