<template>
  <div class="q-pa-md">
    <div id="map"></div>
    <div style="margin: 20px; margin-left: 0">
      <q-checkbox
        v-model="selected"
        label="Отметить позиции маяков на плане помещения"
        color="teal"
      />
      <template v-if="selected === true">
        <div style="width: fit-content">
          <anchorlist
            ref="anchorlist"
            @click="onEventListUpdate"
            :onEventListUpdate="onEventListUpdate"
            :onUpdateLIst="onUpdateLIst"
          >
          </anchorlist>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
/*eslint-disable */
import { mapGetters } from "vuex";
import { myMixin } from "../calc/Mymixin.js";
import { LocalStorage } from "quasar";
import anchorlist from "../components/anchorlist.vue";
import devicelist from "../components/devicelist.vue";

export default {
  name: "maplocator",

  components: { anchorlist, devicelist },

  mixins: [myMixin],

  data() {
    return {
      map: null, // Ссылка на объект карты
      tracker_marker: [],
      count_devices: 0,
      count_anchors: 0,
      tracker_list: [
        { DevEui: "", m: null },
        { DevEui: "", m: null },
        { DevEui: "", m: null },
        { DevEui: "", m: null },
        { DevEui: "", m: null },
        { DevEui: "", m: null },
        { DevEui: "", m: null },
        { DevEui: "", m: null },
        { DevEui: "", m: null },
        { DevEui: "", m: null },
      ],
      save_tracker_marker: null,
      trackMarker: null,
      b_markers: [],
      val_data: [],
      ind_store_data: [],
      // beacons_scheme: new Map(),
      anchors: [],
      BeaconMarker: [], // Ссылка на маркер устройства
      // beacons: {
      //   M1: { x: 0, y: 0 },
      //   M2: { x: 5, y: 4 },
      //   M3: { x: 5, y: 0 },
      //   M4: { x: 0, y: 4 },
      // },
      beacon: null,
      selected: false,
      devicePosition: { y: 0, x: 0 }, // Начальная позиция устройства
      imageUrl: "location2.png", // Путь к изображению плана
      customIconBeacon: null,
      imageBounds: [
        [0, 0],
        [0, 0],
      ],
    };
  },
  mounted() {
    this.initMap();
  },

  created() {
    if (localStorage.ind_store_data) {
      this.ind_store_data = JSON.parse(localStorage.ind_store_data);
      console.log("Store Data", this.ind_store_data);
    }
    if (localStorage.count_devices) {
      this.count_devices = JSON.parse(localStorage.count_devices);
    }
    if (localStorage.anchors) {
      this.anchors = JSON.parse(localStorage.anchors);
    }
    if (localStorage.count_anchors) {
      this.count_anchors = JSON.parse(localStorage.count_anchors);
    }
    if (localStorage.ImagePlan) {
      this.imageUrl = JSON.parse(localStorage.ImagePlan);

      console.log("Image plan:", JSON.parse(localStorage.ImagePlan));
    }
    if (localStorage.set_bind_image) {
      let pos = JSON.parse(localStorage.set_bind_image);
      this.imageBounds[0][0] = pos.bounds[0];
      this.imageBounds[0][1] = pos.bounds[1];
      this.imageBounds[1][0] = pos.bounds[2];
      this.imageBounds[1][1] = pos.bounds[3];
      console.log("Set bind image:", pos.bounds, this.imageBounds);
    }
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
      console.log("val", val);
      this.processMes(val);
    },
    selected: function (val) {
      if (val) {
        // Добавляем обработчик клика для добавления маркера
        this.map.on("click", this.addBeacon);
      } else {
        this.map.off("click", this.addBeacon);
      }
    },
  },
  methods: {
    initMap() {
      // this.beacons_scheme.set("20648-54295", this.beacons.M1);
      // this.beacons_scheme.set("21315-17567", this.beacons.M2);
      // this.beacons_scheme.set("55187-40575", this.beacons.M3);
      // this.beacons_scheme.set("22809-26027", this.beacons.M4);
      // const keys = [...this.beacons_scheme.keys()];

      //this.save_tracker_marker = new Map();

      // Инициализация карты с использованием CRS Simple для плоского рендера
      this.map = L.map("map", {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 50,
        zoomSnap: 0.2,
        zoomControl: false,
        customIcon: null,
        zoom: 10,
        // dragging: false, // Отключает перетаскивание карты
        scrollWheelZoom: false, // Отключает зум колесиком мыши
        // doubleClickZoom: false, // Отключает зум двойным кликом
        // touchZoom: false, // Отключает зум касанием на мобильных
        // zoomControl: false, // Убирает контролы изменения масштаба
      }).setView([2, 2], 11);

      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(this.map);

      // Добавление слоя OpenStreetMap
      // L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}", {
      //   foo: "bar",
      //   attribution:
      //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      // }).addTo(this.map);

      // 55.744081867238265, 37.65686666869381
      // 55.744171949276584, 37.65697881825758

      // Добавляем изображение плана помещения на карту
      L.imageOverlay(this.imageUrl, this.imageBounds).addTo(this.map);
      this.map.fitBounds(this.imageBounds);
      this.customIconBeacon = L.icon({
        iconUrl: require("../assets/beacon-96.png"),
        iconSize: [60, 60], // Size icon
        iconAnchor: [25, 35], // Icon  anchor point (center is down )
        popupAnchor: [-0, -32], // Popup window anchor point
      });

      // // Set M1 beacon position
      // this.customIcon = L.icon({
      //   iconUrl: require("../assets/beacon-96.png"),
      //   iconSize: [60, 60], // Size icon
      //   iconAnchor: [25, 35], // Icon  anchor point (center is down )
      //   popupAnchor: [-0, -32], // Popup window anchor point
      // });
      // L.marker(
      //   [
      //     this.beacons_scheme.get("20648-54295").y,
      //     this.beacons_scheme.get("20648-54295").x,
      //   ],
      //   {
      //     icon: this.customIcon,
      //   }
      // )
      //   .addTo(this.map)
      //   .bindPopup(keys[0])
      //   .openPopup();

      // // Set M2 beacon position
      // this.customIcon = L.icon({
      //   iconUrl: require("../assets/beacon-96.png"),
      //   iconSize: [60, 60],
      //   iconAnchor: [30, 35],
      //   popupAnchor: [-0, -32],
      // });

      // L.marker(
      //   [
      //     this.beacons_scheme.get("21315-17567").y,
      //     this.beacons_scheme.get("21315-17567").x,
      //   ],
      //   {
      //     icon: this.customIcon,
      //   }
      // )
      //   .addTo(this.map)
      //   .bindPopup(keys[1])
      //   .openPopup();

      // // Set M3 beacon position
      // this.customIcon = L.icon({
      //   iconUrl: require("../assets/beacon-96.png"),
      //   iconSize: [60, 60],
      //   iconAnchor: [30, 25],
      //   popupAnchor: [-0, -5],
      // });

      // L.marker(
      //   [
      //     this.beacons_scheme.get("55187-40575").y,
      //     this.beacons_scheme.get("55187-40575").x,
      //   ],
      //   {
      //     icon: this.customIcon,
      //   }
      // )
      //   .addTo(this.map)
      //   .bindPopup(keys[2])
      //   .openPopup();

      // // Set M4 beacon position
      // this.customIcon = L.icon({
      //   iconUrl: require("../assets/beacon-96.png"),
      //   iconSize: [60, 60],
      //   iconAnchor: [30, 25],
      //   popupAnchor: [-0, -5],
      // });

      // L.marker(
      //   [
      //     this.beacons_scheme.get("22809-26027").y,
      //     this.beacons_scheme.get("22809-26027").x,
      //   ],
      //   {
      //     icon: this.customIcon,
      //   }
      // )
      //   .addTo(this.map)
      //   .bindPopup(keys[3])
      //   .openPopup();

      // Добавляем элемент управления масштабом
      L.control.scale(1, false, false, false);
      L.control.scale().addTo(this.map);

      this.restoreMarkers();
      this.restoreBeacons();
    },

    processMes(val) {
      let buff = [];
      let data = {};
      let all_data = {};
      val.DataContext.forEach((beacon) => {
        let idbeacon = beacon.Data[0].Major + "-" + beacon.Data[0].Minor;
        let idanchor = this.anchors.find((a) => a.mgmn === idbeacon);
        let pos = { x: idanchor.a_pos.x, y: idanchor.a_pos.y };
        console.log("idanchor:", idanchor, pos.x);

        data = {
          IdBeacon: idbeacon,
          pos: pos, //this.beacons_scheme.get(idbeacon),
          TxRssi: beacon.Data[0].TxRssi,
        };
        buff.push(data);
      });
      all_data = {
        DevEui: val.DevEui,
        marker: { x: 0, y: 0 },
        beacons: buff,
      };

      let index = this.ind_store_data.findIndex((i) => i.DevEui === val.DevEui);
      if (index != -1) {
        this.ind_store_data[index] = all_data;
        this.updateMarker(index, 2);
        localStorage.ind_store_data = JSON.stringify(this.ind_store_data);
        console.log("Update UP", val.DevEui, index, val);
      } else {
        this.ind_store_data.push(all_data);
        let index = this.ind_store_data.findIndex(
          (i) => i.DevEui === val.DevEui
        );
        this.addMarker(index, 2);
        console.log("Add UP", val.DevEui);
        // Save local storage for further process
        localStorage.ind_store_data = JSON.stringify(this.ind_store_data);
      }
    },
    restoreMarkers() {
      this.ind_store_data.forEach((m) => {
        let idx = this.ind_store_data.indexOf(m);
        this.tracker_list[idx].DevEui = m.DevEui;
        this.tracker_list[idx].m = L.marker([0, 0]).addTo(this.map);
        this.tracker_list[idx].m
          .setLatLng([m.marker.x, m.marker.y])
          .bindPopup(m.DevEui)
          .openPopup()
          .update();
      });
    },

    restoreBeacons() {
      this.anchors.forEach((a) => {
        var marker = new L.marker([a.a_pos.y, a.a_pos.x], {
          icon: this.customIconBeacon,
        })
          .addTo(this.map)
          .bindPopup(`Коор.маяка M${a.m}: ${a.a_pos.y}, ${a.a_pos.x}`)
          .openPopup()
          .update();

        let buff = {
          m: a.m,
          marker: marker,
        };
        this.b_markers.push(buff);
      });
    },

    updateDevicePosition(newPosition, idx) {
      // Обновляем позицию маркера устройства
      this.tracker_list;

      if (this.tracker_list[idx]) {
        this.tracker_marker[idx].marker_dev
          .setLatLng([newPosition.y, newPosition.x])
          .bindPopup(this.tracker_marker[idx].DevEui)
          .openPopup()
          .update();
        this.map.panTo([newPosition.y, newPosition.x]);
      }
    },
    addBeacon(e) {
      this.count_anchors = ++this.count_anchors;
      // Получаем координаты клика
      const { lat, lng } = e.latlng;
      // Создаем и добавляем маркер на карту по координатам клика
      var marker = new L.marker([lat, lng], {
        icon: this.customIconBeacon,
      })
        .addTo(this.map)
        .bindPopup(
          `Коор.маяка M:${this.count_anchors} ${lat.toFixed(2)}, ${lng.toFixed(
            2
          )}`
        )
        .openPopup();

      let buff = {
        m: this.count_anchors,
        mgmn: "",
        a_pos: { x: lng.toFixed(5), y: lat.toFixed(5) },
      };

      let buf2 = {
        m: this.count_anchors,
        marker: marker,
      };
      this.b_markers.push(buf2);

      this.anchors.push(buff);
      localStorage.anchors = JSON.stringify(this.anchors);
      localStorage.count_anchors = JSON.stringify(this.count_anchors);
      this.fetchData(this.anchors);
      console.log("Anchors:", this.anchors, "b_markers:", this.b_markers);
    },

    // Интерполяция для плавного движения маркера
    animateMarker(toPosition, idx, duration, markers, updatePos) {
      const fromPosition = this.markers[idx].position;
      //  console.log("fromPosition->>", fromPosition);
      const start = performance.now();

      function step(timestamp) {
        const progress = Math.min((timestamp - start) / duration, 1);
        const lat =
          fromPosition.lat + (toPosition.lat - fromPosition.lat) * progress;
        const lng =
          fromPosition.lng + (toPosition.lng - fromPosition.lng) * progress;
        const newPosition = { lat, lng };

        markers[idx].position = newPosition;
        updatePos(0, idx, newPosition, markers);
        //  console.log("----->", markers[idx].position);

        if (progress < 1) {
          requestAnimationFrame(step); // Продолжаем анимацию
        }
      }

      requestAnimationFrame(step);
    },

    addMarker(index, mc) {
      let position = NaN;
      let beacons = [];

      // Add new device marker
      this.tracker_list[this.count_devices].DevEui =
        this.ind_store_data[index].DevEui;

      this.ind_store_data[index].beacons.forEach((beacon) => {
        let b = {
          x: beacon.pos.x,
          y: beacon.pos.y,
          distance: this.calculateDistance(beacon.TxRssi, -59, 5),
        };
        beacons.push(b);
      });

      switch (mc) {
        case 1:
          // LeastSquares method
          position = this.leastSquares(beacons);
          console.log(
            `LeastSquares: предполагаемое местоположение устройства:  y = ${position.y} x = ${position.x},`
          );
          break;
        case 2:
          // Trillateration method
          position = this.triangulate(beacons);
          console.log(
            `Триллатерация: предполагаемое местоположение устройства: y = ${position.y} x = ${position.x}, `
          );
          break;
        default:
      }
      // Serach id marker in tracker_list array
      if (index != -1) {
        this.tracker_list[this.count_devices].m = L.marker([0, 0]).addTo(
          this.map
        );
        this.tracker_list[this.count_devices].m
          .setLatLng([position.x, position.y])
          .update()
          .bindPopup(this.ind_store_data[index].DevEui)
          .openPopup();
        this.map.panTo([position.x, position.y]);
        this.count_devices = ++this.count_devices;
        localStorage.count_devices = JSON.stringify(this.count_devices);
        this.ind_store_data[index].marker = position;
        console.log("add marker:", beacons, this.tracker_marker);
      }
    },

    updateMarker(index, mc) {
      let position = NaN;
      let beacons = [];

      this.ind_store_data[index].beacons.forEach((beacon) => {
        let b = {
          x: beacon.pos.x,
          y: beacon.pos.y,
          distance: this.calculateDistance(beacon.TxRssi, -59, 5),
        };
        console.log("Distance :", b.distance, beacon.TxRssi);
        beacons.push(b);
      });

      switch (mc) {
        case 1:
          // LeastSquares method
          position = this.leastSquares(beacons);
          console.log(
            `LeastSquares gредполагаемое местоположение устройства:  y = ${position.y} x = ${position.x},`
          );
          break;
        case 2:
          // Trillateration method
          position = this.triangulate(beacons);
          console.log(
            `Триллатерация предполагаемое местоположение устройства: y = ${position.y} x = ${position.x}, `
          );
          break;
        default:
      }

      let idx = this.tracker_list.findIndex(
        (i) => i.DevEui === this.ind_store_data[index].DevEui
      );
      if (index != -1 && idx != -1) {
        this.tracker_list[idx].m
          .setLatLng([position.x, position.y])

          .update()
          .bindPopup(this.ind_store_data[index].DevEui)
          .openPopup();
        //  this.map.panTo([position.x, position.y]);
        let tr = {
          DevEui: this.ind_store_data[index].DevEui,
          position: { x: position.x, y: position.y },
        };
        this.ind_store_data[index].marker = position;
        console.log(
          "update marker:",
          beacons,
          this.tracker_list[idx],
          this.ind_store_data[index].maker
        );
      }
    },

    EventListUpdate(val) {
      let index = this.anchors.findIndex((i) => {
        i.m === val[0].m;
      });

      console.log("Fired event from child !!!", index, val[0].m);
    },

    onEventListUpdate(val) {
      let idx = 0;
      // console.log("VAL", val);
      // console.log("this.b_markers:", this.b_markers);
      idx = this.b_markers.findIndex((x) => x.m === val);
      // console.log("this.b_markers:", this.b_markers, "IDX", idx);

      this.map.removeLayer(this.b_markers[idx].marker);
      idx = this.anchors.findIndex((x) => x.m === val);
      this.anchors.splice(idx, 1);
      this.b_markers.splice(idx, 1);
      localStorage.anchors = JSON.stringify(this.anchors);
      this.count_anchors = this.anchors.length;
      localStorage.count_anchors = JSON.stringify(this.count_anchors);
      // console.log("this.count_anchors :", this.count_anchors);
    },

    fetchData(val) {
      this.$refs.anchorlist.fetchData(val);
    },

    onUpdateLIst(val) {
      let idx = this.anchors.findIndex((m) => m.m === val.m);
      this.anchors[idx].m = val.m;
      this.anchors[idx].mgmn = val.mgmn;
      localStorage.anchors = JSON.stringify(this.anchors);
      console.log("onUpdateLIst:", val, idx);
      console.log("onUpdateLIst:", this.anchors);
    },

    applyCalc() {
      // --------P1---------------------------------
      // M1 MJ: 20648 MN: 54295
      //    RSSI: -77, -77, -77, -78, -75, -77, -77
      // M2 MJ: 21315 MN: 17567
      //   RSSI: -87, -86, -91, -85, -87,  -87, -87
      // M3 MJ: 55187 MN: 40575
      //    RSSI: -77, -78, -77, -78, -77, -77, -77
      // M4 MJ: 22809 MN: 26027
      //    RSSI: -85, -86, -86, -84, -84, -89, -87
      const rssiData4_P1 = {
        M1: [-77, -77, -77, -78, -75, -77, -77], // 76.85
        M2: [-87, -86, -91, -85, -87, -87, -87], // 87.13
        M3: [-77, -78, -77, -78, -77, -77, -77], // 77.28
        M4: [-85, -86, -86, -84, -84, -89, -87], // 85.87
      };

      //--------P2----------------------------------------
      // M1 MJ: 20648 MN: 54295
      //    RSSI: -78, -77, -76, -75, -75, -78, -78, -76
      // M2 MJ: 21315 MN: 17567
      //    RSSI: -74, -73, -73, -72, -73, -72, -74, -74
      // M3 MJ: 55187 MN: 40575
      //     RSSI: -79, -82, -82, -79, -79, -82, -82, -82
      // M4 MJ: 22809 MN: 26027
      //    RSSI: -78, -79, -79, -80, -80, -80, -79, -80
      const rssiData4_P2 = {
        M1: [-78, -77, -76, -75, -75, -78, -78, -76], // 76.62
        M2: [-74, -73, -73, -72, -73, -72, -74, -74], // 73.13
        M3: [-79, -82, -82, -79, -79, -82, -82, -82], // 80.89
        M4: [-78, -79, -79, -80, -80, -80, -79, -80], // 79.38
      };

      //--------P3----------------------------------------
      // M1 MJ: 20648 MN: 54295
      //     RSSI: -87,-87, -87, -87, -88, -88, -87, -87, -87
      // M2 MJ:21315 MN: 17567
      //    RSSI: -86, -86, -86, -86, -86, -87, -86, -86, -87
      // M3 MJ:55187 MN:40575
      //     RSSI: -77, -68, -76, -82, -67, -68, -76, -77, -81, -81
      // M4 MJ:22809 MN:26027
      //     RSSI: -77, -78, -77, -77, -78, -79, -79, -77, -77, -78,
      const rssiData4_P3 = {
        M1: [-87, -87, -87, -87, -88, -88, -87, -87, -87], // 87.22
        M2: [-86, -86, -86, -86, -86, -87, -86, -86, -87], // 86.23
        M3: [-77, -68, -76, -82, -67, -68, -76, -77, -81, -81], // 75.41
        M4: [-77, -78, -77, -77, -78, -79, -79, -77, -77, -78], // 77.70
      };

      //-------P4----------------------------------
      //M1  MJ:20648 MN: 54295
      //    RSSI: -91, -87, -87, -87, -92, -92, -92
      //M2  MJ: 21315 MN: 17567
      //    RSSI: -89, -89, -89, -89, -89, -89, -89
      //M3  MJ:55187 MN:40575
      //    RSSI: -71, -71, -72, -72, -71, -73, -73
      //M4  MJ:22809 MN:26027
      //    RSSI: -73, -69, -69, -69, -70, -72, -72
      const rssiData4_P4 = {
        M1: [-91, -87, -87, -87, -92, -92, -92], // -89.7
        M2: [-89, -89, -89, -89, -89, -89, -89], // -89
        M3: [-71, -71, -72, -72, -71, -73, -73], // -71.87
        M4: [-73, -69, -69, -69, -70, -72, -72], // 70.58
      };

      //-------R1------------------------------------
      //M1 MJ:20648 MN:54295
      //   RSSI: -80, -83, -83, -80, -80, -80, -83, -81, -80
      //M2 MJ: 21315 MN: 17567
      //   RSSI: -91, -92, -92, -91, -92, -92, -92, -92, -92
      //M3 MJ:55187 MN:40575
      //   RSSI: -71, -83, -71, -71, -71, -71, -84, -71, -71
      //M4 MJ:22809 MN:26027
      //   RSSI: -80, -80, -84, -80, -80, -81, -81, -80, -80

      // MJ: 43690 MN: 1
      //     RSSI: -66, -68, -68, -69, -67, -67, -67, -67, -68, -68
      // MJ: 43690 MN: 2
      //      RSSI: -73, -72, -72, -75, -72, -72, -81, -81, -81, -74, -74
      // MJ: 43690 MN: 3
      //      RSSI: -78 -78 -79 -79 -73 -73 -72 -72 -74 -74 -73 -74
      // MJ: 43690 MN: 4
      //     RSSI: -59, -59, -59, -59, -59, -59, -65, -59, -59, -59, -59

      const rssiData4_R1 = {
        M1: [-69], //[-66, -68, -68, -69, -67, -67, -67, -67, -68, -68], // -81.1
        M2: [-63], //[-73, -72, -72, -75, -72, -72, -81, -81, -81, -74, -74], // -91
        M3: [-82], //[-71, -83, -71, -71, -71, -71, -84, -71, -71], // -73.76
        M4: [-80], //[-59, -59, -59, -59, -59, -59, -65, -59, -59, -59, -59], // -80.65
      };

      //------R4---------------------------------------------
      //M1 MJ:20648 MN: 54295
      //   RSSI: -86, -87, -86, -86, -86, -86, -87, -86, -86, -87
      //M2 MJ:21315 MN:17567
      //   RSSI: -90, -84, -84, -84, -84, -88,,-84, -85, -84, -90
      //M3 MJ:55187 MN:40575
      //   RSSI: -83, -83, -84, -84, -83, -83, -84, -85, -83, -89
      //M4 MJ:22809 MN:26027
      //   RSSI: -93, -90, -90, -90, -91, -90, -92, -92, -92, -92
      const rssiData4_R4 = {
        M1: [-86, -87, -86, -86, -86, -86, -87, -86, -86, -87], // -86.3
        M2: [-90, -84, -84, -84, -84, -88, , -84, -85, -84, -90], // 85.72
        M3: [-83, -83, -84, -84, -83, -83, -84, -85, -83, -89], // -84.15
        M4: [-93, -90, -90, -90, -91, -90, -92, -92, -92, -92], // -91.22
      };

      //-----Cenr-----------------------------------------------

      // M1 MJ:20648 MN:54295
      //    RSSI: -74, -75, -72, -72, -79, -79, -79, -76, -75
      // M2 MJ:21315 MN:17567
      //    RSSI: -83, -82, -80, -81, -81, -80, -82, -82, -82
      // M3 MJ:55187 MN:40575
      //   RSSI: -89, -90, -92, -92, -91, -90, -90, -91, -92
      // M4 MJ 22809 MN:26027
      //    RSSI: -80, -79, -78, -78, -79, -79, -79, -79, -79

      // MJ: 43690 MN: 1
      //     RSSI: -63 -65 -65 -65 -65 -65 -65 -65 -65 -67 -65 -67 -65
      // MJ: 43690 MN: 2
      //     RSSI: -61 -61 -64 -61 -61 -64 -64 -64 -61 -61 -64 -64
      // MJ: 43690 MN: 3
      //     RSSI: -67 - 72 - 67 - 69 - 69 - 67 - 71 - 71 - 67 - 71 - 71 - 70;
      // MJ: 43690 MN: 4
      //     RSSI: -61 -61 -61 -61 -66 -61 -61 -61 -61 -64 -64

      const rssiData4_Center = {
        M1: [-63, -65, -65, -65, -65, -65, -65, -65, -65, -67, -65, -67, -65], // -86.3
        M2: [-61, -61, -64, -61, -61, -64, -64, -64, -61, -61, -64, -64], // 85.72
        M3: [-67, -72, -67, -69, -69, -67, -71, -71, -67, -71, -71, -70], // -84.15
        M4: [-61, -61, -61, -61, -66, -61, -61, -61, -61, -64, -64], // -91.22
      };

      const rssiData4 = {
        M1: [-91, -87, -87, -87, -92, -92, -92], //77.27
        M2: [-89, -89, -89, -89, -89, -89, -89], // 70.58
        M3: [-71, -71, -72, -72, -71, -73, -73], // 98.75
        M4: [-73, -69, -69, -69, -70, -72, -72], // -89
      };

      let beacons1 = [
        { y: 0, x: 0, rssi: 0 },
        { y: 0, x: 5, rssi: 0 },
        { y: 4, x: 0, rssi: 0 },
        { y: 4, x: 5, rssi: 0 },
      ];

      //  const rssiData = [-71, -83, -71, -71, -71, -71, -84, -71, -71]; // Пример данных RSSI
      let smoothedRSSI = 0;
      Object.keys(rssiData4_R1).forEach((k, i) => {
        rssiData4_R1[k].forEach((rssi) => {
          smoothedRSSI = this.inst_KalmanFilter.filter(rssi);
        });
        beacons1[i].rssi = smoothedRSSI;
        this.inst_KalmanFilter.filterClear();
        console.log(
          `Итоговое сглаженное значение RSSI ----->: ${i}  : ${smoothedRSSI} `
        );
      });

      // rssiData.forEach((rssi) => {
      //   smoothedRSSI = this.inst_KalmanFilter.filter(rssi);
      // });

      console.log(`Сглаженное значение RSSI: ${smoothedRSSI}`);

      const beacons = [
        { x: 0, y: 0, rssi: -79 },
        { x: 5, y: 0, rssi: -65 },
        { x: 0, y: 4, rssi: -80 },
        { x: 5, y: 4, rssi: -90 },
      ];

      //  console.log("Rssi ри дистанции :", this.calculateRSSI(7.67));
      // beacons1 = [
      //   { y: 0, x: 0, rssi: -75.69 },
      //   { y: 0, x: 50, rssi: -81.41 },
      //   { y: 40, x: 0, rssi: -89.23 },
      //   { y: 40, x: 50, rssi: -89.22 },
      // ];

      beacons1.forEach((beacon) => {
        beacon.distance = this.calculateDistance(beacon.rssi, -59);
        console.log(`Дистанция: :${beacon.distance} Rssi : ${beacon.rssi}`);
      });

      // beacons.forEach((beacon) => {
      //   beacon.distance = this.calculateDistance(beacon.rssi, -59);
      //   console.log(`Дистанция: :${beacon.distance} Rssi : ${beacon.rssi}`);
      // });

      let position = this.leastSquares(beacons1);
      console.log(
        `LeastSquares gредполагаемое местоположение устройства:  y = ${position.y} x = ${position.x},`
      );

      let pos = this.triangulate(beacons1);
      console.log(
        `Триллатерация предполагаемое местоположение устройства: y = ${pos.y} x = ${pos.x}, `
      );

      this.devicePosition.y = pos.y;
      this.devicePosition.x = pos.x;

      // this.devicePosition.y = position.y;
      // this.devicePosition.x = position.x;
      this.updateDevicePosition(this.devicePosition);
    },
  },
};
</script>

<style scoped>
#map {
  height: 800px;
  width: auto;
  border: 1px solid cornflowerblue;
  margin-top: 20px;

  background-color: white; /* Задаем цвет фона для контейнера карты */
}
@media (max-width: 767px) {
  #map {
    height: 500px;
  }
}
</style>
