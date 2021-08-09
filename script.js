'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this.#getPosition();
    $form.addEventListener('submit', this.#newWorkout.bind(this));

    $inputType.addEventListener('change', this.#toggleElevationField);
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

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this.#showForm.bind(this));
  }

  #showForm(mapEv) {
    this.#mapEvent = mapEv;
    $form.classList.remove('hidden');
    $inputDistance.focus();
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

    this.renderWorkoutMarker(workout);

    $inputDistance.value =
      $inputDuration.value =
      $inputCadence.value =
      $inputElevation.value =
        '';
  }

  renderWorkoutMarker(workout) {
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
      .setPopupContent('Workout')
      .openPopup();
  }
}

const app = new App();
