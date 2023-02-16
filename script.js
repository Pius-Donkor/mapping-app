'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  clicks = 0;
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.duration = duration;
    this.distance = distance;
  }

  click() {
    this.clicks++;
  }
  _setDecription() {
    // prettier-ignore
    const  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }  ${this.date.getDate()}`;

    //console.log(this.description);
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._setDecription();
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    //return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._setDecription();
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

// const run1 = new Running([23, -30], 60, 90, 178);
// const cyc1 = new Cycling([23, -30], 60, 90, 539);
// //console.log(run1);
// //console.log(cyc1);

///////////////////////////////////////////
//ARCHITECTURE
class App {
  #map;
  #zoomMap = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationFields);

    containerWorkouts.addEventListener('click', this._mapToPopup.bind(this));
    this.works;
    this.works.forEach(work =>
      work.addEventListener('click', this._deleteWorkout.bind(this))
    );
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('could not get current location');
      }
    );
  }
  _loadMap(position) {
    //console.log(this);
    //console.log(position);
    const { longitude, latitude } = position.coords;
    //console.log('longitude :', longitude);
    //console.log('latitude', latitude);
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#zoomMap);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    //console.log(
    //   `https://www.google.com/maps/place/Sunyani/@${latitude},${longitude},`
    // );
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  //dispay form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    // console.log(mapE);
    form.classList.remove('hidden');
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    inputDistance.focus();
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationFields() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const isNumber = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();
    //get data from form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;
    //if running ,create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //validation check
      //console.log(isNumber(distance, duration, cadence));
      //console.log(allPositive(distance, duration, cadence));
      if (
        !isNumber(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('inputs has to be positive');
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if cycling create cycling object
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (
        !isNumber(distance, duration, elevationGain) ||
        !allPositive(distance, duration)
      )
        return alert('inputs has to be positive');
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }
    //add new object to workout array
    this.#workouts.push(workout);
    console.log(this.#workouts);
    //console.log(workout);

    //render workouts on map as marker
    this._renderWorkout(workout);
    ////console.log(this.#mapEvent);
    this._renderWorkoutMarker(workout);

    //hide form +clear input fields
    this._hideForm();
    this._setLocalStorage();
    console.log(this.works);
    this.works = document.querySelectorAll('#workout');
  }

  _renderWorkoutMarker(workout) {
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
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = ` 
    <li id="workout" class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <i class="bin">🗑️</i>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴'
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

    if (workout.type === 'running')
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
</li>`;

    if (workout.type === 'cycling')
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
</li>`;
    form.insertAdjacentHTML('afterend', html);
  }

  //move map view to map marker
  _mapToPopup(e) {
    if (e.target.classList != 'bin') {
      const workoutEl = e.target.closest('.workout');
      if (!workoutEl) return;
      ////console.log(workoutEl);
      const workout = this.#workouts.find(
        workout => workout.id === workoutEl.dataset.id
      );
      this.#map.setView(workout.coords, this.#zoomMap, {
        animate: true,
        pan: { duration: 1 },
      });
    } else return;

    //workout.click();
    //console.log(workout);
  }

  //store workouts inlocal storage

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
    console.log(this.#workouts);
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    //console.log(data);

    if (!data) return;
    this.#workouts = data;
    //console.log(this.#workouts);

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });

    this.works = document.querySelectorAll('#workout');
  }

  _deleteWorkout(e) {
    const bin = e.target;
    const workoutElement = bin.closest('.workout');
    bin.closest('.workout');
    if (bin.classList != 'bin') return;
    console.log(workoutElement.dataset.id);
    this.#workouts = this.#workouts.filter(
      work => work.id !== workoutElement.dataset.id
    );
    console.log(this.works);
    workoutElement.remove();
    this._setLocalStorage();
    // console.log(this.#workouts);
    // this.#workouts.forEach(workout => this._renderWorkout(workout));
    // this.reset();
  }
  reset() {
    location.reload();
  }
}

const app = new App();
