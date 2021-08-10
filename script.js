'use strict';

const $form = document.querySelector('.form');
const $containerWorkouts = document.querySelector('.workouts');
const $inputType = document.querySelector('.form__input--type');
const $inputDistance = document.querySelector('.form__input--distance');
const $inputDuration = document.querySelector('.form__input--duration');
const $inputCadence = document.querySelector('.form__input--cadence');
const $inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  /**
   *
   * @param {Array} coords [lat, lng]
   * @param {Number} distance in km
   * @param {Number} duration in min
   */
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  /**
   *
   * @param {Array} coords [lat, lng]
   * @param {Number} distance in km
   * @param {Number} duration in min
   * @param {Number} cadence in step/min
   */
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  /**
   *
   * @param {Array} coords [lat, lng]
   * @param {Number} distance in km
   * @param {Number} duration in min
   * @param {Number} elevationGain in meters
   */
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    this.#getPosition();
    this.#getLocalStorage();
    $form.addEventListener('submit', this.#newWorkout.bind(this));
    $inputType.addEventListener('change', this.#toggleElevationField);
    $containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));
  }

  #getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(this.#loadMap.bind(this), () => {
        alert('Could not get your position');
      });
  }

  #loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this.#showForm.bind(this));

    // Render the markers from localStorage
    this.#workouts.forEach(workout => this.#renderWorkoutMarker(workout));
  }

  #showForm(mapEv) {
    this.#mapEvent = mapEv;
    $form.classList.remove('hidden');
    $inputDistance.focus();
  }

  #hideForm() {
    // prettier-ignore
    $inputDistance.value = $inputDuration.value = $inputCadence.value = $inputElevation.value = '';
    $form.style.display = 'none';
    $form.classList.add('hidden');
    setTimeout(() => ($form.style.display = 'grid'), 500);
  }

  #toggleElevationField() {
    $inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    $inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(e) {
    e.preventDefault();

    const type = $inputType.value;
    const distance = +$inputDistance.value;
    const duration = +$inputDuration.value;

    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    const validateInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositives = (...inputs) => inputs.every(input => input > 0);

    if (type === 'running') {
      const cadence = +$inputCadence.value;

      if (
        !validateInputs(distance, duration, cadence) ||
        !allPositives(distance, duration, cadence)
      )
        return alert('Please enter positives numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +$inputElevation.value;

      if (
        !validateInputs(elevation, duration, elevation) ||
        !allPositives(distance, duration)
      )
        return alert('Please enter positives numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    this.#renderWorkoutMarker(workout);

    this.#renderWorkout(workout);

    this.#hideForm();

    this.#setLocalStorage();
  }

  #renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
    `;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;
    }

    $form.insertAdjacentHTML('afterend', html);
  }

  #moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(this.#renderWorkout);
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
