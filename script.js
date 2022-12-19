'use strict';

class property {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, size, cost) {

    this.coords = coords; 
    this.size = size; 
    this.cost = cost; 
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} Property Purchased on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Commercial extends property {
  type = 'commercial';

  constructor(coords, size, cost, inrate) {
    super(coords, size, cost);
    this.inrate = inrate;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.size * this.inrate - this.cost;
    return this.pace;
  }
}

class Residential extends property {
  type = 'residential';

  constructor(coords, size, cost, elevationGain) {
    super(coords, size, cost);
    this.elevationGain = elevationGain;

    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.size * this.elevationGain - this.cost;
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerpropertys = document.querySelector('.propertys');
const inputType = document.querySelector('.form__input--type');
const inputSize = document.querySelector('.form__input--size');
const inputCost = document.querySelector('.form__input--cost');
const inputInRate = document.querySelector('.form__input--inrate');
const inputHoRate = document.querySelector('.form__input--horate');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #propertys = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newproperty.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerpropertys.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.#map);

    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('Your Location')
      .openPopup();
    this.#map.on('click', this._showForm.bind(this));

    this.#propertys.forEach(work => {
      this._renderpropertyMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputSize.focus();
  }

  _hideForm() {
    // Empty inputs
    inputSize.value =
      inputCost.value =
      inputInRate.value =
      inputHoRate.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputHoRate.closest('.form__row').classList.toggle('form__row--hidden');
    inputInRate.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newproperty(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const size = +inputSize.value;
    const cost = +inputCost.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let property;

    if (type === 'commercial') {
      const inrate = +inputInRate.value;

      if (
        !validInputs(size, cost, inrate) ||
        !allPositive(size, cost, inrate)
      )
        return alert('Inputs have to be positive numbers!');

      property = new Commercial([lat, lng], size, cost, inrate);
    }

    if (type === 'residential') {
      const horate = +inputHoRate.value;

      if (
        !validInputs(size, cost, horate) ||
        !allPositive(size, cost)
      )
        return alert('Inputs have to be positive numbers!');

      property = new Residential([lat, lng], size, cost, horate);
    }
    this.#propertys.push(property);

    this._renderpropertyMarker(property);
    this._renderproperty(property);
    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all propertys
    this._setLocalStorage();
  }

  _renderpropertyMarker(property) {
    L.marker(property.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${property.type}-popup`,
        })
      )
      .setPopupContent(
        `${property.type === 'commercial' ? '🏭' : '🏘️'} ${
          property.description
        }`
      )
      .openPopup();
  }

  _renderproperty(property) {
    let html = `
      <li class="property property--${property.type}" data-id="${property.id}">
        <h2 class="property__title">${property.description}</h2>
        <div class="property__details">
          <span class="property__icon">${
            property.type === 'commercial' ? '🏭' : '🏘️'
          }</span>
          <span class="property__value">${property.size}</span>
          <span class="property__unit">meter sq</span>
        </div>
        <div class="property__details">
          <span class="property__icon">💰</span>
          <span class="property__value">${property.cost}</span>
          <span class="property__unit">Rupees</span>
        </div>
    `;

    if (property.type === 'commercial')
      html += `
        <div class="property__details">
          <span class="property__icon">🤑</span>
          <span class="property__value">${property.pace.toFixed(1)}</span>
          <span class="property__unit">Rupees</span>
        </div>
        <div class="property__details">
          <span class="property__icon">💲</span>
          <span class="property__value">${property.inrate}</span>
          <span class="property__unit">Rs/m-sq</span>
        </div>
      </li>
      `;

    if (property.type === 'residential')
      html += `
        <div class="property__details">
          <span class="property__icon">🤑</span>
          <span class="property__value">${property.speed.toFixed(1)}</span>
          <span class="property__unit">km/h</span>
        </div>
        <div class="property__details">
          <span class="property__icon">💲</span>
          <span class="property__value">${property.elevationGain}</span>
          <span class="property__unit">Rs/m-sq</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    // BUGFIX: When we click on a property before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const propertyEl = e.target.closest('.property');

    if (!propertyEl) return;

    const property = this.#propertys.find(
      work => work.id === propertyEl.dataset.id
    );

    this.#map.setView(property.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        cost: 1,
      },
    });

    // using the public interface
    // property.click();
  }

  _setLocalStorage() {
    localStorage.setItem('propertys', JSON.stringify(this.#propertys));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('propertys'));

    if (!data) return;

    this.#propertys = data;

    this.#propertys.forEach(work => {
      this._renderproperty(work);
    });
  }

  reset() {
    localStorage.removeItem('propertys');
    location.reload();
  }
}

const app = new App();
