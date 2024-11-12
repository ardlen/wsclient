<template>
  <div class="map-wrap">
    <!-- Поля ввода для координат X и Y -->
    <div class="fv">
      <label>
        X: <input type="number" v-model.number="x" :disabled="trackMouse" />
      </label>
      <label>
        Y: <input type="number" v-model.number="y" :disabled="trackMouse" />
      </label>

      <!-- Переключатель для сетки -->
      <label>
        <input type="checkbox" v-model="showGrid" /> Показать сетку
      </label>

      <!-- Переключатель для отслеживания курсора -->
      <label>
        <input type="checkbox" v-model="trackMouse" /> Отслеживать курсор
      </label>
    </div>
    <!-- Контейнер с кружком, сеткой, синими точками и линиями -->
    <div
      class="container"
      @mousemove="moveWithMouse"
      @mouseleave="stopTrackingMouse"
    >
      <!-- Сетка, отображается только если showGrid === true -->
      <svg
        v-if="showGrid"
        class="grid"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
      >
        <!-- Вертикальные линии -->
        <line
          v-for="n in 10"
          :key="'v-' + n"
          :x1="n * 40"
          :y1="0"
          :x2="n * 40"
          y2="400"
          stroke="#876e32"
          stroke-width="0.5"
        />
        <!-- Горизонтальные линии -->
        <line
          v-for="n in 10"
          :key="'h-' + n"
          :x1="0"
          :y1="n * 40"
          x2="400"
          :y2="n * 40"
          stroke="#876e32"
          stroke-width="0.5"
        />
      </svg>

      <!-- Линии от синих точек до объекта -->
      <svg
        v-if="showGrid"
        class="lines"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
      >
        <line
          v-for="(point, index) in edgePoints"
          :key="'line-' + index"
          :x1="point.x + 10"
          :y1="point.y + 10"
          :x2="x + 20"
          :y2="y + 10"
          stroke="red"
          stroke-width="1.5"
        />

        <!-- Отображение расстояний над линиями с фоном -->
        <g v-for="(point, index) in edgePoints" :key="'g-' + index">
          <rect
            :x="(point.x + x) / 2 - 20"
            :y="(point.y + y) / 2 - 15"
            width="60"
            height="30"
            rx="10"
            ry="10"
            fill="rgba(255, 255, 255, 0.8)"
            stroke="black"
            stroke-width="0.5"
          />
          <text
            :x="(point.x + x) / 2 + 10"
            :y="(point.y + y) / 2"
            font-size="12"
            fill="black"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ CalculateDistance(point.x, point.y, x, y).toFixed(2) }} px
          </text>
        </g>
      </svg>

      <!-- Коричневый кружок (движущийся объект) -->
      <div class="dot" :style="{ transform: `translate(${x}px, ${y}px)` }">
        <!-- Координаты над коричневым кружком -->
        <div
          v-if="showGrid"
          class="tooltip"
          :style="{ top: '-20px', left: '-10px' }"
        >
          X: {{ x }}, Y: {{ y }}
        </div>
      </div>

      <!-- Синие точки -->
      <div v-if="showGrid">
        <div
          v-for="(point, index) in edgePoints"
          :key="'edge-' + index"
          class="edge-dot"
          :style="{ top: point.y + 'px', left: point.x + 'px' }"
        >
          <!-- Координаты над синими точками -->
          <div
            v-if="false"
            class="tooltip"
            :style="{ top: '-20px', left: '-10px' }"
          >
            X: {{ point.x }}, Y: {{ point.y }}
          </div>
        </div>
      </div>
    </div>
    <div class="q-pa-md q-gutter-sm">
      <q-btn label="Применить" @click="applyCalc" color="primary" />
    </div>
  </div>
</template>
<script>
/*eslint-disable */
import { mapGetters } from "vuex";
import { myMixin } from "../calc/Mymixin.js";

