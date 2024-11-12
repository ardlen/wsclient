/*eslint-disable */
import numeric from "/node_modules/numeric";
export const myMixin = {
  data() {
    return {
      distance :0,
      Rssi:0,
      triangl_xy:[],
      coordinates2:[],
      inst_KalmanFilter: null
    };
  },

  created() {
  class  KalmanFilter {
  constructor({ R = 0.01, Q = 3, A = 1, B = 0, C = 1 } = {}) {
    // R: Variance of the process noise (the smaller, the more we trust the model)
    // Q: Variance of the measurement noise (the smaller, the more we trust measurements)
    // A: State transition coefficient (1 by default)
    // B: Control input coefficient (usually 0 if not controlling)
    // C: Measurement coefficient (1 if measuring directly)

    this.R = R; // Процессный шум
    this.Q = Q; // Измерительный шум
    this.A = A; // Коэффициент перехода состояния
    this.B = B; // Коэффициент управляющего входа
    this.C = C; // Коэффициент измерения

    this.covariance = NaN; // Начальная ковариация
    this.x = NaN; // Начальное состояние
      }

    filterClear(){
        this.x=NaN;
        this.covariance = NaN;
      }

      filter(z, u = 0) {
    // z: измерение (например, текущее значение RSSI)
    // u: управляющее воздействие (если есть)

    if (isNaN(this.x)) {
      // Если начальное состояние еще не задано, инициализируем его первым измерением
      this.x = (1 / this.C) * z;
      this.covariance = (1 / this.C) * this.Q * (1 / this.C);
    } else {
      // Шаг предсказания
      const predictedX = (this.A * this.x) + (this.B * u); // Предсказанное состояние
      const predictedCovariance = ((this.A * this.covariance) * this.A) + this.R; // Предсказанная ковариация

      // Шаг коррекции
      const K = predictedCovariance * this.C * (1 / ((this.C * predictedCovariance * this.C) + this.Q)); // Коэффициент Калмана
      this.x = predictedX + K * (z - (this.C * predictedX)); // Корректируем состояние на основе измерения
      this.covariance = predictedCovariance - (K * this.C * predictedCovariance); // Корректируем ковариацию
    }
    return this.x;
    }}
  this.inst_KalmanFilter = new KalmanFilter({ R: 0.01, Q: 3 })
  },

methods: {
// Расчета расстояния на основе RSSI: // n = 2.5
calculateDistance(rssi, txPower, n ) {
  return  this.distance = Math.pow(10, (txPower - rssi) / (10 * n));
},

// Расчет  RSSI от расстояния
calculateRSSI(distance, rssiAtOneMeter = -59, pathLossExponent = 2) {
  return rssiAtOneMeter - 10 * pathLossExponent * Math.log10(distance);

},

// Calculate position - main triangulation function
triangulate(beacons) {
  // Рассматриваем, что у нас есть три маяка
  const { x: x1, y: y1, distance: r1 } = beacons[0]; // Первый маяк
  const { x: x2, y: y2, distance: r2 } = beacons[1]; // Второй маяк
  const { x: x3, y: y3, distance: r3 } = beacons[2]; // Третий маяк

  // Шаг 1: Находим точку пересечения окружностей для первых двух маяков
  const A = 2 * (x2 - x1);
  const B = 2 * (y2 - y1);
  const C = r1 ** 2 - r2 ** 2 - x1 ** 2 + x2 ** 2 - y1 ** 2 + y2 ** 2;

  const D = 2 * (x3 - x2);
  const E = 2 * (y3 - y2);
  const F = r2 ** 2 - r3 ** 2 - x2 ** 2 + x3 ** 2 - y2 ** 2 + y3 ** 2;

  // Шаг 2: Решаем систему линейных уравнений для нахождения x и y
  const x = (C * E - F * B) / (E * A - B * D);
  const y = (C * D - A * F) / (B * D - A * E);
  return { x, y };
},

// Опрежление x y  по 4 маякам
 leastSquares(beacons) {
  const A = [];
  const B = [];

  // Базовый маяк для вычитания
  const { x: x1, y: y1, distance: d1 } = beacons[0];

  // Для каждого из остальных маяков создаем уравнение
  for (let i = 1; i < beacons.length; i++) {
    const { x: xi, y: yi, distance: di } = beacons[i];

    A.push([2 * (xi - x1), 2 * (yi - y1)]);
    B.push(
      d1 ** 2 - di ** 2 + xi ** 2 - x1 ** 2 + yi ** 2 - y1 ** 2
      );
     }
  // Решаем систему уравнений методом наименьших квадратов
  const AT = numeric.transpose(A); // Транспонированная матрица A
  const ATA = numeric.dot(AT, A);  // ATA = A^T * A
  const ATB = numeric.dot(AT, B);  // ATB = A^T * B

  // Решаем систему уравнений (ATA * X = ATB) для нахождения X (координаты x, y)
   const result = numeric.solve(ATA, ATB);
   const [x, y] = result;
   return { x, y };
    },

 // Сглаживаем  значения RSSI
   kalmanFilter (rssiData){
   return this.inst_KalmanFilter.filter(rssiData)
    }
   }

 }