export default {
  name: "maplocator",

  mixins: [myMixin],

  data() {
    return {
      x: 45, // начальные координаты объекта
      y: 100,
      showGrid: false, // Флаг для показа или скрытия сетки
      trackMouse: false, // Флаг для отслеживания курсора
      edgePoints: [
        { x: 380, y: 0 }, // верхний левый угол
        { x: 380, y: 380 }, // верхний правый угол
        { x: 0, y: 380 }, // нижний левый угол
        { x: 0, y: 0 }, // случайная точка слева
      ],
    };
  },
  computed: {
    ...mapGetters({
      messageIoT: "store/messageIoT",
      GsendCmdC: "store/GsendCmdC",
    }),
  },

  watch: {
    // Handling the data receiving event
    messageIoT: function (val) {
      //    console.log("val", val);
    },
  },
  methods: {
    moveWithMouse(event) {
      if (this.trackMouse) {
        const rect = event.target.getBoundingClientRect();
        this.x = event.clientX - rect.left - 10; // корректировка для центрирования кружка
        this.y = event.clientY - rect.top - 10;
      }
    },
    stopTrackingMouse() {
      if (this.trackMouse) {
        this.trackMouse = false; // Останавливаем отслеживание, когда курсор покидает контейнер
      }
    },
    // Метод для расчета расстояния между двумя точками
    CalculateDistance(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },

    applyCalc() {
      const rssiData = [-65.23, -76.12, -63.45, -67.2, -62.34, -71.45, -64.78]; // Пример данных RSSI
      rssiData.forEach((rssi) => {
        const smoothedRSSI = this.inst_KalmanFilter.filter(rssi);
        console.log(`Сглаженное значение RSSI: ${smoothedRSSI}`);
      });

      const beacons = [
        { x: 0, y: 0, rssi: -65 },
        { x: 10, y: 0, rssi: -70 },
        { x: 0, y: 10, rssi: -68 },
        { x: 10, y: 10, rssi: -75 },
      ];

      console.log("Rssi ри дистанции :", this.calculateRSSI(7));
      beacons.forEach((beacon) => {
        beacon.distance = this.calculateDistance(beacon.rssi, -59);
        console.log(`Дистанция: :${beacon.distance} Rssi : ${beacon.rssi}`);
      });

      let position = this.leastSquares(beacons);
      console.log(
        `Предполагаемое местоположение устройства: x = ${position.x}, y = ${position.y}`
      );

      let pos = this.triangulate(beacons);
      console.log(
        `Триллатерация предполагаемое местоположение устройства: x = ${pos.x}, y = ${pos.y} `
      );
    },
  },
};
</script>

<style scoped>
.container {
  width: 400px;
  height: 400px;
  border: 0.5px solid #b9b9b9af;
  position: relative;
  overflow: hidden;
  margin-top: 20px;
  border-radius: 10px;
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
    rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
  background-image: url("../assets/map-ex.jpg");
  background-size: 100% 100%; /* Масштабируем изображение, чтобы оно полностью вписалось */

  border-radius: 10px;
}

.dot {
  width: 20px;
  height: 20px;
  background-color: rgb(236, 26, 236);
  border-radius: 50%;
  position: absolute;
  transition: transform 2 ease;
}

.edge-dot {
  width: 20px;
  height: 20px;
  background-color: rgba(11, 16, 166, 0.445);
  border-radius: 50%;
  position: absolute;
}

.lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  white-space: nowrap;
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.map-wrap {
  display: grid;
  padding: 50px;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.parametres {
  width: 300px;
  height: 400px;
  border: 0.5px solid #f5f5f549;
  position: relative;
  overflow: hidden;
  margin-top: 20px;
  background: #dadada3b;
  border-radius: 10px;
  padding: 20px;
  display: grid;
  grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  font-family: Roboto;
  font-weight: 600;
  font-size: 12px;
  color: rgb(26, 26, 26);
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
    rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
}

input {
  border: 0.5px solid #b9b9b9af;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.643);
  display: flex;
}
label {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
